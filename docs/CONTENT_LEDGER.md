# Content ledger

## 0.1.10 household polish

New door components and the user-supplied home icon replace the corresponding presentation assets. Existing furnishings retain their approved designs; the bookshelf is 50% larger and the curtain rod is raised. Ledger, drawer and nightstand storage, nearest seating, chosen-position sleep, kitchen effects and appliance sounds extend the household interactions. No maps, NPCs, recipes, progression tiers or story chapters are counted as new content. The existing emptiness audit remains open; this is household acceptance work.

## 0.1.9 main menu

The user-supplied title artwork replaces the earlier title treatment. The five menu actions expose the existing game, save, co-op, settings and backup systems. No characters, maps, quests or progression counts are added; the existing emptiness audit remains open.

## 0.1.8 household polish

Existing objects gain corrected projected rotations, fixed doorframes, more visible pane animation, closer A targeting, deliberate bed use, moving quick slots and a quieter fire mix. No characters, locations, stories, recipes or quests are added. The earlier emptiness audit and open progression gaps remain unchanged.

## September 22, 0.1.7 rework

The active resident renderer uses registered raster layers derived from the approved original resident, with provenance and import rules in ART_RESIDENT_V7.md. The approved furniture fronts remain pixel-identical; additional directions, opening and occupied states extend them. ART_ROOM_V7.md and ART_ARCHITECTURE_V8.md record directional furniture, exact window frames, the retained generated walnut doors and distinct hall/kitchen finishes. Generic inspection text is no longer a gameplay interaction.

The stair is removed. The hall and kitchen add household space, seating and upgrade room, not completed exploration or cooking content. Kitchen appliances have reversible cues and a recipe menu. Letters and the welcome reward remain personal; functional furniture no longer generates observation discoveries.

Emptiness check: household customization and shared rest have repeatable use, but recipe progression, kitchen upgrades, town/NPC arcs, gathering, combat and wilderness are still absent. The new floor space is deliberately reserved for equipment; it is not counted as dense finished content. No major content phase is closed by this checkpoint.


0.1.5 adds original native character body, garment, hair and skin layers plus a brief occupied-bed reaction. These add personal expression, not story or quest counts.

0.1.4 adds the shared living room, a second bedroom, original code-native sofa/chair/journal artwork and the previous-day record. These are household systems and rooms, not additional completed story chapters or quest content. The earlier emptiness audit and later content targets remain open.

## Current authored content

| Content | Scope | Implementation | Final asset status |
| --- | --- | --- | --- |
| Castle household | Shared world with private bedroom editing | Two bedrooms, shared living room, entry hall and kitchen with separate player occupancy | Original separate furniture/materials, solid footprints, four directions and depth layers |
| Sealed letter, six-spoon wax mark | Personal discovery | Desk action and journal entry | Original writing and separate envelope sprite |
| Household hearth | Shared world event | Either resident lights it; persisted recap | Separate firebox and six-frame pixel fire |
| Welcome cacao parcel | Personal discovery and reward | Three beans once per resident | Original writing and separate parcel sprite |
| Candles | Shared reversible world state | Two independently switchable candles | Separate brass bodies, pixel flame animation and flickering light |
| Household chest | Shared storage | Atomic cacao deposits/withdrawals by either resident | Animated lid, shared opening state and solid footprint |
| Beds, seating and other furnishings | Household functions | Direct A actions, confirmed shared sleep, seating, clock-driven windows and saved touch arrangement | Split quilts, occupants and original pixel layers; exact window aperture masks |
| A household begins | Personal quest | Letter and parcel completion state | Introductory only |
| A light for the house | Shared quest | Hearth completion state | Introductory only |
| Room-material title | Title presentation | Uses the room's wallpaper and wood with Select game menu | Original reusable textures; former exterior image retained as history |
| Resident | Persistent character | Four directions, four walk phases, 32 by 48 native frame at 64 by 96 display | Shared body, clothing, hair and skin choices with a live creation preview |
| Wall doorways | Shared architecture | Automatic reciprocal travel across all five rooms; stairs removed | Original generated walnut door art for each wall and opening phase |
| App icon | Application asset | User-supplied moonlit castle artwork, preserved in docs/art | iOS touch and PWA icons; provenance in ART_HOME_ICON.md |

Current art retains `public/art/room-v2-props.png`, `public/art/room-v2-materials.png` and `public/art/room-v2-flames.png`. The original `residents-v2.png` supplies the approved identity and default raster; registered generated bases, hair and garments are packed into `src/game/art/resident-raster-data.ts`. Source images, prompts, hashes and the importer are preserved under `docs/art`. Additional furniture states use `furniture-v8-*.png` and `furniture-v9-*.png`; architecture uses `doors-v8.png` and `household-materials-v8.png`. See [original room provenance](ART_ROOM_V2_PROMPT.md), [resident layers](ART_RESIDENT_V7.md), [furniture preservation](ART_ROOM_V7.md) and [architecture provenance](ART_ARCHITECTURE_V8.md). Earlier paintings, door/stair sheets and procedural replacement attempts remain development history. Window skies and UI are original code. No existing game's assets were downloaded or copied. System fonts are used; dependency licenses remain with their packages.

No final NPC portraits, music, enemy sprites, finished maps, fish, recipes or romance events are claimed. No content counts from the master have been reduced.

## Setup and payoff

The sealed letter plants the idea that memory needs movement and a home. The six-spoon mark is an early Stillroom clue, not a solved mystery. Rook's practical note introduces his voice and a reason to visit the forge. Full biographies and chapter reveals must be authored before expansion.

## Emptiness audit

Phase 1 review: the room has three purposeful interactions and separate ownership rules, but it has no repeatable day loop yet. After settling in, it runs out of activities. The town, wilderness, recipe progression, social arcs and late-game reward timing are unimplemented, so this is not a content-phase completion audit.

Room rework review: furnishings have physical presence, direct use and opening motion. Candles, storage, seating, shared bed rest and touch arrangement are repeatable household functions. Time and window skies provide a daily rhythm, but there is still no town, cooking, gathering or exploration loop to fill that day. The entry hall and kitchen provide connected household space and upgrade capacity; they do not close those progression gaps. These are not counted as completed content phases or inflated quest counts.

Before closing any major content phase, record dead zones, weeks without authored events, NPC arcs that end early, exhausted systems, redundant rewards, repeated quest patterns, missing setup/payoff, and late rewards with no remaining use. Fill those holes before raising raw counts.

## 2026-09-21 household correction

Added one original eight-bar musical composition with alternate ending, room/night treatment and eleven material/action sound cues. All audio is local synthesis, with no third-party samples. Added code-drawn walnut doors and a shared native eye correction. The existing room now supports meaningful direct use and persistent furniture arrangement. No NPCs, locations, recipes or story chapters were added or counted. This is interaction work, not a content-density milestone. The prior emptiness audit remains open for the later game loop.

## September 22 household corrections

Original code-drawn recessed walnut side doorways and a cutaway south threshold replace incorrectly placed front-facing doors. Existing original window artwork is doubled along with its clock-driven sky; no new borrowed assets. Original resident sprite transformations add a clothed feminine torso, skirt/blouse, cropped and swept hair while retaining consistent walking heads. The user-supplied castle icon remains at docs/art/home-icon-source.png, with sizes/provenance in ART_HOME_ICON.md. These are presentation/access corrections; no new quests or content counts, and no content phase or emptiness-audit gate is claimed complete.
