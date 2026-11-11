# D2R Ultimate Seed Finder v1.6.0 — Source patch instructions

Prepared specifically against the uploaded original v1.5.2 source. This ZIP is a set of SOURCE FILES, not a compiled EXE. It includes the earlier functional bug patches plus the 1.6.0 version bump.

## Applying to `main` on the GitHub WEBSITE
1. Optional safety step: download a ZIP backup of your existing `main` branch or retain your original v1.5.2 source.
2. Extract this patch ZIP locally (Windows File Explorer > Extract All).
3. Open https://github.com/Beez3-A/D2R-Ultimate-Seed-Finder and make sure `main` is selected.
4. Open the six REQUIRED file paths listed below, one by one. Click the pencil icon, replace the entire editor contents with the matching extracted file's contents, then click `Commit changes` and choose `Commit directly to the main branch`.
5. Apply the four RECOMMENDED documentation files in the same way. For new `RELEASE_NOTES_v1.6.0.md`, use `Add file` > `Create new file`, enter exactly that filename, paste contents, then commit.
6. Don't upload PATCH_INSTRUCTIONS, the .diff, or the two copy/paste template documents as application code unless you also want to store those informational files in your repository.

Required (six):
  - engine.mjs
  - worker.mjs
  - ui/app.js
  - ui/index.html
  - README.md
  - package.json

Recommended (four documentation files):
  - CHANGELOG.md
  - README.txt
  - NEXUS_PAGE_DRAFT.md
  - RELEASE_NOTES_v1.6.0.md

Do not change `RELEASE_NOTES_v1.5.2.md`; that document describes the old historical release.

## Build and test BEFORE publishing
GitHub WEBSITE > repository > Actions > Build Windows Portable Release > Run workflow > Branch: main > Run workflow. When the run is green, open the run, download the `D2R-Ultimate-Seed-Finder-Windows-Portable` artifact ZIP and extract it. The workflow produces:
- `D2R-Ultimate-Seed-Finder-1.6.0-Portable.exe`
- `SHA256SUMS.txt`

The workflow does NOT publish a GitHub Release or upload to Nexus Mods automatically. A release tag beginning with `v` also triggers another build. After testing, create a GitHub Release at tag `v1.6.0` targeted to `main`, and manually upload both produced files as release assets. See the plain-text release templates and chat instructions.

## Suggested tests
- Analyze seed IDs: `123456789`, `2225261315`, `-2069705981`, `0`, `4294967295` (the signed/unsigned equivalents should map to the same ID).
- Verify the manual analysis no longer displays PENALTY labels, without assuming the internal score no longer adjusts for missing routes.
- Confirm the strict Lower Kurast scanner filter still requires two campfires to the right of the waypoint.
- Set all weights to zero except Countess and verify only the Countess metric affects ranking.
- Compare Countess Tower Level 5 results with actual D2R maps and check the Pit is unaffected.
- Verify an old database displays former entrance-only Countess results as unscored until reanalysis.
- Confirm version appears as GUI v1.6.0 and the build executable includes `1.6.0` in its filename.

## Validation scope
Syntax and focused input / weighting tests can be run without the game, but this ZIP has NOT been compiled or validated against live Diablo II: Resurrected maps in this environment. Do not describe it as a fully tested public release until you perform build and gameplay checks.

## Rollback
Use your prior source ZIP or GitHub commit history to restore old files. The changed scoring interpretation means old and new Countess results should not be mixed without reanalysis.
