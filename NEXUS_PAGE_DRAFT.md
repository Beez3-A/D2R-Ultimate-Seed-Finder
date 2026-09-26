# Nexus Mods page draft

## Title

D2R Ultimate Seed Finder

## Short description

Standalone Windows utility for scanning and ranking Diablo II: Resurrected offline Hell map seeds across nine farming routes. Portable EXE, persistent database, custom route weights, and no Node.js or installation required.

## About this mod

D2R Ultimate Seed Finder is a standalone companion utility for players who use fixed map seeds in Diablo II: Resurrected offline mode.

Instead of manually trying random seeds one at a time, the program generates and evaluates large numbers of Hell map seeds and keeps the valid candidates in a persistent local database.

The goal is to help find a single seed with convenient layouts across several popular farming routes rather than optimizing only one area.

## Current farming targets

- Andariel
- Forgotten Tower / Countess
- The Pit
- Stony Field / Cairn Stones / Tristram
- Duriel / True Tomb
- Mephisto
- Lower Kurast
- Thresh Socket
- Worldstone Keep / Baal

Act IV / Chaos Sanctuary is intentionally excluded from the current ranking.

## Main features

- Portable Windows x64 EXE
- No installation
- No Node.js or npm required
- Persistent local seed database
- Safe-stop scanning
- Top-seed leaderboard
- Balanced preset
- Boss Farming preset
- Rune Farming preset
- Custom route weights
- Route Rating / 10
- Dream Rating / 10
- Tie-aware deterministic ranking
- Legacy v0.6 CSV import

## Lower Kurast

The scanner uses a strict LK filter:

- exactly two campfires
- six associated superchests
- both camps screen-right of the waypoint

The layout is scored as waypoint → first camp → second camp.

## Installation

1. Download `D2R-Ultimate-Seed-Finder-1.4.0-Portable.exe`.
2. Put it anywhere you like.
3. Run it.

That's it.

There is no installer and no external runtime to install.

## Updating

Download the newer Portable EXE and replace/store it wherever you keep the old one.

The app database is stored separately in Windows application data, so updating the EXE does not intentionally wipe your existing scan history.

## How scores work

The raw scanner uses lower-is-better route distance proxies.

Every valid route is converted into a percentile relative to the valid candidates currently in your database. The overall Balance Score combines:

- 75% weighted average route percentile
- 25% weakest-route percentile

The GUI presents friendlier higher-is-better Route Ratings and a rank-based Dream Rating.

These scores are comparative tools, not measured in-game run times.

## Important limitation

The program evaluates generated map geometry. It does not simulate every collision, character movement decision, teleport animation, or individual farming style.

Treat it as a powerful seed-filtering/ranking tool and test your favorite final candidates in-game.

## Save files / game modification

The application is a standalone offline map-seed analysis utility.

It does not need to edit your Diablo II: Resurrected character save files.

## Windows SmartScreen

The current release is not Authenticode-signed, so Windows may initially display an Unknown Publisher / SmartScreen warning for a new download.

Use the official Nexus or GitHub release and verify the SHA-256 checksum if desired.

## Credits

- libd2 / jaenster — deterministic Diablo II map generation / DRLG data
- Electron — desktop runtime
- electron-builder — Windows packaging

The libd2 maintainer granted permission for the bundled npm/WASM package to be redistributed in this free community application.

## Source code

The source code is available on GitHub:

https://github.com/Beez3-A/D2R-Ultimate-Seed-Finder

The project's original source code is released under the MIT License.

## Disclaimer

This is an independent community project and is not affiliated with, endorsed by, or sponsored by Blizzard Entertainment.

Diablo II and Diablo II: Resurrected are trademarks of Blizzard Entertainment.
