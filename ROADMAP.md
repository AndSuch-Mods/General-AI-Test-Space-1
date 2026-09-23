# Roadmap

0.1.11 implements targeted doorframe, standing, couch, hearth and burner corrections in `docs/HOUSEHOLD_POLISH_11.md`. Physical iPhone acceptance and later content phases remain open.

Current household batch: **0.1.10** implements the icon, rigid door leaves, raised curtains, larger bookshelf, independent ledger/drawer inventories, moving-A interactions, seating/rest polish and appliance audio in `docs/HOUSEHOLD_POLISH_10.md`. Short-code pairing replaces manual pairing as the default; see `docs/CODE_ROOMS.md` for its online setup requirement. Focused local checks and the existing release gate cover this batch; physical two-iPhone feel/audio/network acceptance remains open. No content phase advances.

Main-menu correction: remove the cropped title's rectangular backing while retaining the supplied lettering and the existing controls.

0.1.9 implements the main menu using the user-supplied castle/ghost artwork. Touch layout, menu navigation, host/join, settings/backups and the existing gameplay/offline suites pass on Chromium and macOS WebKit at `c3c04eb`. During buildout, omit extra save-preservation and migration work as requested by the user. No game-content phase advances. See `docs/MAIN_MENU.md` and `docs/VALIDATION.md`.

Previous milestone: **0.1.8 household polish**. Correct turned proportions, stationary wall-aligned doors, visible pane motion, accurate A targeting, A-only bed prompts, a hotbar with return leeway and quieter fire. Preserve prior saves and run the combined solo/co-op/offline checks. This remains household acceptance; no content phase advances.

Focused eye correction completed and published at `7b1539b`; live and installed-save offline update checks pass. The user's September 23 clarification resumes all preserved household work. Follow `docs/HOUSEHOLD_ACCEPTANCE.md` and carry the fixed eyes into the combined release.

The rejected procedural art has been replaced by the restored original furnishings and compatible raster character layers. The generated wooden doors are retained. Added furniture directions, container states, window masks, fire audio, touch layouts, entry hall and kitchen are integrated. The matched-eye correction from `7b1539b` remains covered by source-pixel and gait tests. Physical iPhone acceptance remains open.

Latest revision: **0.1.7 household acceptance rework**. Follow the complete requirement ledger in HOUSEHOLD_ACCEPTANCE.md and exact validation evidence in VALIDATION.md. This remains household acceptance work, not a completed content phase.


Current household revision: shared living room, owned bedrooms, two-person beds, dawn journals, personal character creation and synchronized sleepy reactions. Device acceptance remains open before expanding content. This does not complete later town or story phases.

September 22 review: corrected directional room connections, doubled windows, refined feminine/masculine creation and retained the supplied icon for deployment. This remains household acceptance work, not a content-phase advance.

Current phase: **Phase 1, implementation in progress**.

The 2026-09-21 household correction adds original offline music and material sounds, direct object actions, compact bottom sheets, confirmed next-morning sleep, and shared saved furniture arrangement. Rendering fixes cover the right eye, candle depth and wall-set walnut doors. See docs/ROOM_LAYOUT.md. This does not advance a content phase.

The complete deliverables and exit criteria are preserved in [PHASES.md](docs/PHASES.md). No phase is complete until its exit criteria have evidence.

| Phase | Work | Status |
| --- | --- | --- |
| 0 | Repository, full specification, architecture, original reference boundary | Complete, 53 sections verified |
| 1 | PWA, offline package, two world saves, co-op transport and pairing | In progress |
| 2 | Phaser simulation, controls, three spaces, separate maps | Next |
| 3 | Shared time, separate fatigue, multiplayer persistence | Planned |
| 4 | Combat slice | Planned |
| 5 | Inventory, chest, crafting | Planned |
| 6 | Kitchen and magical chocolate | Planned |
| 7 | Fishing | Planned |
| 8 | NPCs and dialogue | Planned |
| 9 | Complete relationship arc | Planned |
| 10 | Story slice | Planned |
| 11 | Original art and audio pass | Planned |
| 12 | Dense content expansion and postgame | Planned |

Implemented: two persistent world slots, separate residents, atomic saves, validated import/export, offline package repair and explicit updates, host/guest transport and pairing, mirrored guest recovery, plus a playable castle room and adjoining landing. The letter and parcel are personal; either resident can light the shared hearth.

The user requested an earlier art pass on 2026-09-18. Detailed original castle exterior/interior art and animated resident poses now replace the visible geometric placeholders. This does not mark the full Phase 11 art/audio pass complete.

The user's successive reviews require the [room and controls rework](docs/ROOM_AND_CONTROLS.md) before advancing. The latest revision doubles resident height, adds live appearance previews, uses coarser room pixels, and provides seven quick slots with dedicated A/B controls. The door reaches a saved landing. Sleep, a shared clock, personal fatigue and day/night windows were brought forward at the user's request. Town/forest maps, the fixed-rate simulation, full time-system stress testing and the later gameplay loops remain pending.

The earlier art checkpoint passed 15 unit tests and 14 Chromium/WebKit scenarios. This rework expands those suites; see [validation evidence](docs/VALIDATION.md) for current results. GitHub Pages publishes validated main-branch builds. Installation, QR and offline local-network pairing on actual phones remain the Phase 1 device gates. Then continue the three-map simulation in Phase 2. See [implementation status](docs/IMPLEMENTATION_STATUS.md) and [the device procedure](docs/DEVICE_TESTS.md).
