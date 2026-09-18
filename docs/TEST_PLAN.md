# test plan

Source requirements below are preserved verbatim from the master specification. They describe the target game, not a claim of implemented functionality. See ROADMAP.md and IMPLEMENTATION_STATUS.md for current evidence. User instructions take precedence over the master.

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

