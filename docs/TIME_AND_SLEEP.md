# Shared time and personal sleep

Current override: the 2026-09-21 changes in [ROOM_LAYOUT.md](ROOM_LAYOUT.md) replace inspection menus, automatic sleep, old wake scheduling and static furniture positions. Current saves use schema 3 and protocol 4. [AUDIO.md](AUDIO.md) describes original offline sound. Earlier implementation details below remain historical where they conflict.

The user's room review requires working sleep and day/night windows before further expansion. This brings a bounded part of Phase 3 forward without closing that phase.

The host owns one saved clock. `secondsPerGameMinute` defaults to 1.0. A real second advances one game minute, so a complete unpaused day lasts 24 real minutes. The browser submits elapsed monotonic time about once per second. Hidden intervals and long suspension gaps are discarded; there is no offline catch-up. The authority bounds a delayed callback to five real seconds as a second guard. Clock writes use the same durable queue as movement and item transactions. Failed writes never publish new time.

Solo menus and object dialogue pause time. In co-op, a private inventory, chest or dialogue does not pause the shared clock. Sleeping is a personal state, separate from menus. Guests receive host time and never advance a competing clock. Compact movement/time packets include position, map, energy, sleep and container state. Inventory and permanent changes still use authoritative snapshots.

## Rest

Walking into the bed's entry gap starts rest. No button or confirmation is required. The tuning values live in `SLEEP_RULES` and use game minutes:

- A full rest takes at least eight game hours.
- Evening/night rest aims for 06:00, subject to that minimum. Sleeping at 18:00 wakes at 06:00; sleeping at 01:00 wakes at 09:00.
- Daytime rest lasts eight game hours.
- If every connected resident is asleep, show the resident beneath the quilt for at least 850 real milliseconds, then advance to the earliest requested wake time on the next clock tick. This short presentation pause is separate from the configurable simulation scale. The normal advance routine resolves each resident's rest independently.
- If someone remains awake, time continues normally. B gets a sleeper up early. A short rest restores some energy up to the fatigue cap but does not clear accumulated all-nighters.
- Full rest clears that resident's fatigue and restores energy to 100. Belongings, knowledge and relationships are unchanged.
- Absent residents accrue no new fatigue. A returning sleeper whose requested wake time has passed completes their saved rest when simulation resumes.

The host can continue alone after a guest leaves. Disconnected guests do not block a present sleeper's time advance. In-progress sleep survives saving, reload and reconnect. There is no fixed-hour forced sleep.

## All-nighters

Each sunrise at 06:00 increments the streak of each awake, active resident once. Energy caps are 80, 60, 40 and 20 after the first four consecutive all-nighters. After the fifth sunrise, the cap gradually falls from 20 over twelve game hours. Characterful warnings accompany the streak and late terminal pressure. At the end of that pressure, the exhausted resident collapses and begins recovery rest. This does not end the other player's session.

Food is not implemented yet. Future restorative items must use the current energy cap rather than bypassing fatigue.

## Presentation and limits

The phases are late night before 05:00, dawn 05:00-07:00, day 07:00-18:00, dusk 18:00-20:00 and night after 20:00. Daylight blends through dawn and dusk. Window skies use shared game time and the world seed, with foggy daytime trees and three deterministic night variants. Room ambience and the clock glyph follow the phase. These remain reversible tuning values.

NPC scheduling, weather ecology, health/combat effects, cooking and multi-day device stress work remain open. See VALIDATION.md for automated checks actually run.
