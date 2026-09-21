# Implementation status

The 0.1.3 correction adds direct A actions, compact bottom sheets, original Web Audio music/SFX, next-06:00 confirmed sleep and host-validated shared furnishing layouts. Forty-five unit tests pass; current browser and deployment outcomes are recorded in VALIDATION.md and Actions.

Phase 1 is in progress. Do not describe it as a complete game or stable iPhone co-op release.

Implemented code includes two world slots, profiles, IndexedDB transactions and recovery checkpoint, validated import/export, Web Locks, WebRTC manual/QR pairing, guest mirrors and a versioned offline build. The title now shares room materials, and compact character creation previews live coat changes. Residents display at twice their previous size. Layered rooms have solid furniture, animated lights and opening containers, shared chest transfers, a sleep-entry bed, a running shared clock and changing window skies. An exit connects the room and landing, with independent co-op map occupancy. The HUD uses a floating left stick, dedicated A/B buttons, clock/I/ESC and seven persistent quick slots.

Specification coverage, lint, types, 45 unit tests and production build pass locally for this revision. Browser tests retain DataChannel pairing/reconnect, separate inventories, shared changes, cold offline loading, package repair, save-preserving updates and import/export. New cases cover actual preview pixels, A/B input, seven-slot migration, adult render geometry, sleep/daylight, saved map travel and co-op rest. See VALIDATION.md and the checkpoint Actions run for outcomes. WebKit CI uses macOS 15; the earlier macOS 26 discovery failure remains documented. No physical-device results or completed content phases are claimed.

The tested checkpoint is on `main`. GitHub Pages deployment requires both browser jobs to pass; [Actions](https://github.com/AndSuch-Mods/General-AI-Test-Space-1/actions) records each publication.

Known open gates:

- Real installation and cold offline start on an iPhone.
- Two-iPhone Wi-Fi pairing, camera permissions, rotating QR scanning, suspension, reconnect and offline local-network operation.
- Phase 2 town/forest maps and fixed-rate authoritative simulation. The room/landing connection is implemented; the full three-space slice is not complete.
- Additional resident designs and equipment layers. Current appearances recolor masked clothing in one original sheet, and left poses mirror its genuine right profile.
- Phase 3 multi-day device stress, full health/energy integration and schedule consumers of the clock. Basic shared time, personal fatigue and solo/co-op bed sleep are implemented.
- Combat, storage/crafting, cooking, fishing, NPC schedules, romance, main story and mature content.
- Guided recovery when guest data is newer than the host. The current safe behavior rejects the join.
- Cache cleanup after all clients stop using a previous version. Old caches are currently retained for safety.

`docs/TEST_PLAN.md` preserves the full target matrix. Passing current tests does not satisfy future-system tests or replace device testing.
