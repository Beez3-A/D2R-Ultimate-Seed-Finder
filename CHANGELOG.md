# Changelog

All notable public changes to D2R Ultimate Seed Finder are documented here.

## [1.4.1] - 2026-09-26

### Hotfix

- Fixed a scan-worker lifecycle bug where a completed scan could leave the worker process alive waiting for STOP input.
- Fixed subsequent scans incorrectly reporting **“A scan is already running.”** until the application was restarted.
- The Start Scan button now remains disabled until the previous scan worker has genuinely exited.
- No map-generation, route-scoring, ranking, database, or seed-validation logic was changed.

## [1.4.0] - 2026-09-26

### Public portable release

- Switched the public distribution to a **portable Windows x64 EXE only**.
- Removed the installer build from the release workflow.
- Bundled the runtime so end users do **not** need Node.js or npm.
- Added the final Windows executable/application icon.
- Added SHA-256 checksum generation to the GitHub Actions build.
- Confirmed the Portable EXE works after Node.js is removed from the test machine.
- Confirmed a fresh local application-data state can launch and scan successfully.
- Kept persistent database/settings storage outside the Portable EXE.

### Ranking and interface

- Added tie-aware midrank percentiles so identical route values receive identical route ratings.
- Added deterministic final seed-ID ordering for otherwise identical results.
- Added Balanced, Boss Farming, Rune Farming, and Custom weight presets.
- Standardized **Balance Score ↓** terminology.
- Added higher-is-better Route Rating / 10 displays while preserving the underlying percentile ranking.
- Kept Dream Rating as a friendly rank-based display rather than an absolute map-quality score.

### Scanner

- Nine farming targets are supported:
  Andariel, Countess/Forgotten Tower, The Pit, Tristram/Cairn Stones,
  Duriel/True Tomb, Mephisto, Lower Kurast, Thresh Socket, and Worldstone/Baal.
- Lower Kurast requires exactly two campfires / six superchests with both camps screen-right of the waypoint.
- Startup sanity, regression, and route preflight checks remain enabled.
- Legacy v0.6 valid-seed CSV import remains supported.

## [1.3.0]

- Converted the GUI to a self-contained Electron community build.
- Removed the requirement for a system-installed Node.js runtime.
- Added GitHub Actions Windows packaging.
- Added portable and installer packaging during development.

## [1.2.0]

- Added stable tie-aware route ranking.
- Added ranking presets.
- Renamed scanner score presentation to Balance Score.

## [1.1.0]

- Corrected legacy v0.6 import statistics.
- Separated represented evaluations from exact tracked seed IDs.
- Changed route display scores to higher-is-better Route Rating / 10.

## [1.0.0]

- First Electron GUI.
- Persistent SQLite database.
- Top-10 leaderboard.
- Safe stop, scan progress, target weights, and legacy CSV import.
