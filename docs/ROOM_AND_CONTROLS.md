# Room and touch rework

The user's review on 2026-09-18 supersedes the earlier arrival-room presentation. This work stays within the Phase 1 correction milestone. It brings collision and some inventory interaction forward without declaring Phase 2 or Phase 5 complete.

## Visual scale

The room uses separate floor and wall layers, furniture sprites, residents, flames and light. Generated source sheets are sampled once onto a shared world pixel grid. Residents occupy a 32 by 48 pixel frame. The camera shows 640 world pixels across, adapting its height to the screen, and follows the local resident. Each phone has its own camera.

Left-facing animation mirrors a genuine side profile. Walking poses follow distance traveled, with a brief grace period between authoritative movement updates. A blocked resident settles to idle. The earlier image and sprite sheet are retained as development history and are not loaded by the arrival scene.

`src/content/room.ts` owns each object's draw rectangle, solid footprint, depth, interaction reach and actions. Host and guest use that same definition. Collision uses the resident's feet, allowing a tall object to obscure the head of someone standing behind it. Swept movement slides around edges. Visual interpolation also checks the solids. Walls bound the walkable floor; rugs are deliberately walkable.

Every placed furnishing has an interaction. The desk offers letter reading, candle tending and inspection. The bed, books, plant, windows and side table have personal discoveries. The cupboard retains its once-per-resident cacao parcel. The hearth is a shared permanent change. Two candles can be lit or extinguished by either resident; their flames and light respond on both devices. Shared chest transfers are atomic host transactions, with sequence replay protection and proximity checks.

Bed inspection is not the sleep system. Clock presentation is present at the saved arrival hour; clock advancement, sleep and fatigue remain Phase 3. The broader cooking, combat and inventory progression remain their planned phases.

## Controls and interface

- Drag from anywhere on the left half of the world to move. The floating stick appears only while held.
- Tap the right half to interact with a nearby object. Dragging on that side does not trigger an accidental action.
- Releasing, cancelling, opening a menu, backgrounding, resizing or leaving clears held touch input.
- WASD and arrows move on desktop. E or Space interacts. Dialogue choices support their displayed letters and taps.
- The upper right contains the clock, `I` and `ESC`. The visible room name, resident label, chapter panel and save-status text have been removed from play.
- `I` opens inventory or unread missions. The notification dot reflects personal discoveries and mission changes.
- Five quick slots and a three-dot inventory button occupy the bottom. Slots reference owned items and never copy inventory. Their assignments and selected slot persist per world and resident on the device.
- Inventory contains items, missions, journal, household recap and co-op controls. Private menus block only that resident's input.
- `ESC` waits for saved or acknowledged work before returning to the title. If a guest cannot confirm an action, it keeps the existing recovery copy and explains that a fresh join is needed. It does not call that action saved.

## Save and protocol compatibility

World schema 1 remains compatible. On entering the rebuilt room, the authority moves any resident saved inside a new solid to the nearest clear floor, in a durable transaction. It preserves profile identities, inventories, story state and discoveries. A failed write does not publish the correction.

The session protocol is version 2 because solid-object rules and new actions must agree on both phones. Older pairing envelopes are rejected. This does not invalidate old world saves. Movement messages are spaced by the host and acknowledged, rather than silently dropped while the guest waits.

## Review status

Generated art provenance is recorded in [room prompts](ART_ROOM_V2_PROMPT.md) and [resident prompts](ART_RESIDENT_V2_PROMPT.md). Automated checks cover all solid approaches, reachable furnishing actions, position repair, candle persistence, shared chest races, walking direction, touch cancellation, compact controls and quick-slot persistence. The expanded browser suite also retains save, offline, update, backup and real peer tests. Physical two-iPhone acceptance remains open.
