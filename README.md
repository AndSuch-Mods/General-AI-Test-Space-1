# Haunted Chocolatier: Twilight

The household now has a shared living room and two private bedrooms. Enter the left bedroom for Player 1 or the right for Player 2. Only the owner can rearrange a bedroom; both residents can use its furnishings and share its double bed. The green desk journal records the previous day after dawn. See docs/HOUSEHOLD_ROOMS.md.

An original iPhone-first PWA about keeping a haunted castle, knowing a small town, and making chocolate from a wilderness that remembers too much. Full solo play and optional two-iPhone local co-op use the same saved world.

This is a long-term game project. The current work is Phase 1; the complete first playable release and mature content targets remain open. See [the roadmap](ROADMAP.md) for the tested state, not just the intended feature list.

[Open the Phase 1 build](https://andsuch-mods.github.io/General-AI-Test-Space-1/). GitHub Pages publishes after both browser jobs pass. Check for `Ready for offline play` in Settings before disconnecting. For two phones, install on each device and follow [the device checklist](docs/DEVICE_TESTS.md).

## Development

Use Node 22 or newer and pnpm. Run `pnpm install`, `pnpm dev`, `pnpm check`, and `pnpm test:browser`. `pnpm build` creates a versioned offline package. `pnpm preview` serves the production build for service-worker checks. CI runs Chromium and WebKit before deployment.

## Project documents

Start with [AGENTS.md](AGENTS.md). The [original master](docs/master/Haunted_Chocolatier_Twilight_AGENTS.md) is preserved byte-for-byte. Every source section is reproduced in a working document and indexed in [the requirement map](docs/REQUIREMENTS_INDEX.json). `pnpm check:spec` verifies the source hash and complete coverage.

The user's direct instructions require first-class co-op and take precedence over the old single-player wording at the beginning of the master. No account or password gate is part of the game.

## Repository and hosting

Selected `AndSuch-Mods/General-AI-Test-Space-1` on 2026-09-18. Its `main` branch was empty at `fc1af4f05cc7da42745d5adf77e2455892e3142a`, with Git's empty-tree hash. Repositories 1-4 were empty, 5-6 contained existing applications, and 7-10 contained README files. Repository 1 is the first available, regardless of its older history.

The source repository and GitHub Pages site are public. Local saves stay on the players' devices. Pages is configured to use GitHub Actions. Deployment is gated by validation, including Chromium on Linux and WebKit on macOS.

## Current playable slice

Create a resident with a live coat preview and enter the castle. Drag the left side to walk; A interacts and B backs out. Desktop controls use WASD/arrows and E or Space. `I` opens items, missions, journal and co-op controls; `ESC` saves and returns to the title after closing ordinary dialogs. Assign owned items to seven quick slots. Candles and the household chest are shared, while discoveries and belongings stay personal. Walk into the bed's turned-down gap to sleep, or open the door to explore the adjoining landing.

The title uses the room's original floor and wall materials. Residents display at 64 by 96 world pixels, with furniture and effects on a matching two-world-pixel grid. Shared time drives the window sky; furniture animates as it opens. Exact prompts, provenance and remaining art work are recorded in `docs/ART_*_PROMPT.md`, the [content ledger](docs/CONTENT_LEDGER.md), and [room and controls](docs/ROOM_AND_CONTROLS.md). See [time and sleep](docs/TIME_AND_SLEEP.md) for solo/co-op rest rules.

The full game loop remains in development. Physical iPhone acceptance results are not yet available; see [the device checklist](docs/DEVICE_TESTS.md).

## Originality

This is an independent personal project, not an official ConcernedApe game. The requested project title is retained. No official art, code, dialogue, maps, music, logos or UI is copied. References are recorded in [the research notes](docs/RESEARCH_NOTES.md); all game assets need provenance in [the content ledger](docs/CONTENT_LEDGER.md).

## Household controls, 0.1.3

A reads the nearest letter, switches a candle or hearth, opens a container, or offers bed sleep. Reading appears along the bottom. Containers finish their opening animation before showing their contents. B closes ordinary sheets. Sleep always ends at the next 06:00.

Use I > Household > Arrange room to choose furniture. Move its outlined preview with the left stick or arrow keys; A places, B cancels. Layouts save with the household and sync to the other resident. Doors, windows and fireplace stay structural.

Original music and sound start after a tap or keypress and work offline. Sound and music switches are in Settings & help.
