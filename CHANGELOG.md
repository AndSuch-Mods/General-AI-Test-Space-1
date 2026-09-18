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
- Local checks pass with 15 unit tests. Chromium's initial six browser scenarios passed in CI. WebKit offline tests now stop the origin server instead of relying on its failing offline emulation. The current art/recovery checkpoint is undergoing full CI validation; physical iPhone testing remains open.
