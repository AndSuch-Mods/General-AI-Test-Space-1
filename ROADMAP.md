# Roadmap

Current phase: **Phase 1, implementation in progress**.

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

Implemented: two persistent world slots, separate residents, atomic saves, validated import/export, offline package repair and explicit updates, host/guest transport and pairing, mirrored guest recovery, plus a playable castle arrival room. The letter and parcel are personal; either resident can light the shared hearth. The default time-scale conversion is implemented and tested; advancing time remains Phase 3.

The user requested an earlier art pass on 2026-09-18. Detailed original castle exterior/interior art and animated resident poses now replace the visible geometric placeholders. This does not mark the full Phase 11 art/audio pass complete.

The user's subsequent review requires the [room and controls rework](docs/ROOM_AND_CONTROLS.md) before advancing. The arrival scene now uses separate native pixel layers and furniture, corrected walking, a closer camera, collision, candle switches, shared chest transfers and a compact touch HUD. Phase 2's connected maps and broader simulation are still pending.

The earlier art checkpoint passed 15 unit tests and 14 Chromium/WebKit scenarios. This rework expands those suites; see [validation evidence](docs/VALIDATION.md) for current results. GitHub Pages publishes validated main-branch builds. Installation, QR and offline local-network pairing on actual phones remain the Phase 1 device gates. Then continue the three-map simulation in Phase 2. See [implementation status](docs/IMPLEMENTATION_STATUS.md) and [the device procedure](docs/DEVICE_TESTS.md).
