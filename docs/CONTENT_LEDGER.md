# Content ledger

## Current authored content

| Content | Scope | Implementation | Final asset status |
| --- | --- | --- | --- |
| Arrival hall | Shared space | One playable room with ten placed objects | Separate native pixel furniture/materials, solid footprints and depth layers |
| Sealed letter, six-spoon wax mark | Personal discovery | Desk action and journal entry | Original writing and separate envelope sprite |
| Household hearth | Shared world event | Either resident lights it; persisted recap | Separate firebox and six-frame pixel fire |
| Welcome cacao parcel | Personal discovery and reward | Three beans once per resident | Original writing and separate parcel sprite |
| Candles | Shared reversible world state | Two independently switchable candles | Separate brass bodies, pixel flame animation and flickering light |
| Household chest | Shared storage | Atomic cacao deposits/withdrawals by either resident | Separate chest sprite and solid footprint |
| Bed, books, plant, windows, table | Personal discoveries | Reachable contextual inspection and journal records | Separate original pixel sprites |
| A household begins | Personal quest | Letter and parcel completion state | Introductory only |
| A light for the house | Shared quest | Hearth completion state | Introductory only |
| Castle exterior title scene | Title artwork | Detailed original generated PNG | First detailed art pass, responsive title composition |
| Resident | Persistent character | Four directions, four walk phases, 32 by 48 native frame | Original transparent atlas, measured foot anchors, real side profile mirrored for left |
| App icon | Application asset | Original geometric cacao/moon design | Working icon |

Current room assets are `public/art/room-v2-props.png`, `public/art/room-v2-materials.png`, `public/art/room-v2-flames.png` and `public/art/residents-v2.png`. The title retains `public/art/title-castle.png`. Exact built-in generation prompts are in [room provenance](ART_ROOM_V2_PROMPT.md), [resident provenance](ART_RESIDENT_V2_PROMPT.md) and [title provenance](ART_TITLE_PROMPT.md). The first background painting, first resident sheet and SVG generator remain as development history. The icon generator is `tools/create-icons.py`. No existing game's assets were downloaded or copied. System fonts are used. Package licenses remain with their dependencies.

No final NPC portraits, music, enemy sprites, finished maps, fish, recipes or romance events are claimed. No content counts from the master have been reduced.

## Setup and payoff

The sealed letter plants the idea that memory needs movement and a home. The six-spoon mark is an early Stillroom clue, not a solved mystery. Rook's practical note introduces his voice and a reason to visit the forge. Full biographies and chapter reveals must be authored before expansion.

## Emptiness audit

Phase 1 review: the room has three purposeful interactions and separate ownership rules, but it has no repeatable day loop yet. After settling in, it runs out of activities. The town, wilderness, recipe progression, social arcs and late-game reward timing are unimplemented, so this is not a content-phase completion audit.

Room rework review: furnishings now have physical presence and authored interactions. Candle switches and communal storage provide working household functions. These changes address the room-quality review, not the missing daily loop. Inspectable furniture is not counted as a new quest or a completed content phase. Bed sleep and clock advancement remain unimplemented, with that limit stated in the inventory help.

Before closing any major content phase, record dead zones, weeks without authored events, NPC arcs that end early, exhausted systems, redundant rewards, repeated quest patterns, missing setup/payoff, and late rewards with no remaining use. Fill those holes before raising raw counts.
