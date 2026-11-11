# D2R Ultimate Seed Finder v1.6.0

Version 1.6.0 improves manual seed input, replaces the Countess entrance-only metric with a full-Tower geometric route estimate, and corrects how zero-weight targets contribute to ranking.

## Added / Improved
- **32-bit seed support:** Analyze seeds from `0` through `4294967295`. Signed 32-bit equivalents (such as `-2069705981`, corresponding to `2225261315`) are supported as well.
- **Full Countess route proxy:** Ranking now follows Black Marsh waypoint → Forgotten Tower entrance → Tower Level 1 through Level 5 via map exit geometry. The old Countess entrance-only metric is replaced, not kept as a separately weighted target.
- **Manual analysis display:** Results that do not meet strict scanner rules use neutral `ANALYZED` / `NOT SCORED` wording. The app still uses missing-route adjustments internally for comparison rankings.

## Fixed
- Zero-weight farming targets no longer influence the aggregate ranking, including the weakest-route component.
- Random seed generation uses the complete unsigned 32-bit range.
- A missing full Countess route is left unscored rather than automatically rejecting an otherwise valid scanner seed.
- Historical Countess data from earlier releases is not misinterpreted as a full-Tower score; re-analyze or rescan those seeds to populate the new value.

## Unchanged
- The scanner still requires **two Lower Kurast campfires / six superchests**, both to the right of the waypoint, for strict seed eligibility.
- Existing separate farming targets, including **The Pit**, remain available. Verify their behavior with actual map layouts.
- The app remains a standalone portable Windows x64 executable and retains its existing app-data location.

## Important limitations
- Distance metrics are based on generated geometry; they do not simulate exact walking paths or teleport time.
- Existing leaderboard rankings can change, because the Countess metric and zero-weight handling have changed. Old Countess values must be rescanned.
- This release incorporates an independent adaptation inspired by the Countess route proof of concept from **RoOoBerT** ([pull request #2](https://github.com/Beez3-A/D2R-Ultimate-Seed-Finder/pull/2)). Thank you for implementing and testing that idea.

## Download
Download `D2R-Ultimate-Seed-Finder-1.6.0-Portable.exe` and optionally `SHA256SUMS.txt` from the release assets. No installation or separate Node.js setup is required.

**Release readiness:** These are draft notes. Please build the Windows EXE, test the known seed inputs and Countess routes in-game, and publish only after validation.
