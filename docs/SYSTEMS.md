# systems

Source requirements below are preserved verbatim from the master specification. They describe the target game, not a claim of implemented functionality. See ROADMAP.md and IMPLEMENTATION_STATUS.md for current evidence. User instructions take precedence over the master.

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

