# GitHub Release — v1.6.0 (copy/paste after testing)

## Title
D2R Ultimate Seed Finder v1.6.0

## Tag
v1.6.0

## Release description
D2R Ultimate Seed Finder v1.6.0 improves 32-bit seed support and ranking accuracy, and expands the Countess route metric to Tower Level 5.

### What's new
- **Full 32-bit seed IDs:** Analyze seeds in the complete `0–4294967295` range, including signed 32-bit equivalents.
- **Countess full-route proxy:** The existing Countess target now estimates Black Marsh waypoint → Forgotten Tower Level 5, instead of stopping at the outdoor Tower entrance.
- **Weighting correction:** Targets set to `0` no longer affect either part of the overall ranking calculation.
- **Manual seed analysis:** Neutral `ANALYZED` / `NOT SCORED` labels replace visible penalty wording. Missing-route scoring adjustments remain internal.
- **Better data handling:** Previous entrance-only Countess scores are shown as unscored until the affected seeds are analyzed again. Failure to measure the Tower route alone won't invalidate otherwise eligible scanner seeds.

The strict Lower Kurast two-campfire, right-of-waypoint scanner requirement has **not changed**.

**Please note:** Full-route distances are geometric estimates, not obstacle-aware in-game pathfinding. Rankings may change after updating; re-analyze existing seeds for the new Countess metric.

Thanks to **RoOoBerT** for the Countess full-route proof of concept and in-game testing ([PR #2](https://github.com/Beez3-A/D2R-Ultimate-Seed-Finder/pull/2)).

### Download
Download `D2R-Ultimate-Seed-Finder-1.6.0-Portable.exe` below. Windows x64, standalone; no install or separate Node.js required. `SHA256SUMS.txt` is included for verifying the EXE download.
