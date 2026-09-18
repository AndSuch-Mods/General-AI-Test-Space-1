# Haunted Chocolatier: Twilight

An original iPhone-first PWA about keeping a haunted castle, knowing a small town, and making chocolate from a wilderness that remembers too much. Full solo play and optional two-iPhone local co-op use the same saved world.

This is a long-term game project. The current work is Phase 1; the complete first playable release and mature content targets remain open. See [the roadmap](ROADMAP.md) for the tested state, not just the intended feature list.

## Development

Use Node 22 or newer and pnpm. Run `pnpm install`, `pnpm dev`, `pnpm check`, and `pnpm test:browser`. `pnpm build` creates a versioned offline package. `pnpm preview` serves the production build for service-worker checks. CI runs Chromium and WebKit before deployment.

## Project documents

Start with [AGENTS.md](AGENTS.md). The [original master](docs/master/Haunted_Chocolatier_Twilight_AGENTS.md) is preserved byte-for-byte. Every source section is reproduced in a working document and indexed in [the requirement map](docs/REQUIREMENTS_INDEX.json). `pnpm check:spec` verifies the source hash and complete coverage.

The user's direct instructions require first-class co-op and take precedence over the old single-player wording at the beginning of the master. No account or password gate is part of the game.

## Repository and hosting

Selected `AndSuch-Mods/General-AI-Test-Space-1` on 2026-09-18. Its `main` branch was empty at `fc1af4f05cc7da42745d5adf77e2455892e3142a`, with Git's empty-tree hash. Repositories 1-4 were empty, 5-6 contained existing applications, and 7-10 contained README files. Repository 1 is the first available, regardless of its older history.

The source repository is public. A standard GitHub Pages deployment is public too. Local saves stay on the players' devices. There is no fake client-side privacy gate. Pages configuration access is awaiting an authenticated browser or CLI session; the connected GitHub plugin supports code and commit operations but exposes no Pages configuration action.

## Originality

This is an independent personal project, not an official ConcernedApe game. The requested project title is retained. No official art, code, dialogue, maps, music, logos or UI is copied. References are recorded in [the research notes](docs/RESEARCH_NOTES.md); all game assets need provenance in [the content ledger](docs/CONTENT_LEDGER.md).
