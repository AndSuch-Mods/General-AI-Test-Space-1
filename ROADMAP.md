# Roadmap

Latest revision: **0.1.7 household acceptance rework**. Clean character layers, exact window masking, automatic wall-centered doors, touch layout drafts and upright rotation, seating, centered menus, portrait protection, improved fire ambience, and distinct hall/kitchen spaces are implemented. This fulfills the latest household revision without advancing or declaring a content phase complete. See [ROOM_REWORK_V7.md](docs/ROOM_REWORK_V7.md).


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
