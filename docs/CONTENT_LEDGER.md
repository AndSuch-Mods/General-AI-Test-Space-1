# Content ledger

0.1.5 adds original native character body, garment, hair and skin layers plus a brief occupied-bed reaction. These add personal expression, not story or quest counts.

0.1.4 adds the shared living room, a second bedroom, original code-native sofa/chair/journal artwork and the previous-day record. These are household systems and rooms, not additional completed story chapters or quest content. The earlier emptiness audit and later content targets remain open.

## Current authored content

| Content | Scope | Implementation | Final asset status |
| --- | --- | --- | --- |
| Castle room and landing | Shared spaces | Two bedrooms, shared living room and landing with separate player occupancy | Separate pixel furniture/materials, solid footprints and depth layers |
| Sealed letter, six-spoon wax mark | Personal discovery | Desk action and journal entry | Original writing and separate envelope sprite |
| Household hearth | Shared world event | Either resident lights it; persisted recap | Separate firebox and six-frame pixel fire |
| Welcome cacao parcel | Personal discovery and reward | Three beans once per resident | Original writing and separate parcel sprite |
| Candles | Shared reversible world state | Two independently switchable candles | Separate brass bodies, pixel flame animation and flickering light |
| Household chest | Shared storage | Atomic cacao deposits/withdrawals by either resident | Animated lid, shared opening state and solid footprint |
| Bed, books, plant, windows, table | Personal discoveries and household functions | Direct A actions, confirmed bed sleep and clock-driven windows | Split quilt/pillow and original pixel layers |
| A household begins | Personal quest | Letter and parcel completion state | Introductory only |
| A light for the house | Shared quest | Hearth completion state | Introductory only |
| Room-material title | Title presentation | Uses the room's wallpaper and wood with Select game menu | Original reusable textures; former exterior image retained as history |
| Resident | Persistent character | Four directions, four walk phases, 32 by 48 native frame at 64 by 96 display | Shared body, clothing, hair and skin choices with a live creation preview |
| Room doors and old west stair | Shared architecture | Room/landing travel and stair repair clue | Original generated door poses/stair, opening animation |
| App icon | Application asset | User-supplied moonlit castle artwork, preserved in docs/art | iOS touch and PWA icons; provenance in ART_HOME_ICON.md |

Current art uses `public/art/room-v2-props.png`, `public/art/room-v2-materials.png`, `public/art/room-v2-flames.png`, `public/art/room-v3-doors-stairs.png` and `public/art/residents-v2.png`. Exact built-in prompts are in [room provenance](ART_ROOM_V2_PROMPT.md), [new doorway provenance](ART_ROOM_V3_PROMPT.md) and [resident provenance](ART_RESIDENT_V2_PROMPT.md). Former title/interior paintings, first resident sheet and SVG generator remain as development history. Window views, garment masks and UI are original code. No existing game's assets were downloaded or copied. System fonts are used; dependency licenses remain with their packages.

No final NPC portraits, music, enemy sprites, finished maps, fish, recipes or romance events are claimed. No content counts from the master have been reduced.

## Setup and payoff

The sealed letter plants the idea that memory needs movement and a home. The six-spoon mark is an early Stillroom clue, not a solved mystery. Rook's practical note introduces his voice and a reason to visit the forge. Full biographies and chapter reveals must be authored before expansion.

## Emptiness audit

Phase 1 review: the room has three purposeful interactions and separate ownership rules, but it has no repeatable day loop yet. After settling in, it runs out of activities. The town, wilderness, recipe progression, social arcs and late-game reward timing are unimplemented, so this is not a content-phase completion audit.

Room rework review: furnishings have physical presence, authored interactions and opening motion. Candles, storage and bed rest are working household functions. Time and window skies provide a daily rhythm, but there is still no town, cooking, gathering or exploration loop to fill that day. The landing offers a real exit/return and one repair clue; its closed stair is an open content gap. These are not counted as completed content phases or inflated quest counts.

Before closing any major content phase, record dead zones, weeks without authored events, NPC arcs that end early, exhausted systems, redundant rewards, repeated quest patterns, missing setup/payoff, and late rewards with no remaining use. Fill those holes before raising raw counts.

## 2026-09-21 household correction

Added one original eight-bar musical composition with alternate ending, room/night treatment and eleven material/action sound cues. All audio is local synthesis, with no third-party samples. Added code-drawn walnut doors and a shared native eye correction. The existing room now supports meaningful direct use and persistent furniture arrangement. No NPCs, locations, recipes or story chapters were added or counted. This is interaction work, not a content-density milestone. The prior emptiness audit remains open for the later game loop.
