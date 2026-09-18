# Content ledger

## Current authored content

| Content | Scope | Implementation | Final asset status |
| --- | --- | --- | --- |
| Arrival hall | Shared space | One playable room | Original temporary Phaser geometry |
| Sealed letter, six-spoon wax mark | Personal discovery | Journal entry | Original writing, temporary marker |
| Household hearth | Shared world event | Either resident lights it; persisted recap | Original temporary geometry |
| Welcome cacao parcel | Personal discovery and reward | Three beans once per resident | Original writing and temporary parcel |
| A household begins | Personal quest | Letter and parcel completion state | Introductory only |
| A light for the house | Shared quest | Hearth completion state | Introductory only |
| Castle exterior title scene | Title artwork | Original authored SVG | Temporary; detailed pixel art planned |
| App icon | Application asset | Original geometric cacao/moon design | Working icon |

Source files for artwork are `tools/create-art.mjs`, `tools/create-icons.py`, and `src/game/scenes/arrival-scene.ts`. No external game assets were downloaded or copied. System fonts are used. Package licenses remain with their dependencies.

No final NPC portraits, music, enemy sprites, finished maps, fish, recipes or romance events are claimed. No content counts from the master have been reduced.

## Setup and payoff

The sealed letter plants the idea that memory needs movement and a home. The six-spoon mark is an early Stillroom clue, not a solved mystery. Rook's practical note introduces his voice and a reason to visit the forge. Full biographies and chapter reveals must be authored before expansion.

## Emptiness audit

Phase 1 review: the room has three purposeful interactions and separate ownership rules, but it has no repeatable day loop yet. After settling in, it runs out of activities. The town, wilderness, recipe progression, social arcs and late-game reward timing are unimplemented, so this is not a content-phase completion audit.

Before closing any major content phase, record dead zones, weeks without authored events, NPC arcs that end early, exhausted systems, redundant rewards, repeated quest patterns, missing setup/payoff, and late rewards with no remaining use. Fill those holes before raising raw counts.
