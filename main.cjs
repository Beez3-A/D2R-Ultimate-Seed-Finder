
const {app,BrowserWindow,ipcMain,shell,dialog} = require("electron");
const {spawn} = require("node:child_process");
const path=require("node:path");
const fs=require("node:fs");

let win=null;
let scanChild=null;

app.setAppUserModelId("com.d2r.ultimateseedfinder");

function appRoot(){return __dirname;}
function dataDir(){
  const p=path.join(app.getPath("userData"),"Data");
  fs.mkdirSync(p,{recursive:true});
  return p;
}
function workerCwd(){
  return app.isPackaged ? process.resourcesPath : appRoot();
}

function embeddedNodeVersion(){
  return process.versions.node;
}

function workerExecutable(){
  // Electron ships its own Node.js runtime. ELECTRON_RUN_AS_NODE makes the
  // packaged Electron executable behave like node.exe for this child process.
  return process.execPath;
}

function encodePayload(obj){
  return Buffer.from(JSON.stringify(obj||{}),"utf8").toString("base64");
}
function runWorker(mode,payload={},handlers={}){
  const child=spawn(workerExecutable(),[
    "--no-warnings",
    path.join(appRoot(),"worker.mjs"),
    "--mode",mode,
    "--data-dir",dataDir(),
    "--payload",encodePayload(payload)
  ],{
    cwd:workerCwd(),
    windowsHide:true,
    stdio:["pipe","pipe","pipe"],
    env:{
      ...process.env,
      ELECTRON_RUN_AS_NODE:"1",
      ELECTRON_NO_ATTACH_CONSOLE:"1"
    }
  });

  let carry="";
  child.stdout.setEncoding("utf8");
  child.stdout.on("data",chunk=>{
    carry+=chunk;
    const lines=carry.split(/\r?\n/);
    carry=lines.pop()||"";
    for(const line of lines){
      if(line.startsWith("@@EVENT@@")){
        try{
          const evt=JSON.parse(line.slice(9));
          handlers.onEvent?.(evt);
        }catch{}
      } else if(line.trim()) handlers.onLog?.(line);
    }
  });
  child.stderr.setEncoding("utf8");
  child.stderr.on("data",x=>handlers.onLog?.(String(x).trim()));
  child.on("error",e=>handlers.onError?.(e));
  child.on("exit",(code,signal)=>handlers.onExit?.(code,signal));
  return child;
}

function createWindow(){
  win=new BrowserWindow({
    width:1460,
    height:920,
    minWidth:1120,
    minHeight:760,
    backgroundColor:"#0c0d0f",
    show:false,
    title:"D2R Ultimate Seed Finder",
    icon:path.join(__dirname,"assets","infernal-launcher.png"),
    webPreferences:{
      preload:path.join(__dirname,"preload.cjs"),
      contextIsolation:true,
      nodeIntegration:false
    }
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname,"ui","index.html"));
  win.once("ready-to-show",()=>win.show());
}

app.whenReady().then(()=>{
  createWindow();
  app.on("activate",()=>{
    if(BrowserWindow.getAllWindows().length===0) createWindow();
  });
});
app.on("window-all-closed",()=>{
  if(process.platform!=="darwin") app.quit();
});

ipcMain.handle("dashboard:load",async()=>{
  return new Promise((resolve,reject)=>{
    let dashboard=null;
    const child=runWorker("dashboard",{},{
      onEvent:evt=>{if(evt.type==="dashboard") dashboard=evt;},
      onError:reject,
      onExit:code=>code===0&&dashboard?resolve(dashboard):reject(new Error("Could not load dashboard."))
    });
  });
});

ipcMain.handle("settings:save",async(_e,settings)=>{
  return new Promise((resolve,reject)=>{
    let result=null;
    runWorker("save-settings",{settings},{
      onEvent:evt=>{if(evt.type==="settings-saved") result=evt;},
      onError:reject,
      onExit:code=>code===0?resolve(result):reject(new Error("Could not save settings."))
    });
  });
});

ipcMain.handle("scan:start",async(_e,payload)=>{
  if(scanChild) throw new Error("A scan is already running.");

  scanChild=runWorker("scan",payload,{
    onEvent:evt=>win?.webContents.send("scan:event",evt),
    onLog:line=>win?.webContents.send("scan:event",{type:"log",message:line}),
    onError:e=>{
      win?.webContents.send("scan:event",{type:"fatal",message:String(e)});
      scanChild=null;
    },
    onExit:(code,signal)=>{
      win?.webContents.send("scan:event",{type:"worker-exit",code,signal});
      scanChild=null;
    }
  });
  return {ok:true};
});

ipcMain.handle("scan:stop",async()=>{
  if(!scanChild) return {ok:false};
  try{scanChild.stdin.write("STOP\n");}catch{}
  return {ok:true};
});

ipcMain.handle("data:open-folder",async()=>{
  await shell.openPath(dataDir());
  return {ok:true};
});

ipcMain.handle("import:v06",async()=>{
  const pick=await dialog.showOpenDialog(win,{
    title:"Import v0.6 all_valid_seeds.csv",
    properties:["openFile"],
    filters:[{name:"CSV files",extensions:["csv"]}]
  });
  if(pick.canceled||!pick.filePaths.length) return {canceled:true};

  const file=pick.filePaths[0];
  return new Promise((resolve,reject)=>{
    let result=null;
    runWorker("import",{file},{
      onEvent:evt=>{if(evt.type==="import-complete") result=evt;},
      onError:reject,
      onExit:code=>code===0?resolve(result):reject(new Error("Import failed."))
    });
  });
});

ipcMain.handle("seed:copy",async(_e,seed)=>{
  const {clipboard}=require("electron");
  clipboard.writeText(String(seed));
  return {ok:true};
});

ipcMain.handle("build:info",async()=>({
  version:app.getVersion(),
  dataDir:dataDir(),
  node:embeddedNodeVersion(),
  runtime:"Embedded Electron / Node"
}));
