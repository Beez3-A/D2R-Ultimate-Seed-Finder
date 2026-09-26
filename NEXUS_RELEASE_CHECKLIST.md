# Nexus Mods release checklist

## Before publishing

- [ ] Run the packaged Portable EXE on a clean Windows machine/VM without
      Node.js installed.
- [ ] Run the Setup EXE and confirm install/uninstall behavior.
- [ ] Confirm the three hidden-waypoint startup regressions all pass.
- [ ] Run at least a 5,000-seed scan.
- [ ] Confirm database history survives replacing the Portable EXE.
- [ ] Confirm database history survives upgrading the installed build.
- [ ] Generate SHA-256 hashes for both EXEs.
- [ ] Virus-scan the exact release files you upload.
- [ ] Add screenshots of the GUI to the Nexus page.
- [ ] State clearly that the utility is for offline map-seed analysis and
      does not modify Diablo II: Resurrected save files.
- [ ] State that special hidden-waypoint route values are comparative geometry
      proxies, as explained in the app documentation.

## libd2 redistribution

The project maintainer has confirmed permission to redistribute the libd2
npm/WASM package in this free community application. Keep a screenshot or
permanent link to that permission in the release records.

Upstream:
https://github.com/jaenster/libd2

## Windows SmartScreen / signing

An unsigned EXE can show "Unknown publisher" / SmartScreen reputation
warnings even when the file is clean.

For a polished long-term release, Authenticode code signing is worth
considering. It is not required for private testing.

## Recommended Nexus files

Main file:
- D2R Ultimate Seed Finder v1.3 - Installer

Optional file:
- D2R Ultimate Seed Finder v1.3 - Portable

Do not require community users to download Node.js or the source archive.
