# Implementation status

Phase 1 is in progress. Do not describe it as a complete game or stable iPhone co-op release.

Implemented code includes the title screen, two world slots, profiles, IndexedDB transactions and recovery checkpoint, export/import with replacement confirmation, Web Locks ownership, transport abstraction, WebRTC pairing, rotating QR display and local camera decoding, authoritative arrival interactions, guest mirroring, original temporary castle art, landscape controls and a versioned offline build.

Automated test results will be recorded after the current validation run. Real-device results are not available. There are no completed content phases to audit yet.

Known open gates:

- GitHub Pages setup/deployment and successful remote CI.
- Real installation and cold offline start on an iPhone.
- Two-iPhone Wi-Fi pairing, camera permissions, rotating QR scanning, suspension, reconnect and offline local-network operation.
- Phase 2 three-map movement, collision and fixed-rate authoritative simulation.
- Phase 3 advancing time, fatigue, sleeping and longer-running save/session stress tests.
- Combat, storage/crafting, cooking, fishing, NPC schedules, romance, main story and mature content.
- Guided recovery when guest data is newer than the host. The current safe behavior rejects the join.
- Cache cleanup after all clients stop using a previous version. Old caches are currently retained for safety.

`docs/TEST_PLAN.md` preserves the full target matrix. Passing current tests does not satisfy future-system tests or replace device testing.
