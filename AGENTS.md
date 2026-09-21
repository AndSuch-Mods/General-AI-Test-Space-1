# Haunted Chocolatier: Twilight

Build the long-term original iPhone-first, landscape, offline PWA described by this project's master specification. Single-player and two-player same-room co-op share one architecture. Do not call a shell, prototype, or collection of placeholders the finished game.

## Required reading

Before planning or implementation, read all of:

- `README.md`, `ROADMAP.md`, `CHANGELOG.md`, `docs/IMPLEMENTATION_STATUS.md`, `docs/VALIDATION.md`
- `docs/GAME_DESIGN.md`, `docs/PROJECT_RULES.md`, `docs/CONTENT_TARGETS.md`
- `docs/MULTIPLAYER.md`, `docs/TECHNICAL_ARCHITECTURE.md`, `docs/ARCHITECTURE_DECISIONS.md`
- `docs/SAVE_FORMAT.md`, `docs/OFFLINE_AND_PWA.md`, `docs/TEST_PLAN.md`
- `docs/ROOM_AND_CONTROLS.md`, which records the user's revised room and touch requirements
- `docs/TIME_AND_SLEEP.md`, `docs/SAVE_MIGRATIONS.md`, which record the implemented clock, rest and compatibility contracts
- `docs/ROOM_LAYOUT.md` and `docs/AUDIO.md`, which record the latest direct-action, arrangement, sound and sleep overrides

Before changing content or the associated systems, also read `docs/SYSTEMS.md`, `docs/STORY_BIBLE.md`, `docs/WORLD_BIBLE.md`, `docs/NPCS_AND_RELATIONSHIPS.md`, `docs/REFERENCE_AND_ART.md`, and `docs/CONTENT_LEDGER.md`. Read `docs/PHASES.md` before advancing phases.

The unchanged master is `docs/master/Haunted_Chocolatier_Twilight_AGENTS.md`. `docs/REQUIREMENTS_INDEX.json` maps every master section to its verbatim working document. Read the master for unresolved context. User instructions override it. The opening legacy phrase "single-player" does not restrict co-op; section 4A and the user's explicit instructions require both modes from the outset. No password, login, or account gate.

## Permanent operating rules

- Only use `AndSuch-Mods/General-AI-Test-Space-1`. It was selected after checking all ten approved repositories. Preserve its existing history. Do not overwrite existing work, force-push, or alter other repositories.
- Implement in the phase order, through playable vertical slices. Finish architecture only as far as needed to build safely, then build. Report pending work honestly.
- Keep the host authoritative for shared story, time, world changes and communal storage. Either player can advance shared progression. Profiles, inventories, fatigue, recipes, discoveries, relationships, and personal quests remain separate and persistent.
- Use transport-independent player intents and WebRTC DataChannels with manual/QR pairing. No cloud game server in normal play. Players can occupy different maps. Support host solo continuation, drop-in/out, guest mirrors, explicit revision reconciliation, and idempotent transactions.
- Declare quest and scene scope explicitly as personal, shared_world, or cooperative. Required progression must have full solo parity. Shared scenes synchronize; personal scenes do not freeze the other player.
- Use a configurable `secondsPerGameMinute`, default 1.0. Schedules and timers use game time. Never force sleep at a fixed hour. Preserve the master fatigue and relationship rules.
- Save exactly two normal worlds in IndexedDB with both profiles. Keep cache, app settings and guest mirrors separate. Validate imports, retain recovery copies, migrate explicitly, and never wipe saves on update. Never replace newer progress silently.
- All final art, writing, maps, code, music and other content must be original or clearly licensed. Public references inform only broad design qualities. Track temporary original assets for replacement.
- Build rooms from floor/wall layers and individual objects, with one native pixel scale shared by residents, furniture and effects. Solid objects need authoritative collision and reachable interactions. Never use a furnished background painting as a substitute for this. Preserve the compact HUD and floating thumbstick direction in `docs/ROOM_AND_CONTROLS.md`.
- Keep the resident preview identical to the in-world palette and frame pipeline. Current adult display size is 64 by 96 world pixels from 32 by 48 native art; room art uses two-world-pixel clusters. Preserve seven quick slots, dedicated A/B actions and the left floating stick. B must not silently abandon an NPC conversation; use authored exits.
- A acts on objects directly. Reading and choices belong in compact bottom sheets. Finish container opening before showing its sheet, and close the sheet before the closing animation. Sleep requires confirmation and ends at the next 06:00. Furniture layout is shared, saved and host validated. Keep original offline music and sound gesture-unlocked with saved mute controls.
- Expand original content autonomously within the bibles and density targets. Do not inflate counts with shallow filler. Preserve castle home, town life, supernatural wilderness, chocolate magic, deliberate shields, interactive cooking, fishing, relationships and the Stillroom Circle/Curator story. The supernatural survives the ending.
- At each milestone run relevant lint, types, unit and browser tests, persistence and offline checks, and solo/co-op regressions. Fix failures before expanding. Update roadmap, changelog, implementation status and content ledger, then commit a stable checkpoint.
- Before completing content phases, record the emptiness audit in `docs/CONTENT_LEDGER.md`. Real two-iPhone testing is required before calling co-op stable. Do not imply emulation proves device reliability.
- Use `pnpm check` and `pnpm test:browser`. `pnpm check:spec` must continue to prove complete master coverage. Document decisions separately from verbatim requirements.
- Ask only for destructive actions, unavailable approved repositories, missing access, genuine rights issues, identity-changing choices, or erasure of significant completed work. Choose reversible defaults otherwise.
