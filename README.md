# Haunted Chocolatier: Twilight

An original iPhone-first PWA about keeping a haunted castle, knowing a small town, and making chocolate from a wilderness that remembers too much. Full solo play and optional two-iPhone local co-op use the same saved world.

This is a long-term game project. The current work is Phase 1; the complete first playable release and mature content targets remain open. See [the roadmap](ROADMAP.md) for the tested state, not just the intended feature list.

[Open the Phase 1 build](https://andsuch-mods.github.io/General-AI-Test-Space-1/). GitHub Pages publishes after both browser jobs pass. Wait for `Ready for offline play` before disconnecting. For two phones, install on each device and follow [the device checklist](docs/DEVICE_TESTS.md).

## Development

Use Node 22 or newer and pnpm. Run `pnpm install`, `pnpm dev`, `pnpm check`, and `pnpm test:browser`. `pnpm build` creates a versioned offline package. `pnpm preview` serves the production build for service-worker checks. CI runs Chromium and WebKit before deployment.

## Project documents

Start with [AGENTS.md](AGENTS.md). The [original master](docs/master/Haunted_Chocolatier_Twilight_AGENTS.md) is preserved byte-for-byte. Every source section is reproduced in a working document and indexed in [the requirement map](docs/REQUIREMENTS_INDEX.json). `pnpm check:spec` verifies the source hash and complete coverage.

The user's direct instructions require first-class co-op and take precedence over the old single-player wording at the beginning of the master. No account or password gate is part of the game.

## Repository and hosting

Selected `AndSuch-Mods/General-AI-Test-Space-1` on 2026-09-18. Its `main` branch was empty at `fc1af4f05cc7da42745d5adf77e2455892e3142a`, with Git's empty-tree hash. Repositories 1-4 were empty, 5-6 contained existing applications, and 7-10 contained README files. Repository 1 is the first available, regardless of its older history.

The source repository and GitHub Pages site are public. Local saves stay on the players' devices. Pages is configured to use GitHub Actions. Deployment is gated by validation, including Chromium on Linux and WebKit on macOS.

## Current playable slice

Create a resident, enter the castle, walk with the touch pad or WASD/arrows, and use Interact or E near the letter, hearth and welcome parcel. The journal shows personal discoveries and inventory alongside the shared household state. Co-op uses the same authoritative world as solo play. A returning second resident keeps their identity and belongings.

The title and room now use detailed original generated art with a twelve-pose resident sheet. These assets are integrated into the playable scene. The exact prompts, provenance and remaining art work are recorded in `docs/ART_*_PROMPT.md` and the content ledger.

The full game loop remains in development. Physical iPhone acceptance results are not yet available; see [the device checklist](docs/DEVICE_TESTS.md).

## Originality

This is an independent personal project, not an official ConcernedApe game. The requested project title is retained. No official art, code, dialogue, maps, music, logos or UI is copied. References are recorded in [the research notes](docs/RESEARCH_NOTES.md); all game assets need provenance in [the content ledger](docs/CONTENT_LEDGER.md).
