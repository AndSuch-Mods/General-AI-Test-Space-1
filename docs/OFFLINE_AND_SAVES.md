# Offline and saves

Read [OFFLINE_AND_PWA.md](OFFLINE_AND_PWA.md), [SAVE_FORMAT.md](SAVE_FORMAT.md) and [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md) for requirements and decisions.

The build hashes all mandatory output files into a versioned service worker. Installation verifies downloaded file hashes before caching; readiness requires every listed asset. Save data lives in a separate Dexie database and is never removed by the service worker. Previous asset caches remain available for older open clients. An update waits for explicit restart on the title screen.

Dexie database `twilight-v1` has `saves`, `recovery`, `mirrors` and `settings` stores. Normal saves use keys 1 and 2. Guest mirrors use world UUIDs. The recovery store retains a checkpoint per slot and preserves the displaced world on an explicit import. Save schema 1 has no older released version to migrate; unsupported schemas fail closed. Add sequential migrations and old-save fixtures before changing it.

The import envelope is `twilight-world-backup`, version 1, an export timestamp and one or two distinct slot/world pairs. Imports are size-limited and structurally validated before the atomic transaction. A occupied slot requires explicit replacement confirmation. Last-export dates are shown. Save export uses Web Share where available and file download otherwise.

Persistent storage is requested when Make Available Offline is selected. Granting it is browser-dependent. Browser data deletion can still remove saves. Keep external backups. The public repository and intended public Pages site are documented in README; no local password is used as a substitute for private hosting.
