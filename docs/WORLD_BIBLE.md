# world bible

Source requirements below are preserved verbatim from the master specification. They describe the target game, not a claim of implemented functionality. See ROADMAP.md and IMPLEMENTATION_STATUS.md for current evidence. User instructions take precedence over the master.

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

