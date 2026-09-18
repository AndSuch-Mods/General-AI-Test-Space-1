# Changelog

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
