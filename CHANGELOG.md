# Changelog

All notable public changes to D2R Ultimate Seed Finder are documented here.

## [1.6.0] - 2026-11-11

### Added
- Manual seed analysis supports the complete unsigned 32-bit range (`0` to `4294967295`) and equivalent signed 32-bit negative inputs.
- Countess ranking now uses a geometric route proxy from the Black Marsh waypoint through Forgotten Tower Level 5, replacing the old waypoint-to-entrance-only metric.

### Fixed
- Targets set to zero weight no longer influence either the weighted mean or worst-route portion of the overall ranking.
- Random seed generation covers the full unsigned 32-bit range.
- Failure to obtain the full Countess route does not, by itself, invalidate an otherwise eligible scanner seed; the route remains unscored.
- Existing entrance-only Countess values are not treated as full-Tower results until re-analyzed or rescanned.

### Changed
- Manual analysis now uses neutral `ANALYZED` and `NOT SCORED` labels rather than advertising route penalties. This is a **display change**: missing or failed routes may still affect the underlying comparison ranking.
- The strict Lower Kurast scan rule is unchanged: exactly two campfires (six superchests), both to the right of the waypoint.
- Updated route descriptions and documentation to describe the Countess metric accurately.

### Notes
- Countess distances are map-geometry proxies, not guaranteed walking or teleporting times.
- This adaptation builds on the community proof of concept by RoOoBerT (PR #2) but has not been merged verbatim.
- Validate the build and full-Tower routes in-game before releasing to end users.

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
