# Nexus Mods — v1.6.0 (copy/paste after testing)

## Main file display name
D2R Ultimate Seed Finder v1.6.0 — Portable Windows x64

## File version
1.6.0

## Short description / file description
Portable Windows x64 seed finder. Version 1.6.0 adds full 32-bit seed support, the Black Marsh → Forgotten Tower Level 5 geometric Countess route metric, corrected zero-weight rankings, and cleaner manual analysis labels. No installation or Node.js required.

## Version 1.6.0 changelog
- Accepts unsigned seeds `0–4294967295` and negative signed equivalents.
- Replaces Countess entrance-only scoring with a geometric route proxy through Tower Level 5.
- Fixes zero-weight farming targets affecting the overall ranking.
- Uses neutral labels for manually analyzed seeds rather than visible penalty warnings; underlying missing-route adjustments remain.
- Leaves unavailable Countess full-route results unscored without rejecting otherwise eligible scanner seeds.
- Prevents older entrance-only Countess scores from being mistaken for full-route scores; re-analyze existing seeds to refresh them.
- Preserves the strict two-campfire, right-of-waypoint Lower Kurast scanner filter.

**Note:** The Countess metric is a map-geometry estimate, not collision-aware pathfinding or guaranteed farming time. Thanks to RoOoBerT for the original proof of concept (GitHub PR #2).
