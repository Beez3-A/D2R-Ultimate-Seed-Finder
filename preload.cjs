
const {contextBridge,ipcRenderer}=require("electron");

contextBridge.exposeInMainWorld("seedFinder",{
  loadDashboard:()=>ipcRenderer.invoke("dashboard:load"),
  saveSettings:settings=>ipcRenderer.invoke("settings:save",settings),
  startScan:payload=>ipcRenderer.invoke("scan:start",payload),
  stopScan:()=>ipcRenderer.invoke("scan:stop"),
  openDataFolder:()=>ipcRenderer.invoke("data:open-folder"),
  importV06:()=>ipcRenderer.invoke("import:v06"),
  evaluateSeeds:payload=>ipcRenderer.invoke("seed:evaluate",payload),
  copySeed:seed=>ipcRenderer.invoke("seed:copy",seed),
  buildInfo:()=>ipcRenderer.invoke("build:info"),
  onScanEvent:fn=>{
    const h=(_e,evt)=>fn(evt);
    ipcRenderer.on("scan:event",h);
    return ()=>ipcRenderer.removeListener("scan:event",h);
  }
});
