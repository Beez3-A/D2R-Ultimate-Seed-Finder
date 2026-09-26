# D2R Ultimate Seed Finder v1.4.0

## First public portable release

D2R Ultimate Seed Finder is a standalone Windows utility for scanning and ranking Diablo II: Resurrected **offline Hell map seeds** across nine farming targets.

### Highlights

- One portable Windows x64 EXE
- No Node.js, npm, installer, or BAT files required
- Persistent seed database
- Top-seed leaderboard
- Balanced / Boss Farming / Rune Farming / Custom ranking weights
- Tie-aware deterministic ranking
- Route Rating / 10 and Dream Rating / 10 displays
- Strict two-camp / six-superchest Lower Kurast filtering
- Legacy v0.6 CSV import support
- Built-in startup regression/preflight checks

### Farming targets

- Andariel
- Forgotten Tower / Countess
- The Pit
- Stony Field → Cairn Stones / Tristram
- Duriel / True Tomb
- Mephisto
- Lower Kurast
- Thresh Socket
- Worldstone / Baal

Chaos Sanctuary / Act IV is intentionally excluded.

### Installation

Download:

`D2R-Ultimate-Seed-Finder-1.4.0-Portable.exe`

and run it.

No installation is required.

### Verification

`SHA256SUMS.txt` contains the official SHA-256 fingerprint for the release EXE.

### Important note

The scanner uses deterministic map geometry/distance proxies to compare layouts. Scores are relative to the valid candidates in your database and are not literal in-game teleport/walking times.

Final in-game testing is recommended for seeds you plan to keep.

### Tested

The v1.4 Portable EXE was tested after uninstalling Node.js and clearing the application's local data. It launched from a fresh state and successfully completed a 100-seed scan using only the Portable EXE.
