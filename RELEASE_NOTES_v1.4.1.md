# D2R Ultimate Seed Finder v1.4.1

## Scan lifecycle hotfix

This release fixes a bug discovered after the v1.4.0 portable release.

### Fixed

- After one scan completed, the background scan worker could remain alive because its STOP-input listener was still attached.
- Starting another scan in the same app session could therefore fail with **“A scan is already running.”**
- The scan worker now shuts down cleanly after completed and safely-stopped scans.
- The GUI now waits for the worker to actually exit before enabling **Start Scan** again.

### Unchanged

The hotfix does **not** change:

- map generation
- waypoint detection
- farming-target definitions
- Lower Kurast filtering
- ranking/scoring math
- persistent database format
- saved seed history

Existing v1.4.0 data is compatible with v1.4.1.

## Installation / update

Download:

`D2R-Ultimate-Seed-Finder-1.4.1-Portable.exe`

and run it. Your existing database remains in the normal Windows application-data location.
