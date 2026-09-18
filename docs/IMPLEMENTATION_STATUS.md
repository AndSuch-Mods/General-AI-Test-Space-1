# Implementation status

Phase 1 is in progress. Do not describe it as a complete game or stable iPhone co-op release.

Implemented code includes the title screen, two world slots, profiles, IndexedDB transactions and recovery checkpoint, export/import with replacement confirmation, Web Locks ownership, transport abstraction, WebRTC pairing, rotating QR display and local camera decoding, authoritative arrival interactions, guest mirroring, landscape controls and a versioned offline build. Detailed original generated castle artwork and twelve resident poses now replace the visible geometric placeholders. Phaser renders the art with live movement, embers, particles and shared fire state.

Specification coverage, lint, types, 15 unit tests and production build pass. CI now passes seven Chromium and seven WebKit scenarios, including actual DataChannel pairing/reconnect, separate inventories, shared changes, cold-page loading with its HTTP origin stopped, package repair, save-preserving updates, and import/export. WebKit runs on macOS 15. A macOS 26 runner timed out in local network discovery and remains a documented compatibility concern. See VALIDATION.md for exact checkpoint evidence. Real-device results are not available. There are no completed content phases to audit yet.

Known open gates:

- Pages deployment verification. Source configuration and remote CI are complete.
- Real installation and cold offline start on an iPhone.
- Two-iPhone Wi-Fi pairing, camera permissions, rotating QR scanning, suspension, reconnect and offline local-network operation.
- Phase 2 three-map movement, collision and fixed-rate authoritative simulation.
- Environment foreground occlusion, reusable tile/layer separation, additional resident designs and more distinct side-walk frames. Current appearance colors tint one original resident sheet.
- Phase 3 advancing time, fatigue, sleeping and longer-running save/session stress tests.
- Combat, storage/crafting, cooking, fishing, NPC schedules, romance, main story and mature content.
- Guided recovery when guest data is newer than the host. The current safe behavior rejects the join.
- Cache cleanup after all clients stop using a previous version. Old caches are currently retained for safety.

`docs/TEST_PLAN.md` preserves the full target matrix. Passing current tests does not satisfy future-system tests or replace device testing.
