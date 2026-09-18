# Implementation status

Phase 1 is in progress. Do not describe it as a complete game or stable iPhone co-op release.

Implemented code includes the title screen, two world slots, profiles, IndexedDB transactions and recovery checkpoint, export/import with replacement confirmation, Web Locks ownership, transport abstraction, WebRTC pairing, rotating QR display and local camera decoding, authoritative arrival interactions, guest mirroring, landscape controls and a versioned offline build. Detailed original generated castle artwork and twelve resident poses now replace the visible geometric placeholders. Phaser renders the art with live movement, embers, particles and shared fire state.

Local specification coverage, lint, types, 15 unit tests and production build pass. The initial Chromium suite passed all six scenarios in CI, including actual DataChannel pairing and reconnect. Windows WebKit passed three recovery cases and a cold-page launch after the HTTP origin was stopped. macOS WebKit exposed native-share export behavior, which now has a separate Share action, and a local discovery failure under investigation. The full suite is being rerun for this art checkpoint. Real-device results are not available. There are no completed content phases to audit yet.

Known open gates:

- Successful remote CI and deployment. Pages source configuration is complete.
- Real installation and cold offline start on an iPhone.
- Two-iPhone Wi-Fi pairing, camera permissions, rotating QR scanning, suspension, reconnect and offline local-network operation.
- Phase 2 three-map movement, collision and fixed-rate authoritative simulation.
- Environment foreground occlusion, reusable tile/layer separation, additional resident designs and more distinct side-walk frames. Current appearance colors tint one original resident sheet.
- Phase 3 advancing time, fatigue, sleeping and longer-running save/session stress tests.
- Combat, storage/crafting, cooking, fishing, NPC schedules, romance, main story and mature content.
- Guided recovery when guest data is newer than the host. The current safe behavior rejects the join.
- Cache cleanup after all clients stop using a previous version. Old caches are currently retained for safety.

`docs/TEST_PLAN.md` preserves the full target matrix. Passing current tests does not satisfy future-system tests or replace device testing.
