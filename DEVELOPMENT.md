# Development / release build

The downloadable Nexus build should be the generated `.exe`, not this source
folder.

## Local Windows build

Prerequisites for the developer only:

- Node.js 24.x
- npm

Commands:

```powershell
npm install
node patch_libd2.mjs
npm run build:windows
```

Outputs are written to `dist/`:

- `D2R-Ultimate-Seed-Finder-1.3.0-Portable.exe`
- `D2R-Ultimate-Seed-Finder-1.3.0-Setup.exe`

The packaged applications do not require Node.js on the user's PC.

## GitHub Actions

The included `.github/workflows/windows-release.yml` builds both EXEs on a
Windows GitHub runner and uploads them as a workflow artifact.

This is the preferred reproducible build path for community releases.
