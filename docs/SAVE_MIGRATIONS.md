# Save and protocol revisions

Latest override: [ROOM_REWORK_V7.md](ROOM_REWORK_V7.md) defines build 0.1.7, save schema 6 and protocol 8. The current contract below takes precedence over historical version notes.

Schema 6 adds persistent player facing and an optional sofa/chair seat, quarter-turn furnishing rotations, and shared entry-hall/kitchen layouts. Draft layouts stay private until one validated Save layout transaction. Rejected or failed saves do not publish partial state; concurrent edits compare the complete expected room layout. Occupied furnishings and door approaches remain protected.

Migrations validate old data before upgrading. Old plant offsets are adjusted by -124 on y; Player 2 bed and desk offsets are adjusted by -152 and -116 on x, respectively, including independently placed desk candles. This preserves their absolute old positions while giving newly created worlds a clear centered west entrance. Other progression, profiles, identities, storage, revisions and timelines remain intact. Stale container states close on resume; disconnected seating is safely released.


Current override: [CHARACTER_CREATION.md](CHARACTER_CREATION.md) defines the 0.1.5 personal appearance choices, occupied-bed reaction, save schema 5 and protocol 6. Earlier version descriptions below are historical.


**Current override:** HOUSEHOLD_ROOMS.md defines the 0.1.4 room permissions, separate layouts, two-person beds, dawn reports, save schema 4 and protocol 5. Earlier single-room descriptions below are historical.

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
