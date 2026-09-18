# project rules

Source requirements below are preserved verbatim from the master specification. They describe the target game, not a claim of implemented functionality. See ROADMAP.md and IMPLEMENTATION_STATUS.md for current evidence. User instructions take precedence over the master.

## 1. Repository and permission rules

This is intended to be hosted from one of the user's existing GitHub repositories named:

- `General-AI-Test-Space-1`
- `General-AI-Test-Space-2`
- ...
- `General-AI-Test-Space-10`

Before writing anything:

1. Inspect those repositories.
2. Use the first repository whose current default branch is effectively empty and available for a new project.
3. Old commit history by itself does not make a repository unavailable. Judge the current branch contents.
4. Never overwrite an existing project.
5. If none are clearly empty, stop before modifying anything and ask the user which repository to use.
6. Do not touch unrelated repositories.

If GitHub permissions are missing, ask once, up front, for all permissions needed to finish the job instead of interrupting repeatedly later. Likely permissions include repository contents read/write, branch/commit access, GitHub Actions read/write, and GitHub Pages configuration/deployment access.

Use commits as stable checkpoints. Prefer one coherent commit per milestone or tightly related group of changes. Never leave the default branch knowingly broken.

---

## 47. Decision rules for the coding agent

When a detail is unspecified:

Astra has standing permission to create new original content and connective tissue needed to make the game feel complete. Expansion should follow the story/world/NPC bibles and content-density rules rather than stopping to ask for permission for every character, quest, recipe, room, or encounter.

1. Prefer the choice that keeps the game original.
2. Prefer touch usability over desktop conventions.
3. Prefer a working vertical slice over a huge incomplete system.
4. Prefer data-driven content over hard-coded special cases.
5. Prefer local/offline functionality over server dependencies.
6. Prefer simple proven technology over experimental frameworks.
7. Prefer a small number of polished enemies/NPCs/recipes over dozens of shallow ones.
8. Preserve save compatibility.
9. Never knowingly overwrite existing repository work.
10. If a decision can be safely revised later, choose a sensible default and keep moving.

Ask the user only when:

- a destructive GitHub action is required
- no empty approved repository exists
- credentials/permissions are missing
- a legal/ownership question blocks use of a requested asset
- two choices would fundamentally change the game's identity or erase significant completed work

Do not ask the user to approve every routine implementation detail.

---

## 48. Documentation the agent must maintain

Keep these current:

### `docs/STORY_BIBLE.md`

Maintain canon, timeline, mysteries, reveals, antagonist logic, and setup/payoff tracking.

### `docs/WORLD_BIBLE.md`

Maintain region identity, ecology, resources, seasonal changes, landmarks, access rules, and revisit hooks.

### `docs/NPC_BIBLE.md`

Maintain roster, relationships, speech style, schedules, personal arcs, romance logic, known facts, and post-marriage state.

### `docs/CONTENT_LEDGER.md`

Track implemented versus planned NPC events, quests, recipes, enemies, fish, secrets, festivals, maps, and story beats. Use it to identify empty parts of the game instead of blindly adding more of whatever is easiest.

### `ROADMAP.md`

- phases
- current phase
- completed work
- next tasks
- known blockers

### `CHANGELOG.md`

Short human-readable changes per meaningful build.

### `docs/DESIGN.md`

Game rules and tunable values.

### `docs/SAVE_FORMAT.md`

Schema, versions, migrations.

### `docs/OFFLINE_AND_SAVES.md`

Explain:

- service-worker cache strategy
- IndexedDB responsibilities
- offline-install flow
- save-slot format and backup behavior
- update behavior
- persistent-storage limitations on mobile browsers
- hosting visibility limitations

### `docs/MULTIPLAYER.md`

Keep authoritative rules for:

- transport/session setup
- world authority
- shared vs personal state
- player UUIDs
- reconnect/revision behavior
- quest scope
- cutscene scope
- sleep/time behavior
- loot ownership
- trading
- relationship edge cases
- disconnect recovery
- compatibility requirements

### `docs/TEST_PLAN.md`

Real-device checks and automated coverage.

Do not let documentation become a substitute for building the game.

---

