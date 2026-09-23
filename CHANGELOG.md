# Changelog

## 0.1.7 art restoration

- Resumed the entire household request after the priority eye correction. Preserved all pending artwork and gameplay work.

- Restored the exact original front-facing furniture, original rug motif, detailed flames and protected window frames. Added matching directional furniture, occupied-bed/seat layers and kitchen fixtures.
- Retained the generated wooden doors and corrected their intermediate opening and hinge states. Removed unused procedural seat/door texture builders.
- Replaced the rejected procedural residents with registered raster body, garment and hair layers in the original style. Preserved matched open eyes and stable walking faces from the published `7b1539b` correction.
- Corrected rotated furniture floor proportions while preserving older front-facing placements and saves.
- Fixed stove ambience, repeated audio unlock/mute and stale fire resuming after exit. Seated residents now receive a clear stand-up hint before room arrangement.
- Fixed character presets selected before the preview module loads; later preview loading preserves all manual choices.

## 0.1.7

- Rebuilt characters from original body, joint, skin, garment and hair layers with consistent walking faces and directional seated/rest poses.
- Matched window sky pixels to the frame aperture, spaced windows evenly and centered direction-specific doors. Walking through a doorway now changes rooms; collision no longer prevents turning to face an object.
- Replaced the furnishing picker with full-room touch editing: drag within room boundaries, green/red placement feedback, tap valid rotations, cancel or save the whole layout. The host enforces ownership, busy furniture, access, conflicts and atomic persistence.
- Added four upright views for all requested furniture, opening container poses, attached desk items, rotating bed access and two-seat sofa/armchair interaction. A or B stands up; walking also leaves a seat.
- Centered menus, added portrait protection over character creation and removed generic observation dialogs. Containers open before their menu and close afterward.
- Reworked hearth audio into continuous stereo fire ambience with softer irregular ember sounds.
- Replaced the stair landing with a distinct entry hall and an east-connected basic kitchen. Stove, sink and recipe worktop are movable; cooking progression remains future work.
- Schema 6 adds facing, seating, rotations and shared hall/kitchen layouts. Older custom furniture positions, both profiles and world progress are preserved. Protocol 8 requires matching game rules on both devices.


## 0.1.6

- Put the living-room bedroom doors in the left and right walls, and its landing exit in the bottom wall. Every connected room now returns through the opposite wall, with matching walnut doorway art and protected approaches.
- Doubled window width and height, retaining animated mist, daylight and night skies.
- Refined feminine clothing/body contours, added a skirt/blouse plus cropped and swept hair, and provided initial feminine/masculine choices without overriding manual selections.
- Retained the supplied castle home-screen icon. Its previous commit did not deploy because the Chromium co-op check failed. This release keeps both deployment test gates.
- Linux CI Chromium uses numeric local ICE candidates to avoid dependence on virtual-runner mDNS; production pairing and macOS WebKit discovery are unchanged. Protocol 7 prevents mixed room rules between peers; save schema 5 is preserved.

## 0.1.5

- Replaced the home-screen icon with the user's supplied moonlit castle artwork, including iOS and manifest sizes in the offline package.
- Added male/female creation, four outfits, six clothing colors, four hairstyles, five hair colors and five skin tones, with live shared preview/gameplay artwork.
- Added a synchronized sleepy, annoyed reaction when a player crosses an occupied bed, with a small toss, pixel huff and blanket sound. Sleep continues.
- Preserved each resident's choices through save, backup and reconnect. Schema 5 migrates older profiles; protocol 6 synchronizes reactions.
- Fixed guest daily reports and recovery mirrors receiving the new morning record immediately.


## 0.1.4

- Added a shared living room with original plum sofa and reading chair, left and right bedrooms, and a connection to the landing.
- Saved each room's arrangement and lights separately. The authority permits bedroom arrangement only for its owner; visitors may still use the room.
- Widened both beds for two residents, with separate sleeping positions, a settling pose and a shared night-to-morning transition.
- Added personal desk journals with persisted shared and individual dawn reports. Schema 4 migrates older saves; protocol 5 keeps both peers on the same room rules.
- Kept walking faces consistent and fixed the container-close/inventory-opening race found in the preceding checkpoint's CI checks.

## 0.1.3, sound and household actions

- Added original composed music, material sound effects, hearth ambience and saved sound/music switches. Audio runs locally offline and suspends when hidden.
- A now acts directly on the letter, candles, hearth and containers. Hearth toggling preserves completed story progress. Compact bottom sheets replace room inspection menus.
- Container sheets wait for the opening pose; closing animation begins after the sheet closes. Other connected users keep shared containers open.
- Added shared room arrangement for all requested furniture, carpet, candles and plants, using the existing stick/A/B controls. Placement validates collisions, access, occupancy and concurrent edits, and saves atomically.
- Added schema 3 layout migration and protocol 4. Replaced stone-framed doors with correctly seated walnut door drawings. Fixed candle flame depth and the resident's native right eye.
- Lowered and widened bed entry. Entry now asks before sleep; accepted rest ends at the next 06:00 at every bedtime.

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
