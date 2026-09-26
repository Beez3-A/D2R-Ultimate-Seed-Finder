
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import {
  METRICS,LABELS,defaultConfig,setConfig,initEngine,objectsSanity,
  runRegression,runPreflight,evalSeed,randomSeed,rankRows,friendlyRankRating
} from "./engine.mjs";

const args=process.argv.slice(2);
function arg(name,def=null) {
  const i=args.indexOf(name);
  return i>=0 && i+1<args.length ? args[i+1] : def;
}
const mode=arg("--mode","dashboard");
const dataDir=path.resolve(arg("--data-dir",path.join(process.cwd(),"Data")));
const payloadRaw=arg("--payload","");
const payload=payloadRaw ? JSON.parse(Buffer.from(payloadRaw,"base64").toString("utf8")) : {};

fs.mkdirSync(dataDir,{recursive:true});
const dbPath=path.join(dataDir,"seedfinder.sqlite");
const settingsPath=path.join(dataDir,"settings.json");

function emit(type,data={}) {
  process.stdout.write("@@EVENT@@"+JSON.stringify({type,...data})+"\n");
}

function loadSettings() {
  const d=defaultConfig();
  try {
    const u=JSON.parse(fs.readFileSync(settingsPath,"utf8"));
    return {...d,...u,weights:{...d.weights,...(u.weights??{})}};
  } catch {
    return d;
  }
}

function saveSettings(settings) {
  const d=defaultConfig();
  const merged={...d,...settings,weights:{...d.weights,...(settings.weights??{})}};
  fs.writeFileSync(settingsPath,JSON.stringify(merged,null,2));
  return merged;
}

function openDb() {
  const db=new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode=WAL;
    PRAGMA synchronous=NORMAL;
    CREATE TABLE IF NOT EXISTS tested_seeds (
      seed INTEGER PRIMARY KEY,
      scanned_at TEXT NOT NULL,
      valid INTEGER NOT NULL,
      reason TEXT
    );
    CREATE TABLE IF NOT EXISTS candidates (
      seed INTEGER PRIMARY KEY,
      metrics_json TEXT NOT NULL,
      details_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      requested INTEGER NOT NULL,
      checked INTEGER NOT NULL DEFAULT 0,
      valid INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS legacy_imports (
      source_hash TEXT PRIMARY KEY,
      source_name TEXT NOT NULL,
      imported_at TEXT NOT NULL,
      checked INTEGER NOT NULL DEFAULT 0,
      valid INTEGER NOT NULL DEFAULT 0,
      has_run_totals INTEGER NOT NULL DEFAULT 0
    );
  `);
  return db;
}

function candidateRows(db) {
  return db.prepare("SELECT seed,metrics_json,details_json FROM candidates").all().map(r=>({
    seed:Number(r.seed),
    metrics:JSON.parse(r.metrics_json),
    details:JSON.parse(r.details_json)
  }));
}

function dashboard(db,settings) {
  setConfig(settings);
  const rows=candidateRows(db);
  const ranked=rankRows(rows);

  const tracked=Number(db.prepare("SELECT COUNT(*) AS n FROM tested_seeds").get().n);
  const valid=Number(db.prepare("SELECT COUNT(*) AS n FROM candidates").get().n);

  const nativeStats=db.prepare(`
    SELECT
      COALESCE(SUM(checked),0) AS checked,
      COALESCE(SUM(valid),0) AS valid
    FROM runs
    WHERE status IN ('completed','stopped')
  `).get();

  const importStats=db.prepare(`
    SELECT
      COALESCE(SUM(checked),0) AS checked,
      COALESCE(SUM(valid),0) AS valid,
      COALESCE(SUM(CASE WHEN has_run_totals=1 THEN 1 ELSE 0 END),0) AS complete_imports,
      COUNT(*) AS imports
    FROM legacy_imports
  `).get();

  const nativeChecked=Number(nativeStats.checked||0);
  const importedChecked=Number(importStats.checked||0);
  const represented=nativeChecked+importedChecked;

  // If this database came from GUI v1.0, it may already contain imported
  // candidates but no legacy_imports record yet. In that case we intentionally
  // do NOT claim that those candidate IDs are the complete set of tested seeds.
  const hasUnaccountedLegacy=
    valid>0 &&
    represented===0 &&
    tracked===valid;

  const yieldValue=
    represented>0 ? 100*valid/represented : null;

  const lastRun=db.prepare(
    "SELECT started_at,finished_at,requested,checked,valid,status FROM runs ORDER BY id DESC LIMIT 1"
  ).get() ?? null;

  const top=ranked.slice(0,10).map((r,i)=>({
    rank:i+1,
    dreamRating:friendlyRankRating(i+1),
    seed:r.seed,
    overall:r.overall,
    eliteCount:r.eliteCount,
    worstMetric:r.worstMetric,
    worstLabel:LABELS[r.worstMetric],
    metrics:r.metrics,
    percentiles:r.percentiles,
    details:r.details
  }));

  return {
    settings,
    totals:{
      represented,
      tracked,
      valid,
      yield:yieldValue,
      nativeChecked,
      importedChecked,
      imports:Number(importStats.imports||0),
      completeImports:Number(importStats.complete_imports||0),
      hasUnaccountedLegacy
    },
    lastRun,
    top
  };
}
function csvParse(text) {
  const rows=[];
  let row=[],field="",q=false;
  for (let i=0;i<text.length;i++) {
    const c=text[i];
    if (q) {
      if (c === '"') {
        if (text[i+1] === '"') {field+='"';i++;}
        else q=false;
      } else field+=c;
    } else {
      if (c === '"') q=true;
      else if (c === ",") {row.push(field);field="";}
      else if (c === "\n") {row.push(field.replace(/\r$/,""));rows.push(row);row=[];field="";}
      else field+=c;
    }
  }
  if (field.length||row.length){row.push(field);rows.push(row);}
  return rows;
}

function legacyRunTotals(csvFile,importedRows) {
  const dir=path.dirname(csvFile);
  const candidates=[
    path.join(dir,"run_summary.txt"),
    path.join(dir,"best_overall_seeds.txt")
  ];

  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;

    try {
      const txt=fs.readFileSync(p,"utf8");
      const checkedMatch=txt.match(/Seeds checked:\s*([\d,\s\u00a0]+)/i);
      const validMatch=txt.match(/Valid dream-seed candidates:\s*([\d,\s\u00a0]+)/i);
      const clean=x=>Number(String(x||"").replace(/[^\d]/g,""));

      const checked=clean(checkedMatch?.[1]);
      const valid=clean(validMatch?.[1]);

      if (checked>0 && valid>=0)
        return {checked,valid,hasRunTotals:true,source:path.basename(p)};
    } catch {}
  }

  return {
    checked:importedRows,
    valid:importedRows,
    hasRunTotals:false,
    source:null
  };
}

function importV06Csv(db,file) {
  const text=fs.readFileSync(file,"utf8");
  const rows=csvParse(text);
  if (rows.length<2) throw new Error("CSV has no data rows.");

  const h=rows[0];
  const idx=Object.fromEntries(h.map((x,i)=>[x,i]));
  for (const req of ["seed",...METRICS]) {
    if (!(req in idx)) throw new Error(`Not a v0.6 all_valid_seeds.csv: missing ${req}`);
  }

  const sourceHash=crypto.createHash("sha256").update(text).digest("hex");
  const oldImport=db.prepare(
    "SELECT checked,valid,has_run_totals FROM legacy_imports WHERE source_hash=?"
  ).get(sourceHash);

  const insC=db.prepare(`
    INSERT OR REPLACE INTO candidates(seed,metrics_json,details_json,created_at)
    VALUES(?,?,?,?)
  `);
  const insT=db.prepare(`
    INSERT OR IGNORE INTO tested_seeds(seed,scanned_at,valid,reason)
    VALUES(?,?,1,'imported-v0.6')
  `);

  let imported=0;
  db.exec("BEGIN");
  try {
    for (let ri=1;ri<rows.length;ri++) {
      const r=rows[ri];
      if (!r.length || !r[idx.seed]) continue;
      const seed=Number(r[idx.seed]);
      if (!Number.isFinite(seed)) continue;

      const metrics={};
      for (const m of METRICS) metrics[m]=Number(r[idx[m]]);

      const details={
        pitSource:r[idx.pit_best_waypoint] ?? "",
        trueTombId:Number(r[idx.true_tomb_id] ?? 0),
        trueTombName:r[idx.true_tomb_name] ?? "",
        countessEntrance:Number(r[idx.countess_entrance] ?? metrics.countess),
        blackMarshWaypointRoom:Number(r[idx.black_marsh_waypoint_room] ?? 0),
        stonyFieldWaypointRoom:Number(r[idx.stony_field_waypoint_room] ?? 0),
        wsk2WaypointBlock:r[idx.wsk2_waypoint_block] ?? "",
        durielCanyon:Number(r[idx.duriel_canyon] ?? 0),
        durielTomb:Number(r[idx.duriel_tomb] ?? 0),
        lkWpCamp1:Number(r[idx.lk_wp_camp1] ?? 0),
        lkCamp1Camp2:Number(r[idx.lk_camp1_camp2] ?? 0),
        wsk2:Number(r[idx.wsk2] ?? 0),
        wsk3:Number(r[idx.wsk3] ?? 0)
      };

      const now=new Date().toISOString();
      insC.run(seed,JSON.stringify(metrics),JSON.stringify(details),now);
      insT.run(seed,now);
      imported++;
    }

    if (!oldImport) {
      const totals=legacyRunTotals(file,imported);
      db.prepare(`
        INSERT INTO legacy_imports(
          source_hash,source_name,imported_at,checked,valid,has_run_totals
        ) VALUES(?,?,?,?,?,?)
      `).run(
        sourceHash,
        path.basename(file),
        new Date().toISOString(),
        totals.checked,
        totals.valid,
        totals.hasRunTotals?1:0
      );
    }

    db.exec("COMMIT");
  } catch (e) {
    try {db.exec("ROLLBACK");} catch {}
    throw e;
  }

  const totals=oldImport
    ? {
        checked:Number(oldImport.checked),
        valid:Number(oldImport.valid),
        hasRunTotals:Boolean(oldImport.has_run_totals),
        source:null
      }
    : legacyRunTotals(file,imported);

  return {
    imported,
    alreadyCounted:Boolean(oldImport),
    runTotals:totals
  };
}
await initEngine();
const db=openDb();

if (mode==="save-settings") {
  const settings=saveSettings(payload.settings??{});
  emit("settings-saved",{settings});
  db.close();
  process.exit(0);
}

if (mode==="dashboard") {
  const settings=loadSettings();
  emit("dashboard",dashboard(db,settings));
  db.close();
  process.exit(0);
}

if (mode==="import") {
  const settings=loadSettings();
  const file=path.resolve(payload.file);
  const result=importV06Csv(db,file);
  emit("import-complete",{...result,dashboard:dashboard(db,settings)});
  db.close();
  process.exit(0);
}

if (mode!=="scan") {
  emit("fatal",{message:`Unknown mode: ${mode}`});
  db.close();
  process.exit(2);
}

const settings=saveSettings(payload.settings??loadSettings());
setConfig(settings);
const requested=Math.max(1,Math.trunc(Number(payload.seedsToScan??settings.seedsToScore??5000)));

emit("phase",{name:"validation",message:"Validating scanner calibration…"});

const sanity=objectsSanity();
emit("sanity",sanity);
if (!sanity.ok) {
  emit("fatal",{message:"Objects.txt sanity check failed.",details:sanity});
  db.close(); process.exit(3);
}

const regression=runRegression();
emit("regression",regression);
if (!regression.ok) {
  emit("fatal",{message:"Hidden-waypoint regression failed.",details:regression});
  db.close(); process.exit(3);
}

const preflight=runPreflight((metric,result)=>{
  emit("preflight-metric",{metric,label:LABELS[metric],...result});
});
emit("preflight-complete",preflight);
if (!preflight.ok) {
  emit("fatal",{message:"One or more route preflight checks failed.",details:preflight});
  db.close(); process.exit(3);
}

let stopRequested=false;
process.stdin.setEncoding("utf8");
process.stdin.on("data",chunk=>{
  if (String(chunk).toUpperCase().includes("STOP")) stopRequested=true;
});

const startedAt=new Date().toISOString();
const runInfo=db.prepare(`
  INSERT INTO runs(started_at,requested,status) VALUES(?,?,?)
`).run(startedAt,requested,"running");
const runId=Number(runInfo.lastInsertRowid);

const existsStmt=db.prepare("SELECT 1 AS yes FROM tested_seeds WHERE seed=?");
const insTest=db.prepare(`
  INSERT INTO tested_seeds(seed,scanned_at,valid,reason) VALUES(?,?,?,?)
`);
const insCandidate=db.prepare(`
  INSERT OR REPLACE INTO candidates(seed,metrics_json,details_json,created_at)
  VALUES(?,?,?,?)
`);

const initialTested=Number(db.prepare("SELECT COUNT(*) AS n FROM tested_seeds").get().n);
let checked=0,valid=0,generated=0,skippedDuplicates=0;
const reasons={};
const t0=Date.now();

emit("phase",{name:"scan",message:`Scanning ${requested.toLocaleString()} new unique seeds…`});

db.exec("BEGIN");
let pending=0;

try {
  while (checked<requested && !stopRequested) {
    const seed=randomSeed();
    generated++;
    if (existsStmt.get(seed)) {
      skippedDuplicates++;
      continue;
    }

    let result;
    let reason=null;
    try {
      result=evalSeed(seed);
      if (!result.valid) reason=result.reason || "rejected";
    } catch (e) {
      result={valid:false};
      reason="exception";
    }

    const now=new Date().toISOString();
    insTest.run(seed,now,result.valid?1:0,reason);

    checked++;
    pending++;

    if (result.valid) {
      valid++;
      insCandidate.run(
        seed,
        JSON.stringify(result.metrics),
        JSON.stringify(result.details),
        now
      );
    } else {
      reasons[reason]=(reasons[reason]||0)+1;
    }

    if (pending>=100) {
      db.exec("COMMIT");
      db.exec("BEGIN");
      pending=0;
    }

    if (checked%25===0 || checked===requested) {
      const elapsed=Math.max(0.001,(Date.now()-t0)/1000);
      emit("progress",{
        checked,requested,valid,
        yield:100*valid/Math.max(1,checked),
        speed:checked/elapsed,
        skippedDuplicates,
        totalTested:initialTested+checked
      });
      await new Promise(resolve=>setImmediate(resolve));
    }
  }

  db.exec("COMMIT");
} catch (e) {
  try {db.exec("ROLLBACK");} catch {}
  db.prepare("UPDATE runs SET finished_at=?,checked=?,valid=?,status=? WHERE id=?")
    .run(new Date().toISOString(),checked,valid,"error",runId);
  emit("fatal",{message:String(e?.stack||e)});
  db.close();
  process.exit(4);
}

const status=stopRequested ? "stopped" : "completed";
db.prepare("UPDATE runs SET finished_at=?,checked=?,valid=?,status=? WHERE id=?")
  .run(new Date().toISOString(),checked,valid,status,runId);

emit("phase",{name:"ranking",message:"Re-ranking the persistent seed database…"});
const dash=dashboard(db,settings);
emit("scan-complete",{
  status,checked,valid,reasons,skippedDuplicates,
  dashboard:dash
});

db.close();
