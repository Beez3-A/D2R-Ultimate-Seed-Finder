# Changelog

All notable public changes to D2R Ultimate Seed Finder are documented here.

## [1.5.2] - 2026-09-30

### Added
- Added **River of Flame Superchests** as an Act IV farming target.
  - Scanner candidates require at least 3 detected deterministic River of Flame chest presets.
  - Uses 4 chests when 4 or more are available; otherwise uses 3.
  - Scores the shortest waypoint-to-chest route, normalized by the number of routed chests.
  - Adds detected chest count and total route distance to seed details.
- Added **Nihlathak** as an Act V farming target, scoring Halls of Pain waypoint → Halls of Vaught entrance.
- Added **Analyze Your Own Seeds** for evaluating up to 100 manually supplied offline seed IDs at once.
- Expanded ranking, weights, details, presets, and UI from 9 to **11 farming targets**.

### Changed
- Custom seeds that miss strict scanner rules are now still rankable for comparison.
  - Failed or unavailable routes are treated as worst-route penalties.
  - Penalty-ranked personal seeds do not join the strict candidate leaderboard or affect scanner yield statistics.
- Boss Farming preset now includes Nihlathak weighting.
- Rune Farming preset now includes River of Flame weighting.
- Older 9-route candidate rows remain readable; new routes appear as Not Scored until re-analyzed.
- Legacy v0.6 CSV import remains supported.

### Fixed
- Fixed Halls of Pain waypoint detection by recognizing expansion waypoint object classes, including class 429, when libd2 does not provide a usable waypoint name.
- Added source-run preflight diagnostics for Nihlathak failures.
- Added River of Flame startup validation using documented three-superchest seeds.

## [1.4.1] - 2026-09-26

- Improved public release packaging and documentation.
- Confirmed the Portable EXE works after Node.js is removed from the test machine.
- Updated README, release notes, Nexus draft, and development documentation.

## [1.4.0] - 2026-09-25

- First public-ready GUI release.
- Persistent SQLite database of tested seeds and valid candidates.
- Nine original farming targets across Acts I, II, III, and V.
- Balanced, Boss Farming, Rune Farming, and Custom ranking presets.
- Tie-aware route ratings and Dream Rating leaderboard.
- Legacy v0.6 CSV import.
- Portable Windows x64 build support.
