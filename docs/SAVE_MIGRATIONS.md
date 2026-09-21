# Save and protocol revisions

Current override: the 2026-09-21 changes in [ROOM_LAYOUT.md](ROOM_LAYOUT.md) replace inspection menus, automatic sleep, old wake scheduling and static furniture positions. Current saves use schema 3 and protocol 4. [AUDIO.md](AUDIO.md) describes original offline sound. Earlier implementation details below remain historical where they conflict.

## Schema 2, build 0.1.2

Schema 2 adds the `landing` map and these personal fields:

- `interaction`: `chest`, `pantry`, `desk` or null, used by shared object presentation.
- `fatigue.sleepStartedAt` and `fatigue.wakeAt`: absolute shared game minutes, or null while awake.

`parseWorld` first validates a schema 1 source, then creates schema 2 fields and validates the resulting household. World UUID, timeline UUID, revisions, both residents, inventories, equipment, skills, discoveries, relationships, story, settings and chest contents remain unchanged. Schema 1 reserved an unused sleep flag without a timer; migration initializes it to awake. Unsupported schemas and inconsistent household identities are rejected.

The backup envelope remains version 1 and accepts either supported world schema through the same migration. Import replacement still requires confirmation and retains a recovery checkpoint. Cache updates never delete IndexedDB saves.

On resume, stale container interactions close, and awake residents inside a solid move to nearby clear floor. Sleeping residents retain their saved bed position and timing. A failed repair or clock write does not publish its draft. Opening state never establishes inventory ownership; transfers remain separate idempotent transactions.

Protocol 3 carries map, clock, energy, fatigue and interaction state in compact updates. Old pairing versions are rejected rather than letting different physics/time rules share a world. `TW1` remains the encoded pairing format prefix; the validated envelope carries protocol 3. Both devices must apply the current app update before pairing.

Device-local hotbar settings retain the first five assignments and gain two empty slots. They remain references to personal items, never duplicated stacks.
