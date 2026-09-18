# game design

Source requirements below are preserved verbatim from the master specification. They describe the target game, not a claim of implemented functionality. See ROADMAP.md and IMPLEMENTATION_STATUS.md for current evidence. User instructions take precedence over the master.

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
