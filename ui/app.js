
const METRICS=[
  ["andariel","Andariel"],
  ["countess","Forgotten Tower / Countess"],
  ["pit","The Pit"],
  ["tristram","Stony → Cairn Stones / Tristram"],
  ["duriel","Duriel / True Tomb"],
  ["mephisto","Mephisto"],
  ["lowerKurast","Lower Kurast"],
  ["threshSocket","Thresh Socket"],
  ["baal","Worldstone / Baal"]
];

const WEIGHT_PRESETS={
  balanced:{
    andariel:1.0,countess:1.0,pit:1.0,tristram:1.0,duriel:1.0,
    mephisto:1.0,lowerKurast:1.0,threshSocket:1.0,baal:1.0
  },
  boss:{
    andariel:2.0,countess:1.2,pit:0.5,tristram:0.7,duriel:1.5,
    mephisto:2.5,lowerKurast:0.5,threshSocket:0.8,baal:2.5
  },
  runes:{
    andariel:0.5,countess:2.5,pit:1.0,tristram:0.5,duriel:0.5,
    mephisto:0.8,lowerKurast:3.0,threshSocket:0.5,baal:0.7
  }
};

let state={dashboard:null,selected:null,running:false,settings:null};

const $=id=>document.getElementById(id);
const fmt=n=>Number(n||0).toLocaleString();
const one=n=>Number(n).toFixed(1);
const pct=n=>(100*Number(n||0)).toFixed(1)+"%";

function toast(msg){
  const el=$("toast");el.textContent=msg;el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"),1800);
}

function weightsMatchPreset(weights,preset){
  const target=WEIGHT_PRESETS[preset];
  if(!target)return false;
  return METRICS.every(([m])=>Math.abs(Number(weights?.[m]??1)-target[m])<1e-9);
}

function inferPreset(weights){
  for(const p of ["balanced","boss","runes"]) if(weightsMatchPreset(weights,p)) return p;
  return "custom";
}

function setPresetActive(name){
  document.querySelectorAll(".preset-btn").forEach(btn=>
    btn.classList.toggle("active",btn.dataset.preset===name)
  );
}

function readSettings(){
  const weights={};
  for(const [m] of METRICS) weights[m]=Number($(`w_${m}`).value);
  return {
    ...(state.settings||{}),
    seedsToScore:Number($("seedCount").value)||5000,
    weights
  };
}

function buildWeights(settings){
  const grid=$("weightsGrid");
  setPresetActive(inferPreset(settings?.weights));
  grid.innerHTML="";
  for(const [m,label] of METRICS){
    const v=Number(settings?.weights?.[m]??1);
    const div=document.createElement("div");
    div.className="weight-row";
    div.innerHTML=`
      <div class="weight-top"><span>${label}</span><span class="weight-value" id="wv_${m}">${v.toFixed(1)}×</span></div>
      <input id="w_${m}" type="range" min="0" max="3" step="0.1" value="${v}">
    `;
    grid.appendChild(div);
    div.querySelector("input").addEventListener("input",e=>{
      $(`wv_${m}`).textContent=Number(e.target.value).toFixed(1)+"×";
      setPresetActive("custom");
    });
    div.querySelector("input").addEventListener("change",saveWeightsSoon);
  }
}

let saveTimer=null;
function saveWeightsSoon(){
  clearTimeout(saveTimer);
  saveTimer=setTimeout(async()=>{
    state.settings=readSettings();
    await window.seedFinder.saveSettings(state.settings);
    await loadDashboard(false);
  },250);
}

function renderDashboard(dash){
  if(!dash)return;
  state.dashboard=dash;
  state.settings=dash.settings;
  $("seedCount").value=dash.settings?.seedsToScore??5000;
  if(!$("weightsGrid").children.length) buildWeights(dash.settings);

  const totals=dash.totals||{};
  $("totalEvaluated").textContent=totals.represented>0?fmt(totals.represented):"—";
  $("totalTracked").textContent=fmt(totals.tracked||0);
  $("totalValid").textContent=fmt(totals.valid||0);
  $("yieldStat").textContent=totals.yield==null?"—":one(totals.yield)+"%";
  $("bestSeed").textContent=dash.top?.[0]?.seed??"—";

  if(totals.hasUnaccountedLegacy){
    $("evaluatedNote").textContent="Legacy candidates detected — re-import the same v0.6 CSV once to restore the original run total.";
    $("yieldNote").textContent="Unavailable until the legacy run total is restored.";
  }else{
    const imported=Number(totals.importedChecked||0);
    const native=Number(totals.nativeChecked||0);
    $("evaluatedNote").textContent=
      imported>0
        ? `${fmt(imported)} from legacy runs + ${fmt(native)} from GUI scans`
        : `${fmt(native)} from GUI scans`;
    $("yieldNote").textContent=
      totals.represented>0
        ? "valid candidates ÷ represented evaluations"
        : "starts after your first scan/import";
  }

  const body=$("leaderboardBody");
  if(!dash.top?.length){
    body.innerHTML=`<tr><td colspan="6" class="empty">No candidates stored yet. Start a scan or import your v0.6 all_valid_seeds.csv.</td></tr>`;
    return;
  }

  body.innerHTML="";
  dash.top.forEach(row=>{
    const tr=document.createElement("tr");
    tr.dataset.seed=row.seed;
    tr.innerHTML=`
      <td class="rank">#${row.rank}</td>
      <td class="seed">${row.seed}</td>
      <td><span class="rating">${row.dreamRating.toFixed(1)}</span><span class="muted"> / 10</span></td>
      <td><span class="badge elite">${row.eliteCount}/9</span></td>
      <td>${row.worstLabel}</td>
      <td class="numeric">${row.overall.toFixed(2)}</td>
    `;
    tr.addEventListener("click",()=>selectSeed(row));
    body.appendChild(tr);
  });

  const selectedSeed=state.selected?.seed;
  const still=dash.top.find(x=>x.seed===selectedSeed);
  selectSeed(still||dash.top[0]);
}

function selectSeed(row){
  if(!row)return;
  state.selected=row;
  document.querySelectorAll("#leaderboardBody tr").forEach(tr=>
    tr.classList.toggle("selected",Number(tr.dataset.seed)===Number(row.seed))
  );
  $("detailsEmpty").classList.add("hidden");
  $("detailsContent").classList.remove("hidden");
  $("detailSeed").textContent=row.seed;
  $("detailRating").textContent=row.dreamRating.toFixed(1)+" / 10";
  $("detailRank").textContent="#"+row.rank;
  $("detailOverall").textContent=row.overall.toFixed(2);

  const cards=$("routeCards");
  cards.innerHTML="";
  for(const [m,label] of METRICS){
    const p=Number(row.percentiles[m]??1);
    const div=document.createElement("div");
    div.className="route-card";
    if(p<=0.10)div.classList.add("elite");
    if(m===row.worstMetric)div.classList.add("weak");
    const routeRating=Math.max(0,Math.min(10,10*(1-p)));
    const beats=Math.max(0,Math.min(100,100*(1-p)));
    div.innerHTML=`
      <div class="route-name">${label}${p<=.10?' · ELITE':''}${m===row.worstMetric?' · WEAKEST':''}</div>
      <div class="route-raw"><strong>${one(row.metrics[m])}</strong><span>distance proxy ↓</span></div>
      <div class="route-pct"><strong>${routeRating.toFixed(1)} / 10</strong><span>beats ${beats.toFixed(1)}%</span></div>
    `;
    cards.appendChild(div);
  }

  const d=row.details||{};
  const tech=[
    ["Pit approach",d.pitSource],
    ["Black Marsh WP room",d.blackMarshWaypointRoom],
    ["Stony Field WP room",d.stonyFieldWaypointRoom],
    ["WSK2 WP block",d.wsk2WaypointBlock],
    ["True Tomb",`${d.trueTombName||""}${d.trueTombId?` · area ${d.trueTombId}`:""}`],
    ["Duriel: Canyon → Tomb",num(d.durielCanyon)],
    ["Duriel: Tomb → Orifice",num(d.durielTomb)],
    ["LK: WP → Camp 1",num(d.lkWpCamp1)],
    ["LK: Camp 1 → Camp 2",num(d.lkCamp1Camp2)],
    ["WSK2 segment",num(d.wsk2)],
    ["WSK3 segment",num(d.wsk3)]
  ];
  $("technicalDetails").innerHTML=`<div class="tech-grid">${
    tech.map(([k,v])=>`<div class="tech-item"><span>${k}</span><strong>${v??"—"}</strong></div>`).join("")
  }</div>`;
}
function num(v){return Number.isFinite(Number(v))?Number(v).toFixed(1):"—"}

async function loadDashboard(rebuildWeights=true){
  try{
    const d=await window.seedFinder.loadDashboard();
    if(rebuildWeights){
      state.settings=d.settings;
      buildWeights(d.settings);
    }
    renderDashboard(d);
  }catch(e){toast(String(e.message||e))}
}

function chip(text,ok){
  const div=document.createElement("span");
  div.className="check-chip "+(ok?"pass":"fail");
  div.textContent=(ok?"✓ ":"✕ ")+text;
  $("validationStrip").appendChild(div);
}

window.seedFinder.onScanEvent(evt=>{
  if(evt.type==="phase"){
    $("phaseText").textContent=evt.message;
  } else if(evt.type==="sanity"){
    chip("Objects.txt",evt.ok);
  } else if(evt.type==="regression"){
    for(const r of evt.results) chip(r.label+" regression",r.ok);
    chip("Countess anti-zero",evt.antiZero);
  } else if(evt.type==="preflight-metric"){
    chip(evt.label,evt.ok);
  } else if(evt.type==="progress"){
    const q=Math.max(0,Math.min(1,evt.checked/Math.max(1,evt.requested)));
    $("progressBar").style.width=(100*q).toFixed(1)+"%";
    $("progressText").textContent=`${fmt(evt.checked)} / ${fmt(evt.requested)} · ${fmt(evt.valid)} valid`;
    $("speedText").textContent=`${one(evt.speed)} seeds/sec`;
    $("totalTracked").textContent=fmt(evt.totalTested);
  } else if(evt.type==="scan-complete"){
    state.running=false;
    setRunning(false);
    renderDashboard(evt.dashboard);
    $("phaseText").textContent=evt.status==="completed"?"Scan complete.":"Scan stopped safely. Results were kept.";
    toast(`Added ${fmt(evt.valid)} valid candidates from ${fmt(evt.checked)} new seeds.`);
  } else if(evt.type==="fatal"){
    state.running=false;setRunning(false);
    $("phaseText").textContent="Stopped: "+evt.message;
    toast(evt.message);
  } else if(evt.type==="worker-exit"){
    if(state.running && evt.code!==0){
      state.running=false;setRunning(false);
    }
  }
});

function setRunning(on){
  state.running=on;
  $("startBtn").disabled=on;
  $("stopBtn").disabled=!on;
  $("seedCount").disabled=on;
}

$("startBtn").addEventListener("click",async()=>{
  try{
    $("validationStrip").innerHTML="";
    $("progressBar").style.width="0";
    $("progressText").textContent="0 / 0";
    $("speedText").textContent="— seeds/sec";
    state.settings=readSettings();
    await window.seedFinder.saveSettings(state.settings);
    setRunning(true);
    await window.seedFinder.startScan({
      seedsToScan:Number($("seedCount").value)||5000,
      settings:state.settings
    });
  }catch(e){
    setRunning(false);toast(String(e.message||e));
  }
});

$("stopBtn").addEventListener("click",async()=>{
  $("phaseText").textContent="Stopping safely after the current seed…";
  await window.seedFinder.stopScan();
});

$("importBtn").addEventListener("click",async()=>{
  try{
    const r=await window.seedFinder.importV06();
    if(r?.canceled)return;
    if(r?.dashboard) renderDashboard(r.dashboard);
    if(r.alreadyCounted){
      toast(`This legacy CSV was already counted. ${fmt(r.imported)} candidates refreshed.`);
    }else if(r.runTotals?.hasRunTotals){
      toast(`Imported ${fmt(r.imported)} candidates from a ${fmt(r.runTotals.checked)}-seed v0.6 run.`);
    }else{
      toast(`Imported ${fmt(r.imported)} candidates. Original checked total was not found.`);
    }
  }catch(e){toast(String(e.message||e))}
});

$("dataBtn").addEventListener("click",()=>window.seedFinder.openDataFolder());

$("copySeedBtn").addEventListener("click",async()=>{
  if(!state.selected)return;
  await window.seedFinder.copySeed(state.selected.seed);
  toast(`Copied seed ${state.selected.seed}`);
});

document.querySelectorAll(".preset-btn").forEach(btn=>{
  btn.addEventListener("click",async()=>{
    const name=btn.dataset.preset;
    if(name==="custom"){
      setPresetActive("custom");
      return;
    }
    const preset=WEIGHT_PRESETS[name];
    for(const [m] of METRICS){
      $(`w_${m}`).value=preset[m];
      $(`wv_${m}`).textContent=Number(preset[m]).toFixed(1)+"×";
    }
    setPresetActive(name);
    state.settings=readSettings();
    await window.seedFinder.saveSettings(state.settings);
    await loadDashboard(false);
    const label=name==="boss"?"Boss Farming":name==="runes"?"Rune Farming":"Balanced";
    toast(`${label} preset applied.`);
  });
});

$("seedCount").addEventListener("change",async()=>{
  state.settings=readSettings();
  await window.seedFinder.saveSettings(state.settings);
});

(async()=>{
  const info=await window.seedFinder.buildInfo();
  $("versionText").textContent=`GUI v${info.version}`;
  await loadDashboard(true);
})();
