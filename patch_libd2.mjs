
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgIndex = fileURLToPath(import.meta.resolve("libd2"));
const pkgRoot = path.dirname(pkgIndex);
const areaPath = path.join(pkgRoot, "drlg", "area.js");
const backupPath = areaPath + ".bak-before-ultimate-seed-finder-v06";

if (!fs.existsSync(areaPath)) {
  console.error("ERROR: Could not find libd2/drlg/area.js");
  process.exit(2);
}

let src = fs.readFileSync(areaPath, "utf8");

if (src.includes("D2R_ULTIMATE_SEED_FINDER_V06_PRESET_FIX")) {
  console.log("libd2 preset parser is already patched for v0.6.");
  process.exit(0);
}

const oldBlock = `                const classId = view.getInt32(at, true);
                const x = view.getInt32(at + 4, true);
                const y = view.getInt32(at + 8, true);
                objects.push({
                    area: this,
                    location: new Location(this, x, y),
                    classId,
                    name: objectName(classId),
                });`;

const oldPatchedBlock = `                // D2R_ULTIMATE_SEED_FINDER_PRESET_FIX
                // D2DrlgPreset ABI = { etype, txt_file_no, x, y }.
                const etype = view.getInt32(at, true);
                const classId = view.getInt32(at + 4, true);
                const x = view.getInt32(at + 8, true);
                const y = view.getInt32(at + 12, true);
                if (etype !== 2)
                    continue;
                objects.push({
                    area: this,
                    location: new Location(this, x, y),
                    classId,
                    name: objectName(classId),
                });`;

const newBlock = `                // D2R_ULTIMATE_SEED_FINDER_V06_PRESET_FIX
                // Native D2DrlgPreset ABI = { etype, txt_file_no, x, y }.
                // Keep the preset type instead of throwing non-object presets away.
                // This is useful because several special map features are represented
                // differently across acts even though their txt_file_no maps to a
                // familiar Objects.txt id.
                const etype = view.getInt32(at, true);
                const classId = view.getInt32(at + 4, true);
                const x = view.getInt32(at + 8, true);
                const y = view.getInt32(at + 12, true);
                objects.push({
                    area: this,
                    location: new Location(this, x, y),
                    etype,
                    classId,
                    name: etype === 2 ? objectName(classId) : "",
                });`;

if (!fs.existsSync(backupPath))
  fs.copyFileSync(areaPath, backupPath);

if (src.includes(oldBlock)) {
  src = src.replace(oldBlock, newBlock);
} else if (src.includes(oldPatchedBlock)) {
  src = src.replace(oldPatchedBlock, newBlock);
} else {
  // A fresh npm install is expected. If another earlier scanner already
  // modified the local copy in a different way, abort rather than corrupt it.
  console.error("ERROR: Expected libd2 0.6.5 preset parser block was not found.");
  console.error("Extract v0.6 to a NEW folder and run setup again.");
  process.exit(3);
}

fs.writeFileSync(areaPath, src, "utf8");
console.log("Applied v0.6 preset parser compatibility fix.");
console.log("Preset records now expose: etype, classId, x, y.");
