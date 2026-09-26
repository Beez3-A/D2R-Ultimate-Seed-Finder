
import { init, open, objectName } from "libd2";

export const LEVEL = {
  StonyField: 4,
  BlackMarsh: 6,
  TamoeHighland: 7,
  PitLevel1: 12,
  PitLevel2: 16,
  ForgottenTower: 20,
  OuterCloister: 27,
  Catacombs2: 35,
  Catacombs3: 36,
  Catacombs4: 37,

  CanyonOfTheMagi: 46,
  Tomb1: 66,
  Tomb7: 72,

  LowerKurast: 79,
  Durance2: 101,
  Durance3: 102,

  ArreatPlateau: 112,
  CrystallinePassage: 113,
  WorldstoneKeep2: 129,
  WorldstoneKeep3: 130,
  ThroneOfDestruction: 131
};

export const OBJECT = {
  TalRashaOrifice: 152,
  LowerKurastCampfire: 160,
  CairnStoneMin: 17,
  CairnStoneMax: 22
};

export const METRICS = [
  "andariel",
  "countess",
  "pit",
  "tristram",
  "duriel",
  "mephisto",
  "lowerKurast",
  "threshSocket",
  "baal"
];

export const LABELS = {
  andariel: "Andariel",
  countess: "Forgotten Tower / Countess",
  pit: "The Pit",
  tristram: "Stony → Cairn Stones / Tristram",
  duriel: "Duriel / True Tomb",
  mephisto: "Mephisto",
  lowerKurast: "Lower Kurast",
  threshSocket: "Thresh Socket",
  baal: "Worldstone / Baal"
};

export function defaultConfig() {
  return {
    seedsToScore: 5000,
    topResults: 100,
    requireTwoLowerKurastCampfires: true,
    requireLowerKurastCampsRightOfWaypoint: true,
    overallMeanWeight: 0.75,
    overallWorstRouteWeight: 0.25,
    weights: Object.fromEntries(METRICS.map(m => [m, 1]))
  };
}

let CONFIG = defaultConfig();

export function setConfig(user={}) {
  const d=defaultConfig();
  CONFIG={
    ...d,
    ...user,
    weights:{...d.weights,...(user.weights??{})}
  };
  return CONFIG;
}

export function getConfig() {
  return JSON.parse(JSON.stringify(CONFIG));
}

function withGame(seed, fn) {
  const game=open({seed,difficulty:"hell"});
  try {
    return fn(game);
  } finally {
    try { game.close(); } catch {}
  }
}

function isTrueObjectPreset(o) {
  // v0.4 patched records have etype. Retain compatibility if libd2 later
  // returns only Objects.txt units without that field.
  return o && (o.etype === 2 || o.etype === undefined);
}

function actualObjects(area) {
  return area.objects.filter(isTrueObjectPreset);
}


function waypoint(area) {
  // Normal generated waypoint Objects.txt presets (indoor maps and the acts
  // where libd2 exposes them directly).
  const candidates = actualObjects(area).filter(o =>
    String(o.name ?? "").toLowerCase().includes("waypoint")
  );
  return candidates[0]?.location ?? null;
}


/*
Hidden waypoint handling
========================

ACT I
-----
Stony Field and Black Marsh do not expose their outdoor waypoint as a normal
Objects.txt waypoint preset through libd2.

The production detector below is based on the targeted v0.5.5 calibration:
- 20 deterministic Stony Field maps;
- 20 deterministic Black Marsh maps;
- 40 Blood Moor / Tamoe Highland negative-control maps;
- every known exit/entrance room excluded BEFORE matching.

Selected one-key signatures:
  Stony Field : binary|10|19d7f41d
  Black Marsh : low8|15|41a3915d

The exact Black Marsh regression seed 586870917 resolves to room 16; the
Forgotten Tower entrance room 26 is explicitly an exit room and is therefore
forbidden. This fixes the v0.5 false zero-distance Countess result.

WORLDSTONE KEEP 2
-----------------
LvlPrest defines Baal waypoint pieces as 16x16-tile presets. libd2 exposes
WSK maze rooms as 8x8 tiles, so one Baal waypoint preset occupies a 2x2 room
block. The v0.5.4 structural calibration resolved all 20 WSK2 test maps with
two binary 80x80-subtile signatures, while rejecting signatures present in
WSK1/WSK3 controls.

These detectors identify the containing waypoint ROOM/BLOCK. libd2 still does
not expose the exact hidden waypoint object coordinate, so scoring uses the
centre of the detected room/block. Any zero-match or multi-match seed is
rejected rather than guessed.
*/

const ACT1_WAYPOINT_SIGNATURES = {
  [LEVEL.StonyField]: {mode:"binary", size:10, hash:"19d7f41d"},
  [LEVEL.BlackMarsh]: {mode:"low8", size:15, hash:"41a3915d"}
};

const WSK2_WAYPOINT_BLOCK_HASHES = new Set([
  "19c5079d",
  "0b992d14"
]);

function fnv16(values) {
  let h=2166136261>>>0;
  for (const v0 of values) {
    const v=Number(v0)>>>0;
    h^=(v&255); h=Math.imul(h,16777619)>>>0;
    h^=((v>>>8)&255); h=Math.imul(h,16777619)>>>0;
  }
  return h.toString(16).padStart(8,"0");
}

function squareTransformAt(mat,t,y,x) {
  const n=mat.length;
  switch(t) {
    case 0:return mat[y][x];
    case 1:return mat[n-1-x][y];
    case 2:return mat[n-1-y][n-1-x];
    case 3:return mat[x][n-1-y];
    case 4:return mat[y][n-1-x];
    case 5:return mat[n-1-x][n-1-y];
    case 6:return mat[n-1-y][x];
    case 7:return mat[x][y];
  }
}

function canonicalSquareHash(mat) {
  const n=mat.length;
  let best=null;

  for (let t=0;t<8;t++) {
    const vals=[];
    for (let y=0;y<n;y++)
      for (let x=0;x<n;x++)
        vals.push(squareTransformAt(mat,t,y,x));

    const h=fnv16(vals);
    if (best===null || h<best) best=h;
  }

  return best;
}

function roomIndexForLocalPoint(area,x,y) {
  const tx=area.origin.x + Number(x)/5;
  const ty=area.origin.y + Number(y)/5;

  for (let i=0;i<area.rooms.length;i++) {
    const r=area.rooms[i];
    if (tx>=r.x && tx<r.x+r.width &&
        ty>=r.y && ty<r.y+r.height)
      return i;
  }

  return null;
}

function exitRoomSet(area) {
  const out=new Set();

  for (const e of area.exits) {
    for (const p of e.points ?? []) {
      const ri=roomIndexForLocalPoint(area,p.x,p.y);
      if (ri!==null) out.add(ri);
    }
  }

  return out;
}

function roomCollisionMatrix(area,room,size,mode) {
  const grid=area.collision;
  const n=Math.min(size,Math.trunc(room.width*5),Math.trunc(room.height*5));
  if (n<=0) return null;

  const roomX=Math.trunc((room.x-area.origin.x)*5);
  const roomY=Math.trunc((room.y-area.origin.y)*5);
  const sx=roomX+Math.trunc((room.width*5-n)/2);
  const sy=roomY+Math.trunc((room.height*5-n)/2);

  const mat=[];

  for (let y=0;y<n;y++) {
    const row=[];
    for (let x=0;x<n;x++) {
      const gx=sx+x, gy=sy+y;
      let v=0xffff;

      if (gx>=0 && gy>=0 && gx<grid.width && gy<grid.height)
        v=Number(grid.cells[gy*grid.width+gx])>>>0;

      if (mode==="binary") v=v===0 ? 0 : 1;
      else if (mode==="low8") v=v&255;

      row.push(v);
    }
    mat.push(row);
  }

  return mat;
}

function act1OutdoorWaypoint(area) {
  const sig=ACT1_WAYPOINT_SIGNATURES[area.id];
  if (!sig) return null;

  const grid=area.collision;
  if (!grid?.cells || !Number.isFinite(grid.width) || !Number.isFinite(grid.height))
    return null;

  const forbidden=exitRoomSet(area);
  const hits=[];

  area.rooms.forEach((room,index)=>{
    if (forbidden.has(index)) return;

    const mat=roomCollisionMatrix(area,room,sig.size,sig.mode);
    if (!mat) return;

    const hash=canonicalSquareHash(mat);
    if (hash!==sig.hash) return;

    hits.push({index,room,hash});
  });

  if (hits.length!==1) return null;

  const hit=hits[0];
  const room=hit.room;

  return {
    point:{
      x:(room.x+room.width/2-area.origin.x)*5,
      y:(room.y+room.height/2-area.origin.y)*5
    },
    roomIndex:hit.index,
    room:{
      x:room.x,y:room.y,width:room.width,height:room.height,
      type:room.type,presetType:room.presetType,pickedFile:room.pickedFile
    },
    matchedKey:`${sig.mode}|${sig.size}|${sig.hash}`,
    forbiddenExitRooms:[...forbidden]
  };
}

function roomCoordMap(area) {
  const out=new Map();
  area.rooms.forEach((r,index)=>out.set(`${r.x},${r.y}`,{index,...r}));
  return out;
}

function blockCollisionMatrix(area,xTile,yTile) {
  const grid=area.collision;
  const sx=Math.trunc((xTile-area.origin.x)*5);
  const sy=Math.trunc((yTile-area.origin.y)*5);
  const n=80; // 16x16 tiles * 5 subtiles/tile
  const mat=[];

  for (let y=0;y<n;y++) {
    const row=[];
    for (let x=0;x<n;x++) {
      const gx=sx+x, gy=sy+y;
      let v=0xffff;

      if (gx>=0 && gy>=0 && gx<grid.width && gy<grid.height)
        v=Number(grid.cells[gy*grid.width+gx])>>>0;

      row.push(v===0 ? 0 : 1);
    }
    mat.push(row);
  }

  return mat;
}

function worldstone2Waypoint(area) {
  if (area.id!==LEVEL.WorldstoneKeep2) return null;

  const grid=area.collision;
  if (!grid?.cells || !Number.isFinite(grid.width) || !Number.isFinite(grid.height))
    return null;

  const by=roomCoordMap(area);
  const forbidden=exitRoomSet(area);
  const hits=[];

  for (const r of area.rooms) {
    // Baal waypoint LvlPrest pieces are 16x16 tiles. WSK maze rooms are 8x8,
    // therefore the preset is represented structurally as a complete 2x2 block.
    const a=by.get(`${r.x},${r.y}`);
    const b=by.get(`${r.x+8},${r.y}`);
    const c=by.get(`${r.x},${r.y+8}`);
    const d=by.get(`${r.x+8},${r.y+8}`);
    if (!a || !b || !c || !d) continue;

    if ([a,b,c,d].some(q=>q.width!==8 || q.height!==8))
      continue;

    const roomIndices=[a.index,b.index,c.index,d.index];
    if (roomIndices.some(i=>forbidden.has(i)))
      continue;

    const hash=canonicalSquareHash(blockCollisionMatrix(area,r.x,r.y));
    if (!WSK2_WAYPOINT_BLOCK_HASHES.has(hash))
      continue;

    hits.push({
      blockId:`${r.x},${r.y}`,
      x:r.x,
      y:r.y,
      roomIndices:[...roomIndices].sort((x,y)=>x-y),
      hash
    });
  }

  if (hits.length!==1) return null;

  const hit=hits[0];

  return {
    point:{
      x:(hit.x+8-area.origin.x)*5,
      y:(hit.y+8-area.origin.y)*5
    },
    blockId:hit.blockId,
    roomIndices:hit.roomIndices,
    matchedKey:`binary|80|${hit.hash}`,
    forbiddenExitRooms:[...forbidden]
  };
}

function xy(p) {
  if (!p) return null;
  const x = Number(p.x), y = Number(p.y);
  return Number.isFinite(x) && Number.isFinite(y) ? {x,y} : null;
}

function iso(p) {
  const q = xy(p);
  return q ? {sx:q.x-q.y, sy:(q.x+q.y)/2} : null;
}

function isoDist(a,b) {
  const A=iso(a), B=iso(b);
  if (!A || !B) return null;
  return Math.hypot(A.sx-B.sx, A.sy-B.sy);
}

function exitTo(area, targetId) {
  return area.exits.find(e => e.to?.id === targetId) ?? null;
}

function exitPoint(ex, reference=null) {
  if (!ex) return null;
  if (reference) {
    try {
      const p = ex.nearestTo(reference);
      if (p) return p;
    } catch {}
  }
  try {
    if (ex.points?.length) return ex.points[0];
  } catch {}
  return null;
}

function entryFrom(area, previousId) {
  const ex = exitTo(area, previousId);
  return exitPoint(ex, area.middle) ?? null;
}

// Geometry score through generated exits. Distances are comparable between
// seeds for the same farming route; the final overall score later converts
// each route to a percentile before combining them.
function geometryChain(game, startAreaId, startPos, nextAreas) {
  let areaId = startAreaId;
  let pos = startPos;
  let total = 0;

  for (const nextId of nextAreas) {
    const area = game.area(areaId);
    const out = exitPoint(exitTo(area, nextId), pos);
    if (!out) return null;

    const d = isoDist(pos, out);
    if (d == null) return null;
    total += d;

    const next = game.area(nextId);
    const entry = entryFrom(next, areaId);
    if (!entry) return null;

    pos = entry;
    areaId = nextId;
  }
  return {total, pos, areaId};
}

function uniqObjects(arr) {
  const out=[];
  for (const o of arr) {
    const x=Number(o.location?.x), y=Number(o.location?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (!out.some(q => q.x===x && q.y===y))
      out.push({x,y,classId:o.classId,name:o.name,etype:o.etype});
  }
  return out;
}

// ---------- TARGET METRICS ----------

function metricAndariel(game) {
  const a = game.area(LEVEL.Catacombs2);
  const start = waypoint(a);
  if (!start) return null;
  return geometryChain(game, LEVEL.Catacombs2, start, [
    LEVEL.Catacombs3,
    LEVEL.Catacombs4
  ])?.total ?? null;
}

function countessDetails(game,blackWpInfo=null) {
  const a=game.area(LEVEL.BlackMarsh);
  const wp=blackWpInfo ?? act1OutdoorWaypoint(a);
  const start=wp?.point ?? null;
  if (!start) return null;

  const tower=exitPoint(exitTo(a,LEVEL.ForgottenTower),start);
  if (!tower) return null;

  const entrance=isoDist(start,tower);
  if (entrance==null) return null;

  return {
    score:entrance,
    entrance,
    waypointRoom:wp.roomIndex,
    waypointMatchedKeys:wp.matchedKeys
  };
}

function pitDetails(game,blackWpInfo=null) {
  const options=[];

  // Black Marsh -> Tamoe -> Pit entrance.
  {
    const a=game.area(LEVEL.BlackMarsh);
    const wp=blackWpInfo ?? act1OutdoorWaypoint(a);
    const start=wp?.point ?? null;

    if (start) {
      const r=geometryChain(game,LEVEL.BlackMarsh,start,[
        LEVEL.TamoeHighland,
        LEVEL.PitLevel1
      ]);

      if (r) options.push({
        source:"Black Marsh",
        score:r.total,
        waypointRoom:wp.roomIndex
      });
    }
  }

  // Outer Cloister -> Monastery Gate -> Tamoe -> Pit.
  {
    const a=game.area(LEVEL.OuterCloister);
    const start=waypoint(a);

    if (start) {
      const gate=a.exits.find(e =>
        String(e.to?.name ?? "").includes("Monastery Gate")
      );

      if (gate) {
        const gateId=gate.to.id;
        const r=geometryChain(game,LEVEL.OuterCloister,start,[
          gateId,
          LEVEL.TamoeHighland,
          LEVEL.PitLevel1
        ]);

        if (r) options.push({
          source:"Outer Cloister",
          score:r.total,
          waypointRoom:null
        });
      }
    }
  }

  if (!options.length) return null;

  options.sort((a,b)=>a.score-b.score);
  return options[0];
}

function tristramDetails(game,stonyWpInfo=null) {
  const a=game.area(LEVEL.StonyField);
  const wp=stonyWpInfo ?? act1OutdoorWaypoint(a);
  const start=wp?.point ?? null;
  if (!start) return null;

  const stones=uniqObjects(actualObjects(a).filter(o =>
    o.classId>=OBJECT.CairnStoneMin &&
    o.classId<=OBJECT.CairnStoneMax
  ));

  if (stones.length<5) return null;

  const center={
    x:stones.reduce((sum,p)=>sum+p.x,0)/stones.length,
    y:stones.reduce((sum,p)=>sum+p.y,0)/stones.length
  };

  const score=isoDist(start,center);
  if (score==null) return null;

  return {
    score,
    stoneCount:stones.length,
    waypointRoom:wp.roomIndex,
    waypointMatchedKeys:wp.matchedKeys
  };
}

function trueTombDetails(game) {
  for (let id=LEVEL.Tomb1; id<=LEVEL.Tomb7; id++) {
    const tomb=game.area(id);
    const orifices=uniqObjects(actualObjects(tomb).filter(o =>
      o.classId === OBJECT.TalRashaOrifice
    ));

    if (orifices.length) {
      return {
        id,
        name:tomb.name,
        orifice:orifices[0]
      };
    }
  }
  return null;
}

function durielDetails(game) {
  const trueTomb=trueTombDetails(game);
  if (!trueTomb) return null;

  const canyon=game.area(LEVEL.CanyonOfTheMagi);
  const start=waypoint(canyon);
  if (!start) return null;

  const door=exitPoint(exitTo(canyon,trueTomb.id), start);
  if (!door) return null;

  const canyonDistance=isoDist(start,door);
  if (canyonDistance==null) return null;

  const tomb=game.area(trueTomb.id);
  const entry=entryFrom(tomb,LEVEL.CanyonOfTheMagi);
  if (!entry) return null;

  const tombDistance=isoDist(entry,trueTomb.orifice);
  if (tombDistance==null) return null;

  // Both matter for Duriel: close true-tomb door and a compact true tomb.
  // Equal raw contribution here; percentile ranking later makes the whole
  // Duriel metric comparable with the other farming targets.
  return {
    score:canyonDistance+tombDistance,
    tomb:trueTomb,
    canyonDistance,
    tombDistance
  };
}

function metricMephisto(game) {
  const a=game.area(LEVEL.Durance2);
  const start=waypoint(a);
  if (!start) return null;

  const out=exitPoint(exitTo(a,LEVEL.Durance3),start);
  if (!out) return null;
  return isoDist(start,out);
}

function lowerKurastDetails(game) {
  const a=game.area(LEVEL.LowerKurast);
  const start=waypoint(a);
  if (!start) return null;

  const camps=uniqObjects(actualObjects(a).filter(o =>
    o.classId===OBJECT.LowerKurastCampfire
  ));

  if (CONFIG.requireTwoLowerKurastCampfires && camps.length!==2) return null;
  if (camps.length<2) return null;

  const W=iso(start);
  let ordered=[...camps].sort((x,y)=>iso(x).sx-iso(y).sx);

  if (CONFIG.requireLowerKurastCampsRightOfWaypoint) {
    ordered=ordered.filter(c=>iso(c).sx>W.sx);
    if (ordered.length!==2) return null;
  }

  const d1=isoDist(start,ordered[0]);
  const d2=isoDist(ordered[0],ordered[1]);
  if (d1==null||d2==null) return null;

  return {score:d1+d2,d1,d2};
}

function metricThresh(game) {
  const a=game.area(LEVEL.ArreatPlateau);
  const start=waypoint(a);
  if (!start) return null;

  const out=exitPoint(exitTo(a,LEVEL.CrystallinePassage),start);
  if (!out) return null;
  return isoDist(start,out);
}


function baalDetails(game,wsk2WpInfo=null) {
  const wsk2=game.area(LEVEL.WorldstoneKeep2);
  const wp=wsk2WpInfo ?? worldstone2Waypoint(wsk2);
  const start=wp?.point ?? null;
  if (!start) return null;

  const down2=exitPoint(exitTo(wsk2,LEVEL.WorldstoneKeep3),start);
  if (!down2) return null;
  const d2=isoDist(start,down2);
  if (d2==null) return null;

  const wsk3=game.area(LEVEL.WorldstoneKeep3);
  const entry3=entryFrom(wsk3,LEVEL.WorldstoneKeep2);
  if (!entry3) return null;

  const throne=exitPoint(exitTo(wsk3,LEVEL.ThroneOfDestruction),entry3);
  if (!throne) return null;
  const d3=isoDist(entry3,throne);
  if (d3==null) return null;

  return {
    score:d2+d3,
    wsk2:d2,
    wsk3:d3,
    waypointBlock:wp.blockId,
    waypointMatchedKey:wp.matchedKey
  };
}

const VALIDATORS = {
  andariel:g=>metricAndariel(g),
  countess:g=>countessDetails(g)?.score ?? null,
  pit:g=>pitDetails(g)?.score ?? null,
  tristram:g=>tristramDetails(g)?.score ?? null,
  duriel:g=>durielDetails(g)?.score ?? null,
  mephisto:g=>metricMephisto(g),
  lowerKurast:g=>lowerKurastDetails(g)?.score ?? null,
  threshSocket:g=>metricThresh(g),
  baal:g=>baalDetails(g)?.score ?? null
};



function evalSeed(seed) {
  return withGame(seed,game=>{
    // Keep the validated Lower Kurast shape as the first hard filter.
    const lk=lowerKurastDetails(game);
    if (!lk) return {valid:false,reason:"lowerKurast"};

    // Hidden-waypoint structural detectors only run after the LK hard filter.
    const blackWp=act1OutdoorWaypoint(game.area(LEVEL.BlackMarsh));
    if (!blackWp)
      return {valid:false,reason:"act1BlackMarshWaypoint"};

    const stonyWp=act1OutdoorWaypoint(game.area(LEVEL.StonyField));
    if (!stonyWp)
      return {valid:false,reason:"act1StonyWaypoint"};

    const wsk2Wp=worldstone2Waypoint(game.area(LEVEL.WorldstoneKeep2));
    if (!wsk2Wp)
      return {valid:false,reason:"wsk2Waypoint"};

    const countess=countessDetails(game,blackWp);
    const pit=pitDetails(game,blackWp);
    const tristram=tristramDetails(game,stonyWp);
    const duriel=durielDetails(game);
    const baal=baalDetails(game,wsk2Wp);

    if (!countess) return {valid:false,reason:"countess"};
    if (!pit) return {valid:false,reason:"pit"};
    if (!tristram) return {valid:false,reason:"tristram"};
    if (!duriel) return {valid:false,reason:"duriel"};
    if (!baal) return {valid:false,reason:"baal"};

    const values={
      andariel:metricAndariel(game),
      countess:countess.score,
      pit:pit.score,
      tristram:tristram.score,
      duriel:duriel.score,
      mephisto:metricMephisto(game),
      lowerKurast:lk.score,
      threshSocket:metricThresh(game),
      baal:baal.score
    };

    for (const m of METRICS)
      if (values[m]==null || !Number.isFinite(Number(values[m])))
        return {valid:false,reason:m};

    return {
      valid:true,
      seed,
      metrics:values,
      details:{
        countessEntrance:countess.entrance,
        blackMarshWaypointRoom:blackWp.roomIndex,
        stonyFieldWaypointRoom:stonyWp.roomIndex,
        wsk2WaypointBlock:wsk2Wp.blockId,
        pitSource:pit.source,
        tristramStoneCount:tristram.stoneCount,
        trueTombId:duriel.tomb.id,
        trueTombName:duriel.tomb.name,
        durielCanyon:duriel.canyonDistance,
        durielTomb:duriel.tombDistance,
        lkWpCamp1:lk.d1,
        lkCamp1Camp2:lk.d2,
        wsk2:baal.wsk2,
        wsk3:baal.wsk3
      }
    };
  });
}

function randomSeed() {
  return 1+Math.floor(Math.random()*2147483646);
}

// ---------- RANKING ----------


function rankRows(rows) {
  if (!rows.length) return [];

  // Tie-aware midrank percentiles. Equal route values MUST receive the same
  // percentile regardless of database/import/scan order.
  const percentiles={};
  for (const m of METRICS) {
    const sorted=[...rows].sort((a,b)=>
      a.metrics[m]-b.metrics[m] || Number(a.seed)-Number(b.seed)
    );
    const den=Math.max(1,sorted.length-1);
    const map=new Map();

    let i=0;
    while (i<sorted.length) {
      let j=i;
      const value=Number(sorted[i].metrics[m]);
      while (j+1<sorted.length && Number(sorted[j+1].metrics[m])===value) j++;

      const mid=(i+j)/2;
      const p=sorted.length===1 ? 0 : mid/den;
      for (let k=i;k<=j;k++) map.set(sorted[k].seed,p);
      i=j+1;
    }

    percentiles[m]=map;
  }

  for (const r of rows) {
    let weighted=0,totalWeight=0,worst=-1,worstMetric=null,elite=0;
    r.percentiles={};

    for (const m of METRICS) {
      const p=percentiles[m].get(r.seed) ?? 1;
      const w=Math.max(0,Number(CONFIG.weights?.[m] ?? 1));
      r.percentiles[m]=p;
      if (p<=0.10) elite++;
      if (p>worst) {worst=p;worstMetric=m;}
      weighted += p*w;
      totalWeight += w;
    }

    const mean=totalWeight ? weighted/totalWeight : 1;
    const mw=Number(CONFIG.overallMeanWeight);
    const ww=Number(CONFIG.overallWorstRouteWeight);

    r.overall=100*((mw*mean+ww*worst)/Math.max(0.0001,mw+ww));
    r.eliteCount=elite;
    r.worstMetric=worstMetric;
    r.worstPercentile=worst;
  }

  return [...rows].sort((a,b)=>
    a.overall-b.overall ||
    b.eliteCount-a.eliteCount ||
    a.worstPercentile-b.worstPercentile ||
    Number(a.seed)-Number(b.seed)
  );
}



let initialised=false;

export async function initEngine() {
  if (!initialised) {
    await init();
    initialised=true;
  }
}

export function objectsSanity() {
  const names={152:objectName(152),160:objectName(160)};
  return {
    ok:
      String(names[152]??"").toLowerCase().includes("orifice") &&
      String(names[160]??"").toLowerCase()==="fire",
    names
  };
}

export function runRegression() {
  const tests=[
    {kind:"act1",seed:586870917,areaId:LEVEL.BlackMarsh,expected:"16",label:"Black Marsh"},
    {kind:"act1",seed:2061315451,areaId:LEVEL.StonyField,expected:"76",label:"Stony Field"},
    {kind:"wsk2",seed:647239413,areaId:LEVEL.WorldstoneKeep2,expected:"2500,2400",label:"Worldstone Keep 2"}
  ];

  const results=[];
  let ok=true;

  for (const test of tests) {
    let found="";
    try {
      found=withGame(test.seed,game=>{
        const area=game.area(test.areaId);
        if (test.kind==="act1")
          return String(act1OutdoorWaypoint(area)?.roomIndex ?? "");
        return String(worldstone2Waypoint(area)?.blockId ?? "");
      });
    } catch {}

    const pass=found===test.expected;
    ok &&= pass;
    results.push({...test,found,ok:pass});
  }

  let countessDistance=null;
  try {
    countessDistance=withGame(586870917,game=>{
      const wp=act1OutdoorWaypoint(game.area(LEVEL.BlackMarsh));
      return countessDetails(game,wp)?.score ?? null;
    });
  } catch {}

  const antiZero=
    countessDistance!=null &&
    Number.isFinite(Number(countessDistance)) &&
    Number(countessDistance)>0;

  ok &&= antiZero;

  return {ok,results,countessDistance,antiZero};
}

export function runPreflight(onMetric=null) {
  const result={};
  let allOK=true;

  for (const metric of METRICS) {
    let ok=false,lastValue=null;
    const tries=metric==="lowerKurast" ? 120 : 60;

    for (let i=0;i<tries;i++) {
      const seed=randomSeed();
      try {
        const value=withGame(seed,game=>VALIDATORS[metric](game));
        if (value!=null && Number.isFinite(Number(value))) {
          ok=true;
          lastValue=Number(value);
          break;
        }
      } catch {}
    }

    result[metric]={ok,tries,value:lastValue};
    allOK &&= ok;
    if (onMetric) onMetric(metric,result[metric]);
  }

  return {ok:allOK,metrics:result};
}

export { evalSeed, randomSeed, rankRows };

export function friendlyRankRating(rank) {
  // Friendly display only. Actual ordering always comes from rankRows().
  // #1 = 10.0, #10 = 9.5, #100 = 9.0, #1000 = 8.5.
  const r=Math.max(1,Number(rank)||1);
  return Math.max(0,Math.min(10,10-0.5*Math.log10(r)));
}
