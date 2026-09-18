# AGENTS.md — Haunted Chocolatier: Twilight

## Project title

**Haunted Chocolatier: Twilight**

Use this title throughout project documentation, menus, save metadata, build labels, and internal project references unless the user later changes it.

## 0. Read this first

This repository is for a private, single-player, iPhone-first web game inspired by the broad appeal of cozy town-life RPGs and the publicly shown mood of *Haunted Chocolatier*, but it must be its own game.

The goal is not to reproduce *Haunted Chocolatier* or *Stardew Valley*. Do not ship copied sprites, portraits, maps, UI layouts, dialogue, music, sound effects, fonts, logos, names, source code, or other copyrighted assets from either game. Public screenshots and footage may be studied only to extract high-level qualities such as density, camera framing, use of color, atmosphere, readability, and the mixture of cozy town life with supernatural adventure.

Create original code, original world layouts, original characters, original writing, original item names, original enemies, original music/SFX, and original pixel art. The result should feel like a darker, moonlit, cozy pixel-art action RPG with chocolate, relationships, exploration, and a haunted wilderness, without being a clone.

This file is the authoritative product and implementation brief. If another note conflicts with this file, follow this file unless the user explicitly overrides it.

Do not stop after scaffolding, menus, mockups, or a technical demo. Work in vertical slices that remain playable. Test each stable milestone before moving on.

---

## 1. Repository and permission rules

This is intended to be hosted from one of the user's existing GitHub repositories named:

- `General-AI-Test-Space-1`
- `General-AI-Test-Space-2`
- ...
- `General-AI-Test-Space-10`

Before writing anything:

1. Inspect those repositories.
2. Use the first repository whose current default branch is effectively empty and available for a new project.
3. Old commit history by itself does not make a repository unavailable. Judge the current branch contents.
4. Never overwrite an existing project.
5. If none are clearly empty, stop before modifying anything and ask the user which repository to use.
6. Do not touch unrelated repositories.

If GitHub permissions are missing, ask once, up front, for all permissions needed to finish the job instead of interrupting repeatedly later. Likely permissions include repository contents read/write, branch/commit access, GitHub Actions read/write, and GitHub Pages configuration/deployment access.

Use commits as stable checkpoints. Prefer one coherent commit per milestone or tightly related group of changes. Never leave the default branch knowingly broken.

---

## 2. Product goal

Build a polished, offline-capable, installable progressive web app that feels like a native landscape game on an iPhone.

The player lives in an old supernatural castle near a small town. The castle acts as home, workshop, kitchen, chocolate laboratory, and story hub. Its halls contain mysterious thresholds that eventually open into different regions of the outside world.

The daily loop is:

1. Wake, plan, socialize, shop, craft, cook, or prepare.
2. Explore town and wilderness.
3. Gather mundane and supernatural ingredients.
4. Fish.
5. Fight creatures, especially after dusk.
6. Return with materials.
7. Cook meals and make magical chocolates.
8. Improve equipment, castle rooms, storage, and production.
9. Build friendships and romances.
10. Advance a central mystery about why the surrounding land has become unstable and haunted.
11. Decide when to sleep. Staying awake through multiple nights is allowed, but exhaustion progressively limits the player.

The game should remain cozy and inviting even when it becomes eerie. The emotional target is "moonlit comfort with danger beyond the lamplight," not horror.

---

## 3. Public reference basis

At project start, re-check the current public material before making visual or design decisions. Treat all public material as reference only.

Useful official references known when this file was written:

- Official site: `https://www.hauntedchocolatier.net/`
- Official FAQ: `https://www.hauntedchocolatier.net/faq/`
- Official screenshots page: `https://www.hauntedchocolatier.net/media/`
- Official early gameplay post: `https://www.hauntedchocolatier.net/2021/10/08/hello-world/`
- Official shield/combat post: `https://www.hauntedchocolatier.net/2021/10/30/combat-shields-stuns-my-approach/`
- Official chocolate-making discussion: `https://www.hauntedchocolatier.net/2025/05/10/intuitive-chocolate-making/`
- Official 2026 development posts discussing recipe-book iteration and ongoing development.

High-level traits worth studying:

- Top-down/three-quarter pixel-art presentation.
- Dense, hand-authored environments with strong silhouettes.
- Darker interiors and wilderness balanced by warm pools of light.
- Rich autumnal, nocturnal, wintry, brown, blue, purple, green, and amber palettes.
- Large environmental landmarks that make areas memorable.
- Character sprites that remain legible against detailed backgrounds.
- Cozy domestic interiors contrasted with strange or magical spaces.
- Action-RPG combat with readable enemy tells.
- Shields/off-hand equipment as a deliberate combat choice.
- Chocolate and ingredient gathering as major progression systems.
- Town life and NPC relationships as a core pillar, not a side mode.

Do not trace or pixel-copy screenshots. Do not reproduce official characters, maps, portraits, logos, UI, music, or dialogue.

---

## 4. Platform target

Primary target:

- iPhone installed from Safari using "Add to Home Screen".
- Landscape orientation.
- Touch-first controls.
- Offline after the initial content download.
- Two world save slots.
- Full single-player play.
- Optional two-player same-room cooperative play between two iPhones from the beginning of the architecture.
- No online account requirement.
- No permanent game server dependency during normal play.

Secondary targets:

- Desktop browser for debugging.
- Keyboard and gamepad support for development and convenience.
- Other modern mobile browsers where practical.

The iPhone experience takes priority whenever the platforms conflict.

---


## 4A. Two-player co-op is a first-class requirement

The game must be designed for one or two players from the first implementation phase.

Do not build a single-player simulation and plan to bolt multiplayer onto it later.

The same world-save format, entity model, quest model, NPC system, combat system, map system, inventory rules, time system, and cutscene framework must support:

- one local player
- one host plus one guest player

Single-player must remain a complete experience. Multiplayer must feel like the same game with another person present, not a separate mode with stripped-down systems.

### 4A.1 Networking model

Use local peer-to-peer networking suitable for two iPhones.

Preferred first implementation:

- WebRTC DataChannel for gameplay traffic
- manual/QR-code pairing for local sessions so no matchmaking account is required
- local Wi-Fi or another mutually reachable network
- no cloud game server required after the peers connect

Build the networking layer behind a transport abstraction so a later native iOS wrapper could replace WebRTC with an Apple-native nearby transport without rewriting gameplay systems.

The host is authoritative for the shared world.

The guest sends player intent/input and receives authoritative state.

Do not transmit the entire game state every frame. Use compact events, snapshots, interpolation, reconciliation where needed, and interest/zone-based updates.

### 4A.2 World ownership

Each of the two normal save slots is a **world save**.

A world save owns all shared state, including:

- main story progression
- chapter flags
- world time and calendar
- weather
- seasons
- world seed
- discovered/opened global routes
- castle upgrades that physically change the world
- permanent town improvements
- bridge/road/shop/public-space changes
- major boss/world-state results
- shared quest states when the quest changes the world
- shop/world economy state where applicable
- shared storage explicitly designated as communal
- permanent environmental changes
- global event history

Either player may trigger or complete shared story progression and permanent world changes unless a specific event explicitly requires both players.

Do not make Player 1 the "real protagonist" mechanically. The host owns the save file, but either active player may meaningfully advance the shared world.

### 4A.3 Personal player progression

Each player has a separate persistent character profile within a world.

Personal state includes, at minimum:

- name
- appearance
- pronouns if used
- current health
- current energy
- individual fatigue/all-nighter state where appropriate
- personal inventory
- equipped weapons, tools, shield/off-hand, clothing, and accessories
- individual money wallet if the economy uses personal currency
- personal skill/mastery progression
- combat progression
- fishing progression
- cooking progression
- chocolate-making progression
- foraging progression
- learned personal techniques
- personal recipe knowledge unless a recipe is explicitly a shared household unlock
- personal codex/journal discovery
- personal friendship values
- personal romance values and states
- personal dialogue history
- personal gift history
- personal relationship events
- personal achievements/collections where appropriate
- personal quest state for character-specific or non-world-changing quests
- current map and position
- individual settings that logically follow the player

The design must make it possible for two people in the same world to progress differently.

Examples:

- Player 1 can be an excellent fisher while Player 2 specializes in combat.
- Player 1 can know a recipe Player 2 has not personally learned yet, unless the recipe was obtained as a shared household unlock.
- The two players can have different friendships and romances with the same town.
- One player can discover a secret room before the other.
- One player can see a personal NPC event that the other has not seen.

### 4A.4 Mirrored guest profile and reconnect safety

The host world save should retain an authoritative copy of the guest character profile associated with that world.

The guest device should also retain a local mirrored copy keyed to the world's unique ID.

On reconnect:

1. identify the world UUID
2. identify the guest player UUID
3. compare save revisions
4. reconcile only through explicit version/revision rules
5. never silently replace newer progression with an older copy

The host remains authoritative while a session is active.

The mirrored guest copy exists for continuity, recovery, and fast rejoin, not as a second competing world authority.

### 4A.5 Shared vs personal progression rule

Use this decision rule:

**If a change permanently alters the common world, it is shared.  
If it primarily describes who a player is, what that player knows, owns, has learned, or how an NPC feels about that player, it is personal.**

Shared examples:

- main story chapter completes
- town bridge is repaired
- blacksmith shop expands
- a castle wing is restored
- a dangerous road is permanently warded
- a boss is defeated and the region changes
- a new public festival is unlocked

Personal examples:

- sword upgrade
- fishing skill
- individual inventory
- individual recipe discovery
- friendship
- romance
- date history
- individual NPC cutscene
- personal collection journal

When a system does not fit neatly into one category, document the decision in `docs/MULTIPLAYER.md`.

### 4A.6 Story progression

The main storyline is shared across the world save.

Either player can:

- discover main-story evidence
- complete a story objective
- turn in a main-story quest
- defeat a story boss
- activate a permanent story mechanism
- make a world-changing story decision

Once a shared story flag changes, it changes for the world.

Do not require both players to be online to advance the story unless a particular scene or encounter was intentionally designed as a cooperative set piece.

If one player advances the story while the other is absent, the returning player enters the new world state.

Provide an optional journal/recap mechanism so a returning player can understand major events they missed without forcing the world to roll back.

### 4A.7 Discovery and cutscene ownership

Cutscenes are not automatically shared.

Classify each event as one of:

#### Personal discovery event

Examples:

- finding a hidden room
- seeing an NPC's personal scene
- discovering a diary
- learning a personal recipe
- triggering a relationship event
- encountering a minor supernatural memory

Only the triggering player sees the scene.

The other player may trigger their own version later if the underlying event still makes narrative sense.

#### Shared-world event

Examples:

- bridge collapses
- town ward activates
- major boss changes the region
- festival begins
- castle wing physically opens for everyone
- main-story event changes the whole town at that moment

If both players are currently connected, both should receive the shared event presentation unless there is a strong design reason not to.

If the second player is offline, do not block the host from advancing. Record the event and provide appropriate recap/context when that player returns.

#### Cooperative event

Use sparingly.

These are scenes or encounters intentionally designed around both players being present.

Do not make ordinary progression dependent on always having two players.

### 4A.8 Multiplayer cutscene behavior

The shared world cannot blindly pause for one player's private dialogue or personal scene.

In single-player:

- normal pause rules from the time-system section apply

In multiplayer:

- opening inventory, a personal journal, personal dialogue, or a personal cutscene does not globally freeze the other player
- the participating player is placed into a protected interaction state when appropriate
- nearby enemies should not unfairly kill a player who is locked in required dialogue/cutscene presentation
- personal scenes should be short enough that this protection cannot be exploited as a general combat strategy
- world time normally continues

For a true shared-world cutscene:

- the host may freeze the shared simulation
- both connected players receive the synchronized presentation
- gameplay resumes together afterward

For a cooperative boss or scripted set piece:

- use explicit ready states/checkpoints when needed rather than surprising one player with a forced scene while they are far away

### 4A.9 Independent movement and zones

Do not tether the two players to one camera, one screen, or one map.

Because each person has their own iPhone:

- players may be in different buildings
- players may be on different outdoor maps
- one may fish while the other fights
- one may shop while the other explores
- one may return to the castle while the other remains in the wilderness

The host must simulate only the world activity necessary for each active zone plus globally important systems.

Do not fully simulate every enemy on every unloaded map merely because two players exist.

### 4A.10 World clock

The world uses one shared in-game clock.

Both players experience the same:

- date
- season
- weather
- day/night state
- festival calendar
- shop hours
- global NPC schedule clock

Personal fatigue is tracked separately.

If one player stays awake all night while the other sleeps, do not automatically force both players to share the same fatigue penalty.

Sleeping in multiplayer needs explicit rules:

- one player may go to bed before the other
- the sleeping player can enter a sleep/wait state
- time must not instantly jump to morning while the other player is still actively playing
- if both players choose to sleep, advance to the normal wake time
- if one player sleeps and the other continues through the night, wake/sleep behavior should remain coherent and should not duplicate or erase time

Design and test this early.

### 4A.11 Death, collapse, and rescue

Do not make a co-op player's mistake automatically end the other player's session.

Preferred model:

- a defeated player enters a downed or collapse state
- the other player has a limited opportunity to revive/rescue them when appropriate
- if not rescued, the defeated player recovers according to normal game rules
- shared world play continues unless the event is a special wipe condition such as a boss encounter explicitly designed that way

All-nighter exhaustion collapse remains individual unless a story event says otherwise.

### 4A.12 Inventory, drops, and loot ownership

Do not let both clients independently claim the same drop.

The host assigns authoritative ownership.

Use clear rules:

- direct enemy drops may be free-for-all with authoritative pickup
- quest-critical shared items become shared world flags/items
- personal equipment rewards go to the player who earned or selected them
- shared chests are explicitly communal
- each player has personal inventory
- support direct item trading/gifting between players
- prevent duplication through disconnect/reconnect or simultaneous pickup

### 4A.13 NPCs, friendship, and romance

NPC relationship state is personal per player.

An NPC may:

- be close friends with one player and barely know the other
- date one player while remaining platonic with the other
- react differently to each player's history
- remember gifts separately
- expose different personal events to each player

If both players pursue the same romance candidate, do not silently merge their relationship state.

The content system should support believable NPC reactions to overlapping romantic interest rather than crashing, duplicating marriage state, or pretending the other player does not exist.

For the initial implementation, enforce a sensible exclusive-relationship rule once an NPC enters a committed stage with one player. Earlier flirtation or interest may overlap and can generate unique dialogue.

Marriage is personal, but marriage can create shared-world consequences such as the spouse occupying or visiting the castle.

Document edge cases before implementing full romance co-op.

### 4A.14 Quests

Every quest must declare its scope:

- `personal`
- `shared_world`
- `cooperative`

`personal`:
- tracked independently
- one player finishing it does not finish it for the other

`shared_world`:
- either player can advance it
- completion changes the world/save for both

`cooperative`:
- intentionally designed for two active players
- should never contain irreplaceable main-story progression unless a single-player equivalent exists

Do not infer scope from quest text. Store it explicitly in quest data.

### 4A.15 Single-player parity

Every required main-story objective, boss, traversal mechanic, puzzle, cooking task, relationship path, town upgrade, and ending must be completable in single-player.

Never create a required mechanic where Player 2 acts as a permanent second switch, second combat role, second inventory, or second vote.

Co-op may provide:

- alternate tactics
- faster gathering
- combination abilities
- revives
- optional cooperative puzzles
- special dialogue
- multiplayer-only side challenges

But it must not make single-player feel like the incomplete version.

### 4A.16 Co-op joining flow

Title screen should support:

- Continue / Single Player
- Host Co-op
- Join Co-op

Host:

1. choose World Save 1 or 2
2. enter the world
3. open the co-op/session menu
4. generate pairing information/QR code
5. wait for guest
6. approve or recognize the guest profile
7. continue playing

Guest:

1. choose Join Co-op
2. scan/read host pairing information
3. select or create the character profile associated with that world
4. connect
5. receive required world state
6. spawn at an appropriate safe location

Do not require both people to restart the app merely to connect.

### 4A.17 Drop-in/drop-out behavior

Co-op must support drop-in/drop-out.

If the guest disconnects:

- host keeps playing
- shared world remains valid
- guest character is removed safely from active simulation
- pending item transactions resolve deterministically
- guest progression is saved

If the guest reconnects:

- resynchronize world state
- restore guest personal state
- place the guest safely
- do not replay every old network event

The host may also play that world alone between co-op sessions.

### 4A.18 Multiplayer testing

Multiplayer is a release-blocking core system, not optional polish.

Automated and manual tests must cover:

- two-player connection
- QR/manual pairing
- reconnect
- guest disconnect during combat
- guest disconnect during item transfer
- guest disconnect during a personal cutscene
- host leaving session
- two players in same map
- two players in different maps
- simultaneous item pickup
- simultaneous NPC interaction
- shared quest advancement by either player
- personal quest independence
- shared story progression
- personal relationship progression
- one player seeing a personal cutscene without forcing it on the other
- synchronized shared-world cutscene
- both players sleeping
- one player sleeping while the other remains awake
- separate fatigue states
- separate inventories
- trading
- guest returning after host advanced the story alone
- save/reload of a world that has a guest profile
- offline local-network play after all game assets are installed

Real-device testing on two iPhones is required before declaring co-op stable.

---


## 5. Recommended technical stack

Use a stable, boring stack rather than a clever one.

Recommended baseline:

- TypeScript.
- Vite.
- Phaser 3, using the latest stable Phaser 3 release available at implementation time unless a newer Phaser major version is demonstrably mature and safer.
- WebGL renderer with Canvas fallback only where practical.
- IndexedDB for save data and persistent settings.
- Dexie or a similarly small IndexedDB wrapper if it meaningfully reduces error-prone code.
- Service worker for offline application shell and asset-pack caching.
- A PWA manifest with standalone display and landscape orientation.
- Vitest for unit tests.
- Playwright for browser integration tests, including WebKit.
- GitHub Actions for build/test/deploy.
- GitHub Pages for the initial deployment if it satisfies the user's privacy requirements.

Avoid a heavy React-style application shell unless it solves a real problem. The game should own the screen. Standard DOM overlays are fine for login, install/update status, accessibility dialogs, and text-heavy menus.

Use a clear domain-oriented architecture instead of putting the entire game in one scene.

Suggested structure:

```text
/
  AGENTS.md
  README.md
  ROADMAP.md
  CHANGELOG.md
  docs/
    DESIGN.md
    CONTENT_PIPELINE.md
    SAVE_FORMAT.md
    OFFLINE_AND_SAVES.md
    MULTIPLAYER.md
    TEST_PLAN.md
  public/
    manifest.webmanifest
    icons/
  src/
    app/
    game/
      scenes/
      systems/
      entities/
      components/
      world/
      input/
      rendering/
      audio/
    content/
      items/
      recipes/
      npcs/
      dialogue/
      quests/
      enemies/
      loot/
      locations/
    persistence/
    networking/
    multiplayer/
    pwa/
    ui/
    utils/
  tools/
    asset-pipeline/
    content-validation/
  tests/
```

Do not let the directory structure become ceremony. Add folders when the code actually needs them.

---

## 6. Performance budget

Target a stable 60 FPS on a modern iPhone in ordinary gameplay.

Design for:

- 60 FPS target.
- Graceful 30 FPS fallback if thermal or battery conditions require it.
- Low garbage generation inside the update loop.
- Object pooling for particles, damage text, common enemies, and projectiles.
- Texture atlases rather than hundreds of independent image files.
- Chunked maps.
- Culling of off-screen entities.
- Limited dynamic lights.
- Precomputed or tile-based collision where possible.
- Audio voice limits.
- No network calls during gameplay after offline installation.
- No runtime dependency on an LLM or cloud service.

Provide a developer FPS/debug overlay behind a settings flag.

Test memory pressure by moving repeatedly between major zones for at least 20 minutes. Watch for retained textures, duplicated audio buffers, runaway event listeners, and save objects that grow without bounds.

---

## 7. Display, camera, and pixel-art rules

Use a fixed logical world scale and integer-aligned rendering wherever possible.

Recommended starting point:

- 32 px logical world tiles.
- Player roughly 32×48 logical pixels, with room to revise after visual tests.
- Four-direction movement initially.
- Eight-direction aim/combat may be added without requiring eight-direction walking sprites.
- Pixel-art nearest-neighbor scaling.
- Camera eased slightly, but do not introduce float shimmer into pixel sprites.
- No blurry CSS scaling.

The game must handle the iPhone's wide landscape aspect ratio and safe areas. Do not assume a simple 16:9 rectangle.

Use:

- CSS `env(safe-area-inset-*)`.
- A central world viewport with UI adapting to wider screens.
- No critical button under a notch, Dynamic Island, or home indicator.
- A manifest orientation hint for landscape.
- A friendly rotate-device overlay in portrait because iOS browser APIs do not always permit programmatic orientation locking.

Touch targets should be comfortably large. Let the user move or resize the on-screen controls later.

---

## 8. Art direction

The visual brief is "cozy gothic moonlight," not horror and not bright farm-country.

Core principles:

- Environments are detailed and layered.
- Silhouettes remain readable.
- Lamps, fireplaces, shop windows, candles, moonlight, glowing fungus, and magic create warm/cool contrast.
- Interiors lean toward aged wood, burgundy fabric, brass, stone, faded wallpaper, apothecary glass, books, carved trim, and old ironwork.
- Forests are deep and lush rather than empty.
- Night should be beautiful, not merely dark.
- Use localized light and subtle atmospheric particles to make nighttime exploration desirable.
- Town areas feel lived-in.
- Avoid generic "asset pack" composition.

Pixel-art requirements:

- All final shipped art must be original.
- Do not upscale low-detail placeholder art and call it final.
- Characters need enough layering and animation to feel expressive.
- Named NPCs require portraits with expression variants.
- Enemies need silhouettes that distinguish variants before the player reads a name label.
- Important interactables need animation or lighting cues rather than floating UI markers everywhere.

Portrait expression baseline for named NPCs:

- neutral
- happy
- amused
- annoyed
- angry
- sad
- worried
- surprised
- blush/romantic

Portraits may share a common framing system, but facial features, hair, clothing, posture, and color accents must be character-specific.

If high-quality original artwork cannot be produced in the first implementation pass, use clearly marked original placeholder art and keep the asset pipeline replaceable. Do not block systems work waiting for perfect sprites.

---

## 9. Audio direction

All music and sound effects must be original or generated from assets with clear permission.

Music target:

- Light but nocturnal.
- Melodic rather than oppressive.
- Chamber textures, celesta-like tones, plucked strings, warm keys, bass clarinet/bassoon-like colors, restrained percussion, soft pads, and occasional music-box textures are appropriate.
- Combat music should become rhythmically active without turning into unrelated metal/action music.
- Town music should remain welcoming.
- The castle should sound old, safe, and mysterious.
- Wilderness at night should feel magical and alert.

Create separate themes or adaptive layers for:

- castle/home
- town day
- town night
- forest day
- forest dusk/night
- ruins/crypt
- combat
- boss encounters
- romance events
- chocolate-making/kitchen
- rain/storm ambience

Do not copy melodic material from *Stardew Valley* or *Haunted Chocolatier*.

If a complete soundtrack is not practical in the first pass, build an audio system with original short loops and ambience that can later be replaced without code changes.

---

## 10. PWA, offline behavior, installation, and local data

There is no password gate in the default game.

The installed PWA should open directly to a polished title screen, then the two save slots. Do not ask for a PIN, passphrase, account, login, or network connection during ordinary play.

If a local app-lock feature is ever added later, it must be optional and must remember that the device has already been authorized until the user explicitly locks it again. It must never reset, replace, migrate, or otherwise modify save data merely because the lock state changes.

### 10.1 First-run flow

Target flow:

1. User visits the site online.
2. Minimal application shell loads.
3. Title screen appears immediately.
4. The app checks which versioned game-content packs are available locally.
5. If the full offline package is not present, show a clear `Make Available Offline` action or begin the download automatically if that produces the better iPhone experience.
6. Show exact progress and the approximate remaining asset count/size where available.
7. Service worker caches the application shell and immutable/versioned asset packs.
8. When complete, display `Ready for offline play`.
9. Encourage `Add to Home Screen` when the browser allows useful installation guidance.
10. User can start or load either save without another setup screen.

### 10.2 Subsequent launch

1. PWA opens with or without internet.
2. Display the title screen.
3. Present Continue, Save Slot 1, Save Slot 2, Settings, and Backup/Restore as appropriate.
4. Load all normal game content locally.
5. Do not perform required network calls during gameplay.

### 10.3 Storage responsibilities

Use:

- Cache Storage / service-worker caches for the application shell, sprites, atlases, maps, audio, fonts, and other versioned static assets.
- IndexedDB for save data, settings, content metadata, migration state, and small mutable local records.
- IndexedDB, not the browser HTTP cache, for game saves.

Request persistent storage with `navigator.storage.persist()` where supported, but never assume the browser grants it.

The game must remain safe if the service-worker cache is refreshed or replaced. Updating cached assets must never delete save slots.

### 10.4 Offline completeness

The offline indicator must distinguish:

- `Online, offline package incomplete`
- `Downloading offline package`
- `Offline ready`
- `Running offline`
- `Update available`

Before declaring the game offline-ready, validate that all mandatory asset bundles for the currently installed version are present.

Optional future content packs may be downloaded separately, but the installed core game must never boot into missing-texture or missing-audio failure because the network disappeared.

### 10.5 Save backup

Because mobile browser data can be cleared, add:

- Export Save Slot.
- Import Save Slot.
- Export Both Saves.
- A visible last-backup date.
- Schema/version validation on import.
- A clear warning before overwriting an occupied slot.

Use Web Share / file APIs where supported and a normal file-download fallback where not.

### 10.6 Hosting/privacy note

This is a personal project, but do not confuse a private source repository with private web hosting. GitHub Pages access characteristics depend on the repository/account configuration. Document the actual deployment visibility in the README once deployment is configured.

Do not add fake client-side security simply to make a public static site appear private.

## 11. Save system

Exactly two normal **world save slots**.

A world may be played:

- entirely single-player
- single-player first and later hosted for co-op
- repeatedly with the same guest character
- alone again after a co-op session

Do not maintain separate incompatible "single-player saves" and "multiplayer saves".

Each world slot stores, at minimum:

### Shared world state

- schema version
- world UUID
- save revision
- world seed
- in-game date/time
- weather and season
- shared story chapter/flags
- shared quest state
- permanent town changes
- castle/world upgrades
- world unlocks
- enemy/boss/world progression
- shared chest/storage contents
- shop/world economy state
- global event history
- global RNG state where deterministic authority requires it

### Host player profile

- player UUID
- name and appearance
- current map and position
- health/energy/fatigue
- personal inventory
- equipped gear
- personal money if used
- personal skills/masteries
- crafting unlocks
- recipe knowledge
- cooking/chocolate progression
- combat progression
- fishing progression
- personal quest state
- NPC friendship
- NPC romance states
- dialogue memory
- scheduled relationship events
- personal codex/collections
- player-specific settings

### Guest player profile

When a guest has joined this world before, retain the same categories of personal state for that player's UUID.

The guest device also stores a mirrored local copy associated with the world UUID for reconnect/recovery.

Keep truly global application settings separate from world save slots.

Autosave at safe points:

- sleep/state transition
- zone transition
- leaving important menus after a meaningful state change
- major quest completion
- after relationship state changes
- after permanent world changes
- after a player-to-player item transaction
- after guest join/leave synchronization
- every few real-time minutes when not in a transactional state, if state is dirty

Use a write queue/debounce to avoid hammering IndexedDB.

Never autosave in the middle of applying a partially completed world transaction, inventory transfer, network reconciliation, or story-state mutation.

Use versioned migrations. Add tests that load older fixtures.

The host is authoritative during active co-op, but persistence must be structured so a networking bug cannot corrupt both the shared world and both player profiles in one unrecoverable write.

Maintain a small rolling recovery checkpoint where practical.


---

## 12. New-game and co-op entry flow

Keep setup quick on mobile.

### New world

1. Choose World Save Slot 1 or 2.
2. Create the first player profile.
3. Enter player name.
4. Choose a small set of appearance options.
5. Optional pronouns.
6. Optional difficulty/accessibility defaults.
7. Short opening sequence.
8. Begin in the castle.

Do not create a 20-screen character creator before the player can move.

The world can be hosted for Player 2 immediately or at any later point.

### First-time guest

When Player 2 joins a world for the first time:

1. pair with the host
2. create a player profile for that world
3. choose name/appearance
4. receive a short arrival introduction appropriate to current world progression
5. join without resetting or replaying the host's entire opening

The guest's existence must fit the fiction cleanly even if the host is already well into the game.

### Returning guest

Recognize the guest player's UUID/world pairing and restore their personal progression.

Do not force them through character creation again.

Opening premise:

The player has taken possession of a long-neglected hilltop castle outside the town. In co-op, the second player is another resident/partner in the castle's new household rather than a disposable visitor.

The legal explanation can be inheritance, purchase, joint stewardship, or an unusual bequest, but the real reason the castle accepts its new residents becomes part of the mystery.

The first night establishes:

- the castle is inhabited by harmless or ambiguous spirits
- some doors behave strangely
- the kitchen/chocolate room matters
- the woods become more dangerous after dusk
- the town's blacksmith is an early practical ally
- the protagonists are not trapped; the castle is a home and gateway, not a prison

The writing should work naturally with either one active protagonist or two.


---

## 13. World structure

The world should be handcrafted, compact enough to learn, and dense enough to reward revisiting.

Initial regions:

### Castle

Core rooms:

- bedroom
- main hall
- kitchen
- chocolate laboratory
- pantry/storage
- workshop
- library/archive
- courtyard
- threshold gallery
- initially sealed rooms for upgrades/story

The castle is safe enough to feel like home, though small supernatural events can occur there.

### Town

Original working name: **Gloambridge**. This is a placeholder and may be renamed.

Required locations:

- blacksmith/forge
- grocer/general store
- bakery or inn
- apothecary
- fish shop/dock
- carpenter/building service
- small town hall/community building
- tavern or evening social location
- a few residences
- town square
- paths to wilderness

Avoid cloning Pelican Town's layout or one-to-one functional mapping.

### Wilderness

Initial zones:

- Briarwood: dense forest, common gathering, slimes after dusk
- Moonmere: lake/river fishing region
- Old Quarry: ore and combat
- Ruined Chapel / crypt entrance: skeletons and story
- Gloam Hollow: later dangerous forest
- Deep Threshold regions unlocked through castle doors

The player should be able to see environmental changes between day, dusk, night, weather, and seasons.

---

## 14. Time, day/night, and exhaustion

Time is important, but the game must not feel like a stopwatch.

### 14.1 Default time scale

Use this as the initial authoritative pacing target:

- 1 real-world second = 1 in-game minute.
- 1 real-world minute = 1 in-game hour.
- A complete 24-hour in-game day therefore lasts approximately 24 real-world minutes if nothing pauses the clock.
- 6:00 AM to midnight lasts approximately 18 real-world minutes.
- The clock continues naturally through midnight and sunrise rather than ending the day automatically.

Implement this through a single tunable constant or configuration value, such as:

`SECONDS_PER_GAME_MINUTE = 1.0`

Do not bake real-time durations directly into NPC schedules, quests, shop hours, fatigue, weather, or other game systems. Those systems must operate against in-game time so the global time scale can later be tuned to values such as 0.85 or 1.15 without rewriting content logic.

The initial value is 1.0 unless playtesting demonstrates a clear pacing problem.

### 14.2 When time pauses

Pause world time during:

- dialogue
- cutscenes
- relationship scenes
- inventory management
- chest/storage management
- crafting menus
- shop interfaces
- recipe books and journals
- major settings/menu screens
- dedicated cooking minigames
- dedicated chocolate-making/tempering minigames

The player should not lose a meaningful portion of a day merely because they are reading, organizing inventory, learning a cooking interaction, or making a menu decision.

Normal world time continues during:

- walking/exploration
- combat
- gathering
- chopping/mining/field actions
- fishing
- waiting in the world
- traveling through ordinary connected maps

Do not automatically pause time simply because the player entered a building.

If a special activity creates a strong design reason to slow rather than fully pause time, keep that behavior configurable and document the exception.

### 14.3 Day phases

Provide:

- dawn
- day
- dusk
- night
- late night
- sunrise/day transition

Use gradual lighting and ambience changes rather than abrupt color swaps.

Dusk and night matter mechanically because some creatures, ingredients, fish, NPC behavior, and supernatural events change at those times.

### 14.4 Sleeping

The player is never forced to sleep at a fixed hour.

The player may:

- sleep in the evening
- sleep after midnight
- stay awake through sunrise
- return home and sleep during the day after an all-night expedition

Do not teleport the player to bed at 2:00 AM or any other fixed time.

The bed should generally be usable whenever the player is at home, barring a specific story event.

Sleeping advances time to an appropriate waking point according to the sleep rules. Keep the exact sleep-duration model configurable until playtesting, but a full normal sleep should clear the accumulated all-nighter penalty.

### 14.5 Staying awake all night

The player may remain active through sunrise.

Track `consecutiveAllNighters`.

Energy cap by consecutive all-nighters:

- normal/rested: 100%
- after 1 all-nighter: 80%
- after 2: 60%
- after 3: 40%
- after 4: 20%
- after attempting a 5th consecutive all-nighter: terminal exhaustion begins

Food and normal restorative items may restore current energy only up to the current fatigue cap.

Sleeping normally resets the all-nighter streak and restores the cap.

A short nap may restore some current energy but should not necessarily erase deep fatigue. Keep this behavior configurable until playtesting.

### 14.6 Fifth all-nighter

After the player crosses the fifth sunrise without real sleep:

- keep the maximum near 20% initially
- begin a slow unavoidable exhaustion pressure
- maximum usable energy gradually declines over the day
- eventually the player passes out if they still refuse sleep

Do not make the collapse happen with no warning.

### 14.7 In-world condition warnings

Do not show sterile text such as "Energy max reduced to 60%" as the primary communication.

Use characterful messages such as:

- mild: "You catch yourself staring at the kettle long after it stopped whistling."
- worse: "Your hands feel a little too heavy today."
- severe: "Even the castle ghosts are giving you worried looks."
- critical: "The hallway seems to sway when you stop walking."

The HUD may still show the reduced energy cap visually.

NPCs can notice severe exhaustion and comment on it.

### 14.8 Time-system testing

Add automated tests for:

- correct game-minute advancement from the configured time scale
- pausing and resuming the world clock
- no time loss while dialogue or menus are open
- NPC schedules remaining correct if `SECONDS_PER_GAME_MINUTE` changes
- crossing midnight without forcing sleep
- crossing sunrise while awake
- all-nighter streak increments
- normal sleep resetting the streak
- save/load preserving exact in-game date and time


## 15. Core player stats

Start with:

- Health
- Energy
- Exhaustion / fatigue-cap state
- Defense
- Power
- Move speed
- Crit chance
- Guard stability
- Cooking skill
- Chocolate skill
- Fishing skill
- Foraging skill
- Combat skill

Avoid adding a dozen RPG stats that the player cannot feel.

Health and energy can be restored by food. Magical chocolate can also apply buffs or unlock temporary abilities.

---

## 16. Movement and controls

Touch-first landscape layout:

Left side:

- virtual movement stick, dynamic or fixed according to settings

Right side:

- primary attack
- guard/off-hand
- interact/use
- contextual tool/ability button
- quick-item or chocolate button

Bottom or lower-middle:

- compact hotbar
- active item indicator
- health/energy
- current magical chocolate effect if any

The UI must not cover the character during normal play.

Add:

- tap-to-open inventory
- pause/settings
- optional vibration/haptics where browser support permits
- adjustable control opacity
- adjustable control size
- left-handed layout option later

Desktop controls:

- WASD/arrow movement
- mouse or keys for aim/attack
- gamepad support

Combat must never require auto-aim to function.

---

## 17. Combat

Combat should feel more deliberate than old-school "walk into enemy and spam."

Core loop:

- read enemy tell
- reposition
- attack
- guard or dodge
- exploit stagger/stun
- choose weapon/off-hand
- consume food/chocolate strategically

### 17.1 Weapons

Initial weapon classes:

- sword
- heavy blade/hammer
- bow or ranged tool
- magical staff unlocked later

Each needs a real gameplay identity.

### 17.2 Shield system

Shield is an off-hand option.

Baseline behavior:

- guard reduces or blocks appropriate frontal attacks
- well-timed guard can stun or heavily stagger some enemies
- guard consumes stability or energy
- holding guard forever should not be optimal
- some attacks break guard
- some projectiles can be blocked
- some magical attacks require movement instead

Provide other off-hands later:

- lantern
- charm
- buckler
- catalyst
- throwing focus

### 17.3 Hit quality

Required polish:

- clear hit flashes without excessive screen whiteout
- small hit-stop on strong impacts
- knockback where appropriate
- distinct audio per material/enemy family
- readable invulnerability frames
- no mushy collision
- enemy wind-up animations
- mobile-friendly attack buffering

---

## 18. Enemy families and loot

Enemies are part of the ingredient economy, not merely obstacles.

### 18.1 Slimes / blobs

Spawn rule:

- ordinary wilderness slimes appear primarily from dusk through night
- special locations may override this for story reasons

Variants:

- Moss Slime
- Moon Slime
- Amber Slime
- Gloom Slime

Possible drops:

- Slime Gel
- Moon Gel
- Resin Pearl
- Glow Mucus
- rare flavor catalyst

Use non-gross naming/visuals where possible because the drops become food-adjacent magical ingredients.

### 18.2 Ghosts

Variants:

- Lantern Ghost
- Draft Ghost
- Mourner
- Mischief Wisp
- armored or elder variant later

Possible drops:

- Ectoplasmic Sugar
- Memory Dust
- Cold Spark
- Whisper Thread

Some ghosts should be non-hostile. "Ghost" is a faction/ecology, not automatically an enemy label.

### 18.3 Skeletons

Variants:

- Rustbone
- Briarbone
- Bell-Ringer
- old guard variant

Possible drops:

- Bone Ash
- Tarnished Coin
- Grave Salt
- old metal fittings

### 18.4 Imps / small demons

These should be less rare than a boss but noticeably harder than common enemies.

Variants:

- Cinder Imp
- Gloom Imp
- Bramble Imp

Behavior:

- faster movement
- feints
- short ranged attack or leap
- punishes holding guard too long

Possible drops:

- Ember Kernel
- Imp Horn Shard
- Soot Pepper
- Infernal Sugarglass

The visual design should be mischievous and eerie, not gore-heavy.

### 18.5 Bosses

Bosses should be tied to a location or story truth.

Do not simply make oversized normal enemies.

Each boss should test a mechanic the player has already learned.

---

## 19. Items, inventory, crafting, and chests

### 19.1 Inventory

Grid-based inventory with:

- stackable materials
- equipment slots
- hotbar
- category filters
- sort button
- hold/tap details
- split stack
- quick transfer
- "favorite/lock" item to prevent accidental sale/discard

Mobile interactions must require minimal precision.

### 19.2 Chests

Chests support:

- custom name
- icon/color marker
- sort
- quick deposit matching items
- quick stack into existing stacks
- transfer all by category
- proximity crafting option later

Avoid making storage management a punishment.

### 19.3 Crafting

Crafting should resemble the clarity of familiar life sims without copying exact menus.

Categories:

- field tools
- lights
- furniture
- storage
- cooking tools
- chocolate equipment
- combat consumables
- wards
- utility charms
- castle improvements

Recipes can be learned from:

- NPCs
- books
- quests
- exploration
- experimentation
- skill progression

---

## 20. Food and kitchen redesign

Cooking is a major system, not a single "have ingredients -> click recipe" screen.

Keep it interactive but not tedious.

### 20.1 Cooking stations

Use a staged system:

- prep board
- mixing bowl
- stove/oven
- pan/pot
- cooling/resting area
- plating
- chocolate tempering/molding station

A recipe does not need every station.

### 20.2 Interaction model

Examples:

- chopping uses a short timing/rhythm interaction
- stirring asks the player to maintain a moving target zone
- heating asks the player to control temperature
- tempering chocolate uses temperature and timing windows
- plating can affect presentation/bonus without ruining the food

The system must work well on touch.

### 20.3 Avoid repetition fatigue

After the player demonstrates mastery:

- unlock assisted preparation
- widen timing windows
- allow batch cooking
- unlock quick-cook for basic dishes
- keep special/legendary recipes more hands-on

Do not force the same 20-second minigame hundreds of times.

### 20.4 Food effects

Ordinary food:

- health recovery
- energy recovery
- short practical buffs

Chocolate:

- can restore modest energy
- often provides magical effects
- may interact with the staff
- should be more about special capability than raw healing

---

## 21. Magical chocolate system

This is a signature mechanic.

Use three layers:

1. Base chocolate / cacao quality.
2. Flavor/support ingredients.
3. Supernatural essence.

Chocolate has properties such as:

- potency
- stability
- duration
- flavor family
- magical alignment

Example effects:

- Spectral Sight: reveals hidden traces, ghosts, or secret paths
- Emberblood: temporary attack/fire effect
- Moonstep: short dash or reduced stamina cost
- Ward Truffle: temporary barrier
- Gatherer's Ganache: nearby forage subtly glows
- Echo Praline: reveals recent supernatural events
- Iron Cocoa: guard stability increase
- Quiet Mint Dark: lowers enemy detection radius
- Fisher's Bonbon: improves bite window or rare-fish chance
- Hearth Chocolate: slows fatigue drain for a limited time but does not erase all-nighter cap

Avoid pure "press button, become invincible" design.

Strong magical chocolates should require uncommon creature drops, exploration, recipe discovery, or careful crafting.

### 21.1 Staff

The magical staff is a later unlock.

It does not use a generic mana bar by default.

Preferred design:

- eating certain magical chocolates grants temporary `Cocoa Resonance`
- the staff channels the active resonance into spells
- different chocolate families modify available spells
- this makes cooking and combat mechanically connected

Example:

- Ghost-aligned chocolate -> spectral bolt / reveal
- Ember-aligned chocolate -> flame arc
- Slime-aligned chocolate -> binding puddle / bounce ward
- Bone/mineral-aligned chocolate -> armor / stone spike

Keep the spell count small enough for touch controls.

---

## 22. Fishing

Fishing returns as a substantial side activity.

Do not copy Stardew Valley's fishing minigame exactly.

Possible mobile-friendly model:

- choose cast direction/distance with press-and-release
- visible water tells indicate habitat
- bite phase uses line tension rather than keeping a fish inside an identical vertical bar
- drag direction and tension matter
- fish make recognizable movement patterns
- equipment changes forgiveness, lure behavior, and target species

Support:

- day/night fish
- weather fish
- seasonal fish
- location-specific fish
- supernatural fish
- ingredient fish
- rare quest fish

The minigame should be learnable in under a minute but retain skill.

---

## 23. NPC system

Every named NPC needs:

- portrait
- expression set
- personality
- values
- dislikes
- schedule
- home/work locations
- relationship arc
- personal conflicts/goals
- dialogue style
- gift preferences
- event scenes
- reaction to story changes
- reaction to severe player exhaustion where appropriate

Dialogue must not feel like a random quote dispenser.

Dialogue selection should consider:

- date/season
- time
- location
- weather
- friendship
- romance state
- recent gifts
- recent quests/events
- whether the NPC has already said the line recently
- current main-story chapter

Maintain dialogue history to avoid obvious repetition.

No online AI generation at runtime. All dialogue ships locally.

---

## 24. Romance and relationship system

All unmarried adult civilian townspeople should be romanceable unless a specific story reason makes that impossible. Minors are never romanceable.

The system should be more behavioral than "fill hearts, hand over one fixed item."

### 24.1 Friendship stage

Use a visible friendship heart scale.

A useful initial target:

- 0–6 hearts: ordinary friendship progression
- around 7 hearts: flirt options can begin to appear if the NPC is available

Do not make the exact threshold impossible to tune later.

### 24.2 Flirt system

Flirt dialogue choices use styles such as:

- sincere
- playful
- bold
- teasing
- intellectual
- practical
- protective
- vulnerable

Each NPC has preferences, boundaries, and situational modifiers.

The correct approach must be inferable from:

- the NPC's prior dialogue
- how they react to other people
- their humor
- their stated values
- their personal events

Do not expose a hidden spreadsheet saying "NPC likes playful +3."

A poor flirt can:

- do nothing
- lower romantic interest
- lower friendship if badly inappropriate
- trigger a temporary friend-zone state

A friend-zone should be a meaningful social consequence, not an irreversible trap caused by one accidental tap.

### 24.3 Courtship heart

When:

- friendship is high enough
- romantic interest is high enough
- the NPC is not currently blocking romance
- required personal events are complete

show a distinct larger heart at the end of the meter.

Visual:

- bigger than normal hearts
- subtle glitter
- no constant bouncing that becomes distracting

This means the NPC is receptive to being asked on a date / becoming a couple.

The player must choose to ask.

### 24.4 Dating

Dating adds:

- new schedules/events
- deeper dialogue
- date invitations
- relationship-specific conflicts
- more consequential flirt/response choices

Sustained healthy dating fills a hidden/visible courtship progression.

### 24.5 Beating heart

When the relationship is ready for a serious commitment, the special heart becomes visibly beating.

This means the player can ask to enter a formal engagement/courtship promise.

This is not yet the final wedding proposal.

### 24.6 Engagement trial

After both characters agree:

- run approximately one in-game month of engagement
- the player is expected to meaningfully interact with the partner every day
- do not require the player to hunt through the entire map with no clue
- if the player has not met them by evening, the partner may seek the player out at the castle, town, or another sensible location
- one missed day should not instantly end the relationship
- repeated avoidance, poor choices, or neglect should create strain

The purpose is to make engagement feel like a relationship, not a countdown.

### 24.7 Floating-heart stage

After the engagement period is successfully completed:

- the special heart becomes surrounded by small floating hearts
- formal marriage proposal becomes available
- the blacksmith unlocks the bespoke ring commission

### 24.8 Ring system

Do not use Stardew Valley's mermaid-pendant structure.

Filler design to implement unless the user replaces it:

The blacksmith makes a custom ring from three components:

1. Band material:
   - silver
   - gold
   - darksteel
   - moon-silver, later
2. Stone:
   - mined/found gemstone
3. Shared token:
   - a small symbolic component connected to the partner, learned through their story

The shared token is not stolen from the NPC. It is an ingredient or motif that reflects a memory, value, location, hobby, or shared event.

The blacksmith takes several in-game days to make the ring.

The final ring appearance and description change according to the selected materials.

### 24.9 Marriage timing and failed engagement

After the relationship reaches the formal proposal-ready stage, the game should not require an immediate wedding.

However, if roughly one in-game year passes without a real proposal/wedding plan:

- partner concern events begin
- dialogue becomes increasingly direct
- player gets multiple warnings and chances to address it
- if the player repeatedly refuses to commit or avoids the conversation, engagement can end
- the former partner remains hurt/angry for a long period
- use approximately two in-game years as the initial cooldown before a full romance restart is possible

Do not trigger this from a hidden timer with no warning.

---

## 25. Initial NPC roster

These are original placeholders and can be renamed/redesigned. They exist so systems have concrete content.

### Rook Vale — blacksmith

- adult, unmarried
- dry humor, observant, practical
- respects consistency more than grand gestures
- romance clues favor sincerity and practical care
- runs the forge
- crafts equipment upgrades and eventual proposal ring
- has unresolved family history tied to the old quarry

### Mira Voss — archivist

- adult, unmarried
- curious, reserved, incisive
- likes questions asked in good faith
- dislikes performative bravado
- helps decode the castle archive
- story connection to the central haunting

### Juniper Bell — baker/innkeeper

- adult, unmarried
- social, energetic, intuitive about people
- playful flirting works only after genuine friendship
- helps teach advanced conventional cooking
- serves as a major social hub

### Cal Mercer — fisher

- adult, unmarried
- quiet, wry, outdoors-oriented
- responds to shared experiences rather than excessive compliments
- introduces fishing improvements and night-water lore

### Elia Moor — apothecary/botanist

- adult, unmarried
- analytical but warm
- studies supernatural plants
- helps convert monster drops into safer culinary ingredients
- becomes important to magical chocolate research

### Rowan Pike — night warden

- adult, unmarried
- skeptical of the castle at first
- prefers directness
- patrols the dangerous edge of town
- teaches advanced defensive combat

Add additional NPCs gradually. Do not generate 30 shallow characters before the initial six are good.

---

## 26. Main story

Working story concept: **The Stillroom Mystery**.

This is an original plot and may be revised as the game develops.

### 26.1 Premise

Long ago, the region learned that certain foods, especially cacao preparations, can absorb faint supernatural "impressions": emotion, memory, fear, joy, grief, courage.

Normally these impressions dissipate harmlessly.

A secretive organization called **The Stillroom Circle** discovered how to refine and preserve them.

Their leader, known publicly as a respected antiquarian and privately as **The Curator**, became obsessed with preventing loss. The Curator believes memory is the only thing that makes a life matter, so nothing meaningful should ever be allowed to fade.

The Circle's experiments began trapping emotional residue in the land.

The result:

- more ghosts
- unstable thresholds
- altered wildlife
- creatures carrying magical essences
- localized hauntings
- sections of forest that seem to remember older versions of themselves

The old castle belonged to a chocolatier who realized food could do the opposite: instead of imprisoning memory, carefully made chocolate could let it move, transform, or be shared safely.

The old chocolatier disappeared before finishing the work.

The castle has now accepted the player as the next keeper.

### 26.2 Tone

The Curator should be creepy because of calm certainty, not because of constant gore or screaming.

They should sometimes make reasonable observations:

- people fear being forgotten
- towns erase uncomfortable history
- grief changes memory
- the player is also turning supernatural creatures into ingredients

The villain is wrong in method and control, not a cardboard "evil for fun" figure.

### 26.3 Structure

Act I: The Castle Wakes
- arrive
- meet town
- encounter first harmless castle ghosts
- learn basic cooking/chocolate
- first night combat
- notice unnatural residue

Act II: The Woods Remember
- thresholds begin opening
- ghosts repeat incomplete memories
- blacksmith/quarry story
- first Circle symbol
- discover monster essences can stabilize chocolate magic

Act III: The Stillroom
- identify the Circle
- meet or recognize the Curator
- town history conflicts surface
- magical chocolate becomes a tool for reading memories rather than only fighting

Act IV: The Cost of Preservation
- learn the old chocolatier opposed the Circle
- discover some hostile creatures are byproducts rather than invaders
- choose which town wards and alliances to build
- lieutenants/bosses represent different failed preservation experiments

Act V: Accord
- final confrontation with the Curator
- use chocolate/ward systems developed across the game
- goal is to stop the large-scale extraction/trapping process
- do not erase the supernatural world
- stabilize boundaries around town and major roads
- preserve haunted wilderness as a continuing ecosystem

Postgame:
- slimes, ghosts, skeletons, imps, and supernatural zones remain
- town becomes better defended
- NPCs react to the new normal
- high-level chocolate recipes and deep thresholds continue
- optional unresolved trace of the Circle supports future content without making the ending meaningless

### 26.4 Circle complexity

Keep the antagonist structure understandable.

Use:

- one central leader, The Curator
- up to three major lieutenants/bosses
- ordinary followers mostly appear through evidence, scripted scenes, or a few encounters

Do not create ten villain factions.

---

## 27. Quest system

Quest types:

- story
- NPC personal
- relationship
- town improvement
- exploration
- bounty/hunt
- cooking/chocolate
- fishing
- crafting

Avoid quest design that is only "bring 20 items" repeatedly.

Good quest examples:

- reconstruct a ghost's memory from three locations
- cook a dish with a target property, not a fixed recipe
- identify which nocturnal creature is disturbing a route
- fish a species during a specific condition
- repair an old town ward with the blacksmith
- help an NPC make a personal decision
- defend a location while another character completes a task
- choose which of two town improvements happens first

Quest state must be data-driven and serializable.

---

## 28. Castle progression

The castle should change visibly.

Upgrade/unlock examples:

- restored kitchen
- chocolate tempering room
- larger pantry
- workshop
- expanded bedroom
- portrait gallery
- library restoration
- greenhouse/conservatory
- ward room
- second storage room
- guest/partner space after marriage
- opened threshold doors

Upgrades should add function, not only cosmetics.

After marriage, partner behavior should make the castle feel occupied without turning them into a stationary furniture piece.

---

## 29. Economy

Keep money useful but not dominant.

Income sources:

- chocolate sales
- cooked goods
- fish
- gathering
- crafted goods
- quests
- occasional rare loot

Expenses:

- ingredients
- equipment upgrades
- building/castle upgrades
- ring commission
- shop stock
- furniture/cosmetics
- fishing gear
- recipes/books
- travel/utility unlocks if used

Do not make the game a pure shop spreadsheet.

If a chocolate shop becomes a larger feature, treat it as a later system layered onto the adventure loop rather than blocking the initial vertical slice.

---

## 30. Seasons and weather

Architect for seasons from the start, but do not let them block the first playable build.

Target:

- spring
- summer
- autumn
- winter

Weather:

- clear
- rain
- storm
- fog
- snow where seasonally appropriate

Weather affects:

- ambience
- some fish
- some forage
- a few enemy spawns
- NPC schedules/dialogue
- lighting
- occasional magical events

Avoid maintaining four completely separate maps for every region. Use tileset variants, overlays, object swaps, and seasonal decoration layers where possible.

---

## 31. Content-density mandate and full-game scope

The early milestones prove systems. They are not the intended final amount of content.

A technically solid game can still feel empty. Prevent that deliberately.

Astra has standing permission to expand the world, characters, quests, story, items, recipes, encounters, locations, secrets, dialogue, and postgame beyond the examples in this file without asking the user for every addition, provided the expansion obeys the project's pillars and originality rules.

Expansion must be additive and coherent. Do not silently replace major premises, romance rules, fatigue rules, chocolate magic, the castle-home concept, or the central Stillroom mystery without a concrete reason and explicit user approval.

### 31.1 Full-content targets

These are scope targets for a mature personal release, not requirements for the first vertical slice. Adjust them when playtesting proves a number is wrong, but do not reduce scope merely because placeholders exist.

Target approximately:

- 30–45 hours for a focused first main-story playthrough.
- 60–100+ hours for a player who pursues relationships, upgrades, collections, exploration, and optional quests.
- A postgame that remains worthwhile after the central story resolves.
- 1 castle complex with at least 12 meaningfully distinct functional/upgradable rooms or spaces.
- 1 dense town containing roughly 18–24 named residents over time.
- 10–12 romanceable adult characters once the roster is mature, with varied personalities and schedules.
- 8–10 major exterior/dungeon regions beyond town/castle, each with multiple subareas rather than one rectangular map.
- At least 30 distinct explorable map spaces/subareas before counting interiors.
- 8–10 enemy families with at least 25 meaningful variants across the full game.
- 5–7 major bosses or equivalent set-piece encounters.
- 50+ fish or fishing discoveries across ordinary, seasonal, nocturnal, weather, and supernatural categories.
- 60+ conventional cooking recipes.
- 35+ magical chocolate recipes/effects, including upgraded or altered variants.
- 100+ crafting/building recipes across progression, decoration, storage, combat, and utility.
- 250+ distinct inventory objects once mature, counting ingredients, fish, monster materials, equipment, artifacts, and crafted goods, but not meaningless recolors.
- 35–50 main-story missions/scenes/quest steps organized into actual chapters.
- 60+ substantial side/personal quests across the full roster.
- 8 major seasonal festivals or town events, ideally two per season.
- 20+ smaller recurring/random world events.
- 30+ secrets, hidden rooms, environmental puzzles, rare encounters, or collectible discoveries.

These numbers are guides for density. Do not pad counts with indistinguishable items, copied dialogue, palette swaps, or `bring me 20 objects` quests.

### 31.2 Anti-emptiness rule

Every major region should answer at least four of these questions:

- What can I gather here that I cannot get everywhere else?
- What happens here at night that does not happen by day?
- What changes with season or weather?
- Which NPCs use this place and why?
- Which story or personal event can occur here?
- Which enemy ecology belongs here?
- What secret becomes reachable after a later ability/tool?
- What fishing or cooking ingredient makes returning useful?
- What visual landmark makes the place memorable?
- What world-state change can visibly alter this place later?

If a region only answers one or two, it is probably scenery rather than gameplay and must be enriched or removed.

### 31.3 Pacing targets

The opening should be dense with discovery without becoming tutorial spam.

Suggested rhythm:

- First 3 in-game days: movement, castle, town, basic gathering, first meaningful NPCs, kitchen/chocolate hook.
- First 7 days: combat, fishing, crafting/storage, dusk/night danger, first supernatural mystery.
- First 12 days: first significant castle repair, first new wilderness route, first personal NPC event, first advanced chocolate effect.
- First season: player should understand all major pillars but still have obvious locked depth in each one.
- Later seasons: alternate story chapters, character events, festivals, upgrades, recipes, region unlocks, and rare encounters so several in-game weeks never pass with nothing new except grinding.

As a default content-health check, a normal player should encounter at least one meaningful new event, unlock, discovery, quest development, relationship scene, or world change every 2–4 in-game days during the first year.

Do not satisfy this with popups. The new content should usually arise in the world.

---

## 32. Story expansion framework

The five-act outline in this file is a spine, not the whole script.

Astra is explicitly authorized to expand it into a complete narrative while preserving the following truths:

- the castle has a reason to accept the protagonist
- supernatural impressions/memories can become trapped in matter and places
- food/chocolate can transform, carry, release, or stabilize those impressions
- The Stillroom Circle tried to preserve memory through control
- The Curator is the central antagonist
- the Curator's motivation must be understandable even when their methods are unacceptable
- the old chocolatier opposed the Circle and left unfinished work behind
- the final resolution stabilizes coexistence instead of deleting the supernatural ecosystem
- monster ingredients remain mechanically relevant after the story

### 32.1 Story bible

Before writing large amounts of story content, create and maintain `docs/STORY_BIBLE.md` containing:

- factual timeline of the region
- what actually happened versus what townspeople believe happened
- Curator biography and turning points
- old chocolatier biography
- Stillroom Circle origin and internal philosophy
- each lieutenant's motive and relationship to the Curator
- castle history
- supernatural rules
- unresolved mysteries
- chapter-by-chapter reveals
- setup/payoff ledger
- which NPC knows which facts and when
- ending state and postgame consequences

Never solve a mystery by inventing a new rule in the same scene. Seed important revelations earlier.

### 32.2 Chapter structure

Expand the five acts into approximately 12–16 chapters.

Each chapter should contain some mixture of:

- a concrete player goal
- a new location or changed old location
- character interaction
- an investigative clue
- one gameplay-system use
- a reversal, complication, or discovery
- optional material for players who explore

Not every chapter needs a boss.

Use quieter chapters between high-intensity arcs so town life and relationships matter.

### 32.3 Side stories should feed the main world

NPC personal arcs should sometimes illuminate the central mystery from ordinary perspectives.

Examples:

- an old family property contains a Circle mark without the family knowing its meaning
- a fisher recognizes that one species disappeared when a haunting intensified
- the blacksmith inherited a metalworking technique originally used for ward anchors
- the apothecary discovers a plant changed by repeated exposure to emotional residue
- a romance candidate has a family story that contradicts the official town history

Do not make every character secretly a member of the conspiracy. Most people should have ordinary lives touched indirectly by the same world.

### 32.4 Mystery design rules

For each major mystery:

1. Seed at least two observable clues before the reveal.
2. Allow an attentive player to form a plausible theory early.
3. Let some clues be misinterpretable without lying to the player.
4. Pay off visual/environmental details as well as dialogue.
5. Record discovered evidence in an in-game journal.
6. Never require the player to remember one throwaway line from twenty hours earlier with no journal support.

### 32.5 Choices and consequences

Use choices to alter:

- dialogue
- alliances
- who helps during a chapter
- which town upgrade happens first
- how an NPC personal arc resolves
- which optional scene the player sees
- some boss or quest approaches

Avoid huge mutually exclusive branches that would require building two separate games.

The main ending may have a few tonal variants based on relationships, town preparedness, and how much optional evidence the player found, while preserving the core postgame world.

---

## 33. NPC life, social density, and relationship content

Six initial NPCs are enough for the vertical slice but not for the mature town.

Build the town in waves so every new character has depth.

### 33.1 Mature roster shape

Aim for approximately 18–24 named residents:

- 10–12 romanceable unmarried adults
- several married couples or long-term partners
- older residents
- one or more families
- a small number of children/teens who are never romanceable
- at least one visiting or seasonal character
- town service characters who have lives beyond their shop counter

Do not make every adult single merely to maximize romance choices.

### 33.2 Required depth for a romance candidate

Before calling a romance candidate content-complete, give them:

- a recognizable verbal style
- normal and alternate schedules
- seasonal behavior
- rain/storm behavior
- at least 40–60 general contextual dialogue entries before variations
- unique gift reactions
- 5+ friendship/personal events
- at least 3 meaningful courtship/dating events
- at least 2 relationship conflict or vulnerable conversations
- engagement-specific dialogue/events
- wedding content
- post-marriage schedule and dialogue
- post-marriage personal goals
- anniversary/birthday or equivalent recognition
- reactions to important story chapters
- reactions to player exhaustion at severe levels where in character

The exact counts can grow; they are floors for avoiding cardboard relationships.

### 33.3 Required depth for non-romance residents

A non-romance NPC still needs:

- personal concerns and goals
- schedule changes
- at least one multi-step personal arc
- story/world reactions
- friendship rewards or practical unlocks when appropriate
- meaningful relationships with other NPCs

### 33.4 NPC-to-NPC life

NPCs must interact with one another without the player being the center of every scene.

Support:

- friendships
- rivalries
- family ties
- coworkers
- gossip
- shared meals
- arguments
- town meetings
- visits to other homes/shops
- festival pairings
- responses when another NPC's quest changes their life

Occasionally let the player walk into a conversation already happening.

### 33.5 Memory system

Track a bounded set of socially important memories:

- gifts recently given
- flirt attempts
- promises/choices
- dates attended or missed
- help during personal quests
- major dialogue commitments
- engagement obligations
- story decisions affecting that NPC

NPCs should refer back to meaningful history sometimes.

Do not retain every trivial interaction forever.

### 33.6 Dating should create activities, not only dialogue

Potential dates:

- night fishing
- cooking together
- forest walk
- town festival outing
- forge project
- library/archive research
- stargazing from castle roof
- ghost-watching
- picnic
- helping with the NPC's hobby
- short combat/exploration excursion for suitable characters

Build reusable date-scene systems, but write character-specific reactions and choices.

### 33.7 Marriage is continued content

Marriage must not be a terminal reward screen.

After marriage:

- partner retains a life and schedule
- partner can spend time at their old workplace/friends/family
- shared castle spaces change
- new dialogue and small domestic events occur
- partner can occasionally initiate a date or request
- conflicts can occur without turning the relationship into constant maintenance
- anniversaries and story reactions continue
- optional late-game couple projects can unlock

Do not turn the spouse into an automated chore machine.

---

## 34. Town progression and community change

The town should visibly evolve because of the player's actions.

Use a `Town Projects` system separate from personal castle upgrades.

Possible projects:

- repair a bridge or trail
- restore street lamps/wards
- reopen an abandoned storefront
- improve dock access
- rebuild a community greenhouse
- repair a clock/bell tower
- reinforce wilderness shelters
- restore an old public garden
- reopen a tram, ferry, or threshold connection later

Projects require combinations of:

- money
- crafted materials
- monster-derived ward ingredients
- NPC quest progress
- story permissions

### 34.1 Meaningful results

A project must change something visible or functional:

- new route
- new shop inventory
- safer night travel in one corridor
- new festival location
- NPC schedule changes
- new fishing access
- new forage
- new conversations
- new resident/visitor

### 34.2 Town readiness

Track a broad `ward readiness` or `community preparedness` state through concrete completed projects rather than a floating morality score.

This state may affect later story sequences and how well the town handles supernatural surges.

Do not make the player permanently fail the main story because they skipped one optional lamp project.

---

## 35. Chocolate business and confectionery progression

Chocolate must eventually become more than a buff-crafting menu.

The castle includes or unlocks a small confectionery operation. It should provide a satisfying economic and creative loop without becoming a spreadsheet simulator.

### 35.1 Production loop

1. Gather/buy base ingredients.
2. Refine cacao/chocolate base.
3. Cook or temper a recipe.
4. Add flavor and supernatural components.
5. Choose a form, finish, or presentation for some recipes.
6. Produce a batch with quality traits.
7. Keep some for adventure use.
8. Sell some through the confectionery.
9. Learn from customer demand and special orders.
10. Reinvest into equipment, ingredients, town/castle improvements, and experimentation.

### 35.2 Shop operation

The player should not have to stand behind a counter every day.

Support both:

- passive operation after the player stocks displays
- optional active shop sessions with richer customer interaction and higher potential value

The player chooses what is displayed and roughly how much is stocked.

Customers have broad preferences rather than exact hidden equations.

Examples:

- bitter/dark
- creamy
- fruit
- floral
- spicy
- nostalgic
- adventurous/supernatural
- giftable/luxury

NPC dialogue and prior purchases should make preferences learnable.

### 35.3 Reputation

Use several reputation dimensions instead of one generic star meter:

- quality
- creativity
- reliability
- local warmth/community connection
- magical curiosity, unlocked later

These affect clientele and special orders.

Do not punish experimentation so harshly that the optimal play is one profitable recipe forever.

### 35.4 Special orders

Use authored orders as mini-stories:

- wedding box
- apology gift
- memorial chocolate
- festival assortment
- expedition ration
- a chocolate designed to calm a harmless ghost
- a request with dietary/flavor constraints
- rare collector request

Some orders should teach the player about a customer or town event.

### 35.5 Equipment progression

Confectionery upgrades can include:

- grinder/refiner
- tempering table
- molds
- infusion vessel
- cooling cabinet
- display case
- packaging station
- enchanted stillroom apparatus late in the story

Upgrades should change capacity, consistency, available techniques, or recipe options.

---

## 36. Exploration, secrets, collections, and revisitation

Exploration needs permanent curiosity hooks.

### 36.1 Layered access

Revisit old areas after gaining:

- better tools
- new threshold keys
- magical chocolate effects
- staff abilities
- weather/season access
- story permission
- town infrastructure upgrades

Avoid colored-key-door design everywhere. Make access logic fit the world.

### 36.2 Secret types

Use a mixture of:

- hidden passages
- environmental riddles
- ghost trails
- time-of-day events
- weather events
- suspicious walls/floors
- fishing secrets
- rare monster encounters
- movable objects
- old mechanisms
- chocolate-reactive symbols
- short traversal challenges

### 36.3 Collections

Potential journals/collections:

- fish journal
- creature field notes
- chocolate recipe folio
- conventional recipe book
- relic cabinet
- ghost-memory archive
- mineral/gem display
- plant/herb catalog
- town-history scrapbook

Collections should provide occasional useful unlocks, lore, cosmetics, or recipes rather than existing only for a percentage counter.

### 36.4 Daily variation without procedural emptiness

Keep major maps handcrafted.

Vary them with data-driven daily/seasonal layers:

- forage nodes
- fishing schools
- monster populations
- wandering merchants
- ghost events
- weather hazards
- rare doors/portals
- NPC excursions
- temporary resource sites

Do not generate meaningless randomized terrain just to claim replayability.

---

## 37. Player progression, equipment, and mastery

Long-term progression needs several parallel tracks so one activity never becomes mandatory for everything.

### 37.1 Skills

Use the core skills already listed, expanded into mastery tracks:

- Combat
- Guarding/Defense
- Foraging
- Fishing
- Cooking
- Chocolate Craft
- Crafting/Workshop

Do not create a skill solely because a number can level up.

### 37.2 Progression shape

Use levels primarily to grant:

- recipes
- technique improvements
- quality consistency
- small efficiency gains
- meaningful specialization choices

Avoid runaway stat inflation.

Every few levels, present a small choice between play styles.

Examples:

Combat:
- stronger stagger vs faster recovery

Fishing:
- wider tension forgiveness vs better rare-fish reads

Chocolate:
- longer-duration magic vs stronger but shorter effects

Cooking:
- larger batch efficiency vs better high-quality outcomes

Choices should be respec-able later at a cost so experimentation is safe.

### 37.3 Equipment progression

Equipment tiers should change behavior as well as numbers.

Examples:

- sword with wider second swing
- shield with better perfect-guard window
- lantern that exposes hidden ghosts
- staff focus that alters resonance behavior
- fishing reel that favors control over maximum tension

Avoid a ladder where every new sword simply says `+5 damage`.

### 37.4 Rare equipment

Use named equipment sparingly.

A rare item should come from:

- a boss
- an NPC arc
- a difficult crafting chain
- a secret
- a story decision

Give it a history and mechanical identity.

---

## 38. Calendar, seasons, festivals, and recurring life

The calendar must make the world feel inhabited even when the main story is quiet.

### 38.1 Calendar structure

Use a tunable original calendar rather than automatically copying another game's exact structure.

Recommended prototype:

- 4 seasons
- 24 days per season
- 6-day week

Change this only after pacing tests.

### 38.2 Festivals

Target two major public events per season for the mature game.

Original event concepts:

Spring:
- Lantern Thaw: residents release ward-lanterns as winter hauntings recede
- First Market: food, crafts, fishing contest, early-year social event

Summer:
- Moonmere Night: lake celebration with night fishing and floating lights
- Midsummer Forge Fair: crafts, equipment demonstrations, town project reveal

Autumn:
- Gloaming Feast: cooking/chocolate competition with supernatural ingredients
- Night of Names: respectful remembrance festival where ghosts may appear peacefully

Winter:
- Hearthweek: several evenings of small household/town events rather than one giant festival
- Long Night Vigil: protective wards, story lore, combat or defense variant depending progression

Do not make festivals reskinned shopping menus.

Festivals should mix:

- unique dialogue
- minigames
- relationship moments
- one-time or rotating rewards
- story/world lore
- visual transformation of the town

### 38.3 Birthdays and personal dates

Named residents may have birthdays or personally significant dates.

Also support:

- relationship anniversaries
- wedding anniversary
- memorial dates relevant to specific families
- recurring market days
- rotating shop closures

Keep the calendar readable. Do not create so many mandatory dates that the player feels managed by a planner.

### 38.4 Random/ambient events

Examples:

- meteor shower
- dense supernatural fog
- traveling confectioner
- migrating fish
- ghost procession visible from a safe distance
- temporary night market
- rare mushroom bloom
- imp mischief event
- storm-damaged road
- castle room behaving strangely

Random events should have sensible rarity and not invalidate planned activities constantly.

---

## 39. Endgame, postgame, and long-term play

The game must not feel finished in the bad sense immediately after the final confrontation.

### 39.1 Post-story world

After the main story:

- supernatural creatures remain
- town wards visibly improve
- previously dangerous roads may become safer without becoming empty
- NPC dialogue acknowledges the outcome
- Circle remnants and historical evidence can still be found
- the Curator's legacy remains in optional content even if the central threat is resolved
- high-end chocolate effects become practical for deep exploration

### 39.2 Deep Thresholds

Use the castle's threshold gallery as the main late-game expansion framework.

Deep Threshold areas can provide:

- difficult handcrafted expeditions
- remixed enemy combinations
- rare ingredients
- unique environmental rules
- optional bosses
- old memories
- legendary recipes/equipment

Avoid an infinite bland dungeon as the only endgame.

If repeatable procedural challenge spaces are eventually added, use them alongside authored regions.

### 39.3 Legendary confectionery

Postgame goals may include:

- master every chocolate family
- fulfill complex bespoke orders
- produce legendary chocolates requiring ingredients from several systems
- restore all confectionery equipment
- host a major tasting/festival
- build relationship-specific signature confections

### 39.4 Continued social play

Postgame relationship content should include:

- spouse/partner scenes
- late personal quests
- town-project reactions
- festivals with changed dialogue
- NPC career/family developments
- occasional new residents or visitors

### 39.5 Completion without compulsion

Allow completionists to pursue:

- fish
- recipes
- chocolates
- creatures
- relics
- secrets
- equipment
- town upgrades
- NPC arcs

Do not require every collection to reach the normal narrative ending.

---

## 40. Accessibility and comfort

Include:

- text size settings
- dialogue speed
- hold vs toggle guard
- screen shake slider/off
- hit flash intensity
- vibration/haptic toggle
- music/SFX sliders
- high-contrast interactable option
- control size and opacity
- simplified cooking timing option
- fishing assist
- color cues that are not color-only
- pause during most menus

Do not make accessibility settings shame the player or change story rewards.

---

## 41. Content/data architecture

Gameplay content should be data-driven enough that new content can be added without rewriting systems.

Use typed schemas for:

- items
- recipes
- buffs
- enemies
- loot tables
- NPCs
- schedules
- dialogue
- quests
- maps/locations
- shops
- crafting recipes

Validate content at build time.

Fail builds on:

- duplicate IDs
- missing references
- impossible item references
- dialogue pointing to nonexistent NPCs
- invalid quest transitions
- malformed loot tables

Do not store executable code in save files.

---

## 42. Testing requirements

Two-player behavior is part of core correctness. Do not defer multiplayer regression testing to the end of development.


Every major system needs at least smoke coverage.

Unit tests:

- fatigue cap progression
- fifth-all-nighter collapse logic
- food restoring only to fatigue cap
- save serialization
- migration
- inventory stacking
- crafting ingredient consumption
- loot-table constraints
- relationship state transitions
- engagement timers
- ring recipe generation
- quest state transitions

Integration/browser tests:

- first launch
- offline content install
- reload while offline
- create Save Slot 1
- create Save Slot 2
- autosave/load
- export/import save
- move between maps
- touch controls
- combat
- inventory
- dialogue
- cooking
- fishing
- relationship prompt
- PWA update flow

Use Playwright WebKit in CI as a useful approximation of Safari, but still perform real-device checks on an iPhone when possible.

---

## 43. Deployment and updates

Use GitHub Actions.

Pipeline:

1. install dependencies
2. lint
3. type-check
4. unit tests
5. browser tests
6. production build
7. deploy to GitHub Pages only if prior steps pass

Version offline content.

When a new app version is available:

- download it in the background when possible
- do not replace the active game mid-session
- show a small "Update ready" notice
- apply on explicit restart/reload
- keep save schema migrations backward-safe

Never wipe saves as part of an update.

---

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

## 45. First vertical slice exact scope

The first "this is a game" build should include:

- installable offline-capable PWA with a polished title screen
- offline-ready state
- two world save slots
- full single-player mode
- two-iPhone local co-op mode
- Host Co-op / Join Co-op flow
- QR/manual pairing
- reconnect/drop-in/drop-out
- host-authoritative shared world
- separate persistent Player 1 and Player 2 profiles
- player name/appearance for each player
- castle bedroom + kitchen/lab
- one town block with blacksmith
- one forest map
- day/dusk/night cycle
- health and energy
- all-nighter fatigue caps
- sword and shield
- Moss Slime, Lantern Ghost, Rustbone, Cinder Imp
- four monster drops
- one forage plant
- one ore
- one fish
- inventory
- one chest
- crafting
- one ordinary meal
- one magical chocolate
- one chocolate-powered ability
- blacksmith dialogue/portrait
- one other NPC dialogue/portrait
- one short quest
- one story clue
- one personal discovery/cutscene that can occur independently for each player
- one shared-world event that synchronizes for both connected players
- one shared quest and one personal quest
- separate friendship state for both players
- player-to-player item trade/gift
- same-map and different-map play
- one player sleeping while the other stays awake
- autosave/load for shared world and both personal profiles
- real iPhone touch controls
- stable offline reload
- stable two-iPhone reconnect after temporary disconnect

This build should be attractive enough to judge the direction, but its main purpose is proving the entire loop.

---

## 46. Quality bar

Do not call a system complete merely because the happy path works once.

For each feature, check:

- touch usability
- save/load
- offline behavior
- orientation changes
- backgrounding/resuming the PWA
- screen-size variation
- performance
- audio resume after iOS suspends it
- error handling
- data migration
- interaction with current quests/relationships

Fix obvious defects before adding more content.

At the end of each major content phase, perform an `emptiness audit` using `docs/CONTENT_LEDGER.md`:

- Which zones have no reason to revisit?
- Which weeks can pass with no authored event?
- Which NPCs lack personal development?
- Which systems stop progressing too early?
- Which recipes/items are functionally redundant?
- Which story reveals lack setup?
- Which late-game rewards arrive after they stop being useful?

Fill those holes before merely increasing raw content counts.

---

## 47. Decision rules for the coding agent

When a detail is unspecified:

Astra has standing permission to create new original content and connective tissue needed to make the game feel complete. Expansion should follow the story/world/NPC bibles and content-density rules rather than stopping to ask for permission for every character, quest, recipe, room, or encounter.

1. Prefer the choice that keeps the game original.
2. Prefer touch usability over desktop conventions.
3. Prefer a working vertical slice over a huge incomplete system.
4. Prefer data-driven content over hard-coded special cases.
5. Prefer local/offline functionality over server dependencies.
6. Prefer simple proven technology over experimental frameworks.
7. Prefer a small number of polished enemies/NPCs/recipes over dozens of shallow ones.
8. Preserve save compatibility.
9. Never knowingly overwrite existing repository work.
10. If a decision can be safely revised later, choose a sensible default and keep moving.

Ask the user only when:

- a destructive GitHub action is required
- no empty approved repository exists
- credentials/permissions are missing
- a legal/ownership question blocks use of a requested asset
- two choices would fundamentally change the game's identity or erase significant completed work

Do not ask the user to approve every routine implementation detail.

---

## 48. Documentation the agent must maintain

Keep these current:

### `docs/STORY_BIBLE.md`

Maintain canon, timeline, mysteries, reveals, antagonist logic, and setup/payoff tracking.

### `docs/WORLD_BIBLE.md`

Maintain region identity, ecology, resources, seasonal changes, landmarks, access rules, and revisit hooks.

### `docs/NPC_BIBLE.md`

Maintain roster, relationships, speech style, schedules, personal arcs, romance logic, known facts, and post-marriage state.

### `docs/CONTENT_LEDGER.md`

Track implemented versus planned NPC events, quests, recipes, enemies, fish, secrets, festivals, maps, and story beats. Use it to identify empty parts of the game instead of blindly adding more of whatever is easiest.

### `ROADMAP.md`

- phases
- current phase
- completed work
- next tasks
- known blockers

### `CHANGELOG.md`

Short human-readable changes per meaningful build.

### `docs/DESIGN.md`

Game rules and tunable values.

### `docs/SAVE_FORMAT.md`

Schema, versions, migrations.

### `docs/OFFLINE_AND_SAVES.md`

Explain:

- service-worker cache strategy
- IndexedDB responsibilities
- offline-install flow
- save-slot format and backup behavior
- update behavior
- persistent-storage limitations on mobile browsers
- hosting visibility limitations

### `docs/MULTIPLAYER.md`

Keep authoritative rules for:

- transport/session setup
- world authority
- shared vs personal state
- player UUIDs
- reconnect/revision behavior
- quest scope
- cutscene scope
- sleep/time behavior
- loot ownership
- trading
- relationship edge cases
- disconnect recovery
- compatibility requirements

### `docs/TEST_PLAN.md`

Real-device checks and automated coverage.

Do not let documentation become a substitute for building the game.

---

## 49. Definition of a successful first release for the user

The first private playable release is successful when the user can:

1. Open the GitHub-hosted site on an iPhone.
2. Add it to the Home Screen.
3. Download all required game content for offline play.
4. Turn off internet access.
5. Reopen the game directly to its title/save menu.
6. Choose one of two save slots.
7. Play in landscape using touch controls.
8. Explore the castle, town, and woods.
9. Experience day becoming night.
10. Fight with a sword and shield.
11. Gather supernatural drops.
12. Cook and make a magical chocolate.
13. Fish.
14. Talk to original NPCs with portraits and conditional dialogue.
15. See the early relationship system.
16. Stay awake through sunrise and experience the exhaustion-cap system.
17. Save automatically.
18. Close the app and resume later without losing progress.


For co-op, the same first release is not considered reliable until:

- a second iPhone can join locally
- each player keeps separate personal progression
- either player can advance shared story/world changes
- personal discovery scenes can occur independently
- global world-change scenes synchronize when both are connected
- players can occupy different maps
- disconnect/reconnect does not duplicate or erase inventory/progression
- the host can continue the same world alone when Player 2 is absent
- Player 2 can return later with their prior personal progression intact

Only after this is reliable should the project aggressively expand in breadth.

---

## 50. Final reminder

This project should capture the user's desired feeling:

- a darker, richer cozy pixel world
- a haunted castle as home
- a town worth knowing
- a wilderness that becomes more dangerous and more beautiful at night
- food as both comfort and mechanics
- chocolate as a source of magic
- relationships that require reading people rather than filling a meter blindly
- combat with shields and deliberate timing
- freedom to push through the night at a real cost
- equally complete single-player and two-player local co-op from the same world architecture
- a world dense enough that seasons, relationships, exploration, the shop, and side stories continue revealing new material long after the tutorial hours
- a creepy mystery whose resolution changes how people live with the supernatural instead of deleting the supernatural from the game

Build that game.

Do not build a clone.
