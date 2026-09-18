# npcs and relationships

Source requirements below are preserved verbatim from the master specification. They describe the target game, not a claim of implemented functionality. See ROADMAP.md and IMPLEMENTATION_STATUS.md for current evidence. User instructions take precedence over the master.

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

