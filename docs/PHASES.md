# phases

Source requirements below are preserved verbatim from the master specification. They describe the target game, not a claim of implemented functionality. See ROADMAP.md and IMPLEMENTATION_STATUS.md for current evidence. User instructions take precedence over the master.

## 44. Milestone order

This order matters. Keep each milestone playable.

### Phase 0 — Research and project definition

Deliver:

- confirm repo choice
- check current official reference material
- write `README.md`
- write `ROADMAP.md`
- write `docs/DESIGN.md`
- create technical spike only if needed
- document legal/IP boundary: original assets only
- write `docs/MULTIPLAYER.md`
- define shared-world vs personal-player state before gameplay systems are built
- define host authority, guest profile persistence, quest scopes, cutscene scopes, reconnect behavior, and sleep/time behavior

Exit criterion:
- architecture and first vertical slice are clear enough to build without guessing every file, and the core entity/save model already supports one or two players.

### Phase 1 — iPhone PWA shell, offline install, saves, and co-op transport

Deliver:

- Vite/TypeScript app
- manifest
- service worker
- landscape layout
- safe-area handling
- title screen
- IndexedDB setup
- two world-save slots
- player UUID/profile model
- shared-world vs personal-player persistence model
- offline package download/progress
- persistent-storage request where supported
- save export/import shell
- multiplayer transport abstraction
- initial WebRTC DataChannel proof
- QR/manual session pairing
- host/join UI shell
- GitHub Pages deploy
- WebKit tests

Exit criterion:
- installed PWA launches offline, opens directly to the title/save menu, exposes two world save slots, and two iPhones can establish a local session without requiring an account or password.

### Phase 2 — Core game engine and two-player simulation

Deliver:

- Phaser scene structure
- multi-player-capable entity model
- one or two player entities
- player movement
- camera
- touch controls
- collision
- tilemap loading
- host-authoritative movement/state prototype
- interpolation of remote player movement
- same-map and different-map player support
- drop-in/drop-out
- pause/protected-interaction rules for single-player vs multiplayer
- basic UI
- network/debug overlay

Create three original placeholder spaces:

- castle room
- town street
- forest zone

Exit criterion:
- one player can move from castle to town to forest smoothly on iPhone, and two iPhones can join the same world, see each other, separate into different maps, reconnect, and continue without corrupting state.

### Phase 3 — Shared time, personal health/energy, and multiplayer-safe saves

Deliver:

- shared world clock
- day/dusk/night lighting
- personal health
- personal energy
- individual all-nighter/fatigue state
- condition messages
- one-player sleeping while the other remains awake
- both-player sleep time advance
- autosave
- host/guest profile persistence
- mirrored guest recovery copy
- slot load
- reconnect synchronization
- migration framework

Exit criterion:
- the world can run across several in-game days in either single-player or co-op, each player can have different fatigue, one can remain active while the other sleeps, and the world plus both personal profiles resume correctly after closing/reconnecting.

### Phase 4 — Combat vertical slice

Deliver:

- sword
- shield
- guard/stun
- one slime
- one ghost
- one skeleton
- one imp
- drops
- damage/knockback
- death/collapse handling

Exit criterion:
- forest at night contains a complete combat loop with usable loot.

### Phase 5 — Inventory, chest, crafting

Deliver:

- inventory
- hotbar
- equipment
- one chest
- crafting
- sorting/transfers
- basic resource economy

Exit criterion:
- gathered combat/forage resources can be stored and crafted into useful items.

### Phase 6 — Kitchen, food, magical chocolate

Deliver:

- cooking station framework
- at least three cooking interactions
- ordinary food
- chocolate tempering interaction
- magical chocolate
- at least four magical effects
- one staff prototype connected to chocolate resonance

Exit criterion:
- a dropped supernatural ingredient can be turned into chocolate that meaningfully changes exploration/combat.

### Phase 7 — Fishing

Deliver:

- cast
- bite
- tension/reel interaction
- at least six fish
- time/weather hooks
- equipment progression

Exit criterion:
- fishing is enjoyable on touch and produces useful food/crafting ingredients.

### Phase 8 — NPCs and dialogue

Deliver:

- six core NPCs
- portraits
- schedules
- dialogue conditions
- gifts
- relationship hearts
- event scenes

Exit criterion:
- town feels inhabited across a normal day.

### Phase 9 — Romance vertical slice

Deliver:

- flirt styles
- clue-based preferences
- friend-zone consequence
- courtship heart
- ask-to-date
- dating
- beating-heart engagement readiness
- engagement month
- NPC seeking player if not seen
- floating-heart proposal-ready state
- blacksmith ring commission
- marriage date scheduling
- long-delay warnings/breakup logic

Exit criterion:
- at least one NPC supports the full relationship arc end-to-end, then generalize to all eligible NPCs.

### Phase 10 — Story vertical slice

Deliver:

- Act I fully playable
- beginning of Act II
- first major supernatural mystery
- first Circle evidence
- one boss/major encounter
- story-driven chocolate ability

Exit criterion:
- game has an actual narrative hook rather than disconnected systems.

### Phase 11 — Art/audio pass

Deliver:

- replace placeholder art systematically
- original portraits
- original tilesets
- original enemy sprites
- improved animation
- original ambience/music
- particles/lighting
- polished UI

Exit criterion:
- screenshots look like one coherent game rather than a prototype.

### Phase 12 — Content expansion

Expand:

- maps
- seasons
- enemy variants
- recipes
- NPC arcs
- dates
- quests
- bosses
- castle upgrades
- deep thresholds
- postgame

Do not begin this phase while core systems are unstable.

---

