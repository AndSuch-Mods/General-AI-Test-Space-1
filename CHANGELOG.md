# Changelog

## 0.1.2, resident scale and household interaction

- Added live previews beside compact name/coat fields. Shared garment palettes keep face, hair, hands and boots unchanged. Doubled resident display size relative to furniture and made room pixels coarser.
- Matched title and dialogs to the room's materials. Removed decorative copy and moved successful offline status into Settings.
- Added seven quick slots, dedicated A/B controls and an inset clock/I/ESC group. Right-side background taps no longer interact. B closes ordinary menus; NPC conversation policy requires authored exits.
- Added a split bed with automatic sleep entry, host-owned running clock, personal fatigue and co-op sleep rules. Windows now show misty daylight, gradual transitions and seeded night variants.
- Added a working castle landing and return door, plus animated doors, chest lid, cupboard doors and desk drawers. Residents can occupy the two maps separately.
- Added schema 1-to-2 migration and protocol 3 clock/map/rest updates. Old hotbar assignments retain their first five slots. Saves and personal progression are preserved.
- Expanded tests for appearance, controls, clock, rest, migration, map travel and co-op. Physical iPhone acceptance remains open.

## 0.1.1, arrival-room rework

- Replaced the furnished background image with separate native pixel layers, furniture and effects. Added a closer following camera, corrected side profiles and distance-based walk animation.
- Added host-authoritative furniture collision, depth sorting, reachable object actions, shared candle switches and shared chest transfers. Old saved positions inside furniture move safely to clear floor without losing progress.
- Replaced persistent arrows and large HUD panels with a floating thumbstick, right-side interaction taps, compact clock/I/ESC controls and five persistent personal quick slots. Missions and co-op controls live inside inventory.
- Added matching animated fireplace and candle lighting. Retained the original art and exact generation prompts as development records.
- Fixed unacknowledged rate-limited guest movement. Exit waits for durable work; an unconfirmed guest action keeps its recovery copy and permits reconnect.
- Expanded collision, persistence, storage, touch, animation and browser regression checks. Protocol 2 rejects mismatched clients; existing schema 1 saves remain supported. Later phases remain on hold for this correction milestone.

## 0.1.0, in development

- Selected the first empty approved repository and preserved the full master specification.
- Added permanent operating rules and lossless working documents with a coverage check.
- Defined a common authoritative world and persistent player model for solo and co-op.

- Built the title/save menu, character setup, original castle arrival room, movement, personal letter and parcel, shared hearth, and journal.
- Added IndexedDB transactions, two slots, replay-safe rewards, persistent guest identity, revision checks, guest recovery mirrors, export/import and replacement confirmation.
- Added WebRTC DataChannels, manual and rotating-QR pairing, host/guest sessions and reconnect continuity. Unusable local discovery now gives an actionable error.
- Added a versioned offline manifest, integrity-checked installation, package repair, explicit update restart and save-preserving update tests.
- Configured GitHub Actions validation and Pages deployment. Browser validation uses Chromium on Linux and WebKit on macOS.
- Replaced visible geometric placeholder artwork after user review with original generated castle artwork and twelve directional resident poses. Added fire, embers and restrained ambient particles; retained Phaser.
- Specification, lint, types, 15 unit tests, build, and all 14 Chromium/WebKit browser scenarios pass at the art checkpoint. WebKit uses a pinned macOS 15 runner; macOS 26 local discovery failed and remains documented. Offline tests stop the HTTP origin and open a cold page. Physical two-iPhone testing remains open.
- Verified shared changes, personal rewards and guest reconnect after shutting down the actual HTTP server in both browser engines. Promoted the tested checkpoint to main for validated Pages publication.
