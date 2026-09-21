# save format

Current override: [CHARACTER_CREATION.md](CHARACTER_CREATION.md) defines the 0.1.5 personal appearance choices, occupied-bed reaction, save schema 5 and protocol 6. Earlier version descriptions below are historical.


Source requirements below are preserved verbatim from the master specification. They describe the target game, not a claim of implemented functionality. See ROADMAP.md and IMPLEMENTATION_STATUS.md for current evidence. User instructions take precedence over the master.

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

