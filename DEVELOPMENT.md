# Development

This document is for contributors building D2R Ultimate Seed Finder from source.

Normal users should download the Portable EXE and do not need Node.js or npm.

## Requirements

- Windows x64
- Node.js 24.x
- npm

## Install dependencies

```powershell
npm install
```

## Apply the libd2 compatibility patch

The project currently targets `libd2` 0.6.5 and applies a compatibility correction to the preset parser before building/running:

```powershell
node patch_libd2.mjs
```

## Run from source

```powershell
npm start
```

## Build the Windows Portable EXE

```powershell
npm run build:portable
```

Output:

```text
dist/
  D2R-Ultimate-Seed-Finder-<version>-Portable.exe
```

## GitHub Actions

The repository includes:

```text
.github/workflows/windows-release.yml
```

The workflow:

1. checks out the repository
2. installs Node.js 24
3. installs dependencies
4. applies the libd2 compatibility patch
5. builds the Portable EXE
6. generates `SHA256SUMS.txt`
7. uploads the EXE and checksum as a workflow artifact

`electron-builder` is explicitly run with `--publish never`; GitHub Actions handles artifact upload separately.

## Persistent application data

The packaged application stores its database/settings in Electron's per-user application-data location rather than next to the Portable EXE.

This is intentional so replacing the EXE during upgrades does not wipe scan history.

## Scanner invariants

Please treat these as compatibility-sensitive:

- Hell difficulty
- eleven current farming targets
- River of Flame requires at least three detected superchest presets and uses four when available
- Halls of Pain waypoint → Halls of Vaught / Nihlathak route
- exact-two-camp Lower Kurast filter
- both LK camps screen-right of the waypoint
- tie-aware percentiles
- 75% weighted mean + 25% weakest-route overall ranking
- deterministic seed-ID fallback for complete ranking ties
- startup regression checks for Black Marsh, Stony Field, and WSK2 waypoint detection
- River of Flame preflight against documented three-superchest seeds

If a pull request changes one of these, call it out explicitly.

## libd2

This project uses `libd2` 0.6.5.

The project maintainer has permission from the libd2 maintainer to redistribute the bundled npm/WASM package in this free community application.

See `THIRD_PARTY_NOTICES.txt`.
