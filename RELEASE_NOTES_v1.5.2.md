# D2R Ultimate Seed Finder v1.5.2

v1.5.2 expands the Seed Finder from nine to eleven farming targets and adds a separate workflow for ranking seeds that players have already found themselves.

## New farming targets

### River of Flame Superchests

- Requires at least **3 detected deterministic chest presets** for a strict scanner candidate.
- Uses **4 chests when available**, otherwise 3.
- Scores the shortest route beginning at the River of Flame waypoint and visiting the selected chests.
- The score is normalized by chest count so a useful four-chest layout is not automatically penalized for the additional stop.
- Seed details show detected chest count, routed chest count, and total route distance.

The scanner does not impose a second fixed “close enough” cutoff after the 3-chest requirement. Instead, waypoint/chest distance is part of the route score, so closer River layouts rank better under the River of Flame weight.

### Nihlathak

- Adds **Halls of Pain waypoint → Halls of Vaught entrance** scoring.
- Includes the route in the Boss Farming preset.
- v1.5.2 fixes Halls of Pain waypoint detection for expansion waypoint object classes.

## Analyze Your Own Seeds

Paste one or more known offline map seeds into the new **Analyze Your Own Seeds** panel.

- Up to 100 seeds can be evaluated at once.
- Seeds that satisfy all strict scanner rules can join the persistent candidate database.
- Seeds that fail a strict rule are still ranked for comparison.
- Failed or unavailable routes receive worst-route penalties.
- Penalty-ranked personal seeds do not affect the strict Top 10 candidate leaderboard or scanner yield statistics.

## Compatibility

- Existing 9-route candidate databases remain readable.
- The two new routes display as **Not Scored** for legacy rows until those seeds are re-analyzed.
- v0.6 CSV import remains supported.

## Release file

`D2R-Ultimate-Seed-Finder-1.5.2-Portable.exe`
