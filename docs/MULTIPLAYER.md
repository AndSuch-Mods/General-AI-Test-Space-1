# multiplayer

Source requirements below are preserved verbatim from the master specification. They describe the target game, not a claim of implemented functionality. See ROADMAP.md and IMPLEMENTATION_STATUS.md for current evidence. User instructions take precedence over the master.

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


