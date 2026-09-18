# Implementation status

Phase 1 is in progress. Do not describe it as a complete game or stable iPhone co-op release.

Implemented code includes the title screen, two world slots, profiles, IndexedDB transactions and recovery checkpoint, export/import with replacement confirmation, Web Locks ownership, transport abstraction, WebRTC pairing, rotating QR display and local camera decoding, authoritative arrival interactions, guest mirroring and a versioned offline build. The room rework replaces the furnished background painting with separate native pixel layers and furniture, corrected directional walking, a closer camera, solid-object collision, depth sorting, candle switches and shared chest transfers. The HUD uses a floating thumbstick, right-side taps, clock/I/ESC and five persistent quick slots. Missions, discoveries and co-op controls are inside inventory.

Specification coverage, lint, types, 23 unit tests and production build pass locally. The expanded browser suite has ten scenarios per engine, retaining DataChannel pairing/reconnect, separate inventories, shared changes, cold-page loading with its HTTP origin stopped, package repair, save-preserving updates and import/export. Added checks cover touch cancellation, walking directions, physical furniture, candle state, quick slots and real peer chest transfers. See VALIDATION.md and the checkpoint Actions run for results. WebKit CI uses macOS 15; the earlier macOS 26 discovery failure remains documented. Real-device results are not available. There are no completed content phases to audit yet.

The tested checkpoint is on `main`. GitHub Pages deployment requires both browser jobs to pass; [Actions](https://github.com/AndSuch-Mods/General-AI-Test-Space-1/actions) records each publication.

Known open gates:

- Real installation and cold offline start on an iPhone.
- Two-iPhone Wi-Fi pairing, camera permissions, rotating QR scanning, suspension, reconnect and offline local-network operation.
- Phase 2 connected-map movement and fixed-rate authoritative simulation. Arrival-room collision and layered rendering were brought forward to address user feedback.
- Additional resident designs and equipment animation layers. Current appearance colors tint one original resident sheet, and leftward poses mirror the genuine right profile.
- Phase 3 advancing time, fatigue, sleeping and longer-running save/session stress tests.
- Combat, storage/crafting, cooking, fishing, NPC schedules, romance, main story and mature content.
- Guided recovery when guest data is newer than the host. The current safe behavior rejects the join.
- Cache cleanup after all clients stop using a previous version. Old caches are currently retained for safety.

`docs/TEST_PLAN.md` preserves the full target matrix. Passing current tests does not satisfy future-system tests or replace device testing.
