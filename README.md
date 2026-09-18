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

Create a resident and enter the castle. Drag the left side to walk and tap the right side near furniture to interact. Desktop controls use WASD/arrows and E or Space. `I` opens items, missions, journal and co-op controls; `ESC` saves and returns to the title. Assign owned items to five quick slots. Candles and the household chest are shared, while discoveries and belongings stay personal.

The title uses original generated castle art. The room uses separate furniture and material layers, a consistent native pixel scale, directional residents, animated lights and authoritative collision. The exact prompts, provenance and remaining art work are recorded in `docs/ART_*_PROMPT.md`, the [content ledger](docs/CONTENT_LEDGER.md), and [room and controls](docs/ROOM_AND_CONTROLS.md).

The full game loop remains in development. Physical iPhone acceptance results are not yet available; see [the device checklist](docs/DEVICE_TESTS.md).

## Originality

This is an independent personal project, not an official ConcernedApe game. The requested project title is retained. No official art, code, dialogue, maps, music, logos or UI is copied. References are recorded in [the research notes](docs/RESEARCH_NOTES.md); all game assets need provenance in [the content ledger](docs/CONTENT_LEDGER.md).
