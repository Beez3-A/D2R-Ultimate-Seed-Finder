D2R ULTIMATE SEED FINDER - COMMUNITY BUILD v1.3
==================================================

END-USER GOAL
-------------
Community users should receive one of these files:

  D2R-Ultimate-Seed-Finder-1.3.0-Portable.exe
  D2R-Ultimate-Seed-Finder-1.3.0-Setup.exe

They do NOT need:
- Node.js
- npm
- BAT files
- the source folder
- a separate runtime install

The packaged Electron executable contains the Node.js runtime used by the
scanner worker.

PORTABLE BUILD
--------------
The Portable EXE:
- is one downloadable EXE;
- requires no installation;
- can be run from Downloads/Desktop/USB;
- keeps the persistent scan database in the Windows user AppData directory,
  so replacing the portable EXE with a newer version does not wipe history.

INSTALLER BUILD
---------------
The Setup EXE:
- installs normally for the current Windows user;
- creates Start Menu and optional Desktop access;
- does not require admin rights by default;
- can launch the app after installation;
- keeps scan history when the app itself is upgraded.

SCANNER ENGINE
--------------
This build keeps the validated v1.2/v0.6 scanning logic:
- nine farming targets;
- tie-aware deterministic ranking;
- target presets and custom weights;
- persistent unique-seed database;
- corrected Black Marsh and Stony Field hidden-waypoint detectors;
- structural WSK2 waypoint detector;
- exact two-camp Lower Kurast filter;
- safe-stop and import support.

NO SYSTEM NODE.JS
-----------------
The old GUI looked for C:\Program Files\nodejs\node.exe.

v1.3 does not.

The main Electron application starts its worker through the packaged Electron
executable with ELECTRON_RUN_AS_NODE. Electron's own embedded Node runtime
executes worker.mjs and node:sqlite.

PUBLIC/NEXUS RELEASE CHECK
--------------------------
Before uploading an EXE containing libd2 to Nexus Mods, review
NEXUS_RELEASE_CHECKLIST.md.

The libd2 maintainer has confirmed permission to redistribute the bundled npm/WASM package; keep a copy of that permission with the release records.

DEVELOPMENT
-----------
Source developers still use npm to install dependencies and create builds.
That is a build-time requirement only. It is NOT an end-user requirement.

See DEVELOPMENT.md.
