# Architecture decisions

## 0.1.7 household revision

- Art uses material-tagged character layers and upright ground-plan furniture projections. Preview and scene share the same native character frames; no garment is painted over an old clothed image.
- Room geometry owns wall connections, quarter-turn footprints, bed slits, interaction anchors and attached surface items. Saved facing follows input even when travel is blocked. Directional doorway crossing is a movement intent handled by the host.
- Room editing is a private full-layout draft. The host compares expected layout, checks bounds/access/occupancy and commits the complete new layout once. Ordinary map movement carries facing and seating in compact updates; layout changes use full shared snapshots.
- Menus are centered and the portrait blocker uses the browser top layer above any current form. Opening menus is a presentation consequence of accepted object interaction; it cannot grant inventory ownership.


## 2026-09-18: one household, two persistent residents

The world is the persistence and authority boundary. `World` has a UUID, timeline UUID, monotonic revision, seed, shared clock, story, world changes, quests, communal chest and event history. `players` holds one host and at most one permanent guest, each keyed by UUID. A saved guest is not necessarily an active guest.

Each personal profile holds its own position, inventory, equipment, skills, recipe knowledge, discoveries, relationship state, dialogue and gift history, quests, fatigue and settings. The initial shape reserves those categories without claiming the corresponding gameplay systems are implemented.

An `Authority` applies validated intents to a draft and commits the complete transaction to IndexedDB before publishing the new revision. A failed write leaves the live world unchanged. Per-player sequences reject duplicate or replayed actions. Personal discoveries separately guard one-time rewards, including retries with new sequence numbers. Shared changes record the triggering player and are available to either resident.

## Transport and reconnect

`Transport` separates sessions from browser WebRTC. One ordered DataChannel carries the versioned session protocol. Pairing is a two-way exchange of offer and answer after ICE gathering. Rotating, numbered QR frames keep codes readable; a complete manual exchange is always available. No STUN, TURN, matchmaking, cloud signaling or game server is required. Reachable local network candidates are required. Networks with client isolation can fail; do not claim every Wi-Fi or hotspot works before device testing.

The pairing envelope includes protocol version, session UUID, world UUID and timeline UUID. The first guest identity is durably stored on the guest device before pairing finishes. A world then reserves its second resident UUID and recovery key. Returning guests must match both. This key is automatic continuity data, not an account or password prompt.

The guest sends intents, never inventory values or world flags. The host resolves changes and sends a full snapshot on join and discrete interactions. Movement sends compact positions and sequence acknowledgements, not full world saves each frame. Guest controls wait for host acknowledgement and retain a local mirrored recovery copy.

A newer guest recovery revision stops the join. Different world/timeline IDs also stop it. Neither side silently wins by replacing newer data. A guided cross-device recovery/merge screen is still pending. Manual pairing is repeated after a connection closes; reconnect preserves identity and progression. Automatic ICE restart is future work.

## Phase 1 integration room

The arrival hall is a small playable integration slice. Reading the letter and opening the welcome parcel are personal, and lighting the hearth changes the shared world. The second resident can do either. This is a starting room in the actual game architecture, not the complete first-release loop.

Movement uses bounded 14-pixel steps with a 110 ms input cadence and collision-safe visual interpolation. Room objects share explicit rendering rectangles, collision footprints and reachable actions. The host spaces incoming movement and acknowledges every processed sequence, avoiding the former silent-drop stall. Each accepted step still commits durably. Phase 2 must replace that expensive provisional cadence with a fixed host simulation and checkpoint batching while preserving durable item/world transactions. Broader zone interest management is not implemented. See ROOM_AND_CONTROLS.md for the revised room, controls and protocol 3 contract.

The world starts at 18:00 with `secondsPerGameMinute = 1`. The user's bed/window request brought a running shared clock, independent sleep and fatigue forward. Solo menus pause; private co-op menus do not. All present residents sleeping advances to the earliest requested wake time after a short presentation pause. Full rest resets only the rested person's fatigue. There is no fixed-hour forced sleep. TIME_AND_SLEEP.md records tuning and limits; SAVE_MIGRATIONS.md records schema 2 and protocol 3.

The room door now reaches a small adjoining landing. Map identity participates in host collision, interaction checks, saves and compact updates. Each client renders only residents on its current map. This is the first two-map connection; town/forest content and broader interest management remain pending. Container opening is per-resident state so two people can use the chest without one closing the other's lid.

## Browser lifecycle and ownership

Web Locks allows only one tab to own a world. IndexedDB optimistic revision checks catch conflicting writes too. Backgrounding ends a co-op connection cleanly; guest input cannot continue without the host. The host can continue alone after returning. Rejoin uses pairing and the saved identity. Mobile suspension, storage pressure and real network reachability still require two-iPhone checks.

Shared hearth presentation is a simultaneous nonblocking notification with a persisted recap. It does not need a global pause. Future long shared cutscenes require a ready/acknowledgement barrier before resuming. Personal letter dialogue does not force the other resident to stop.

## Dependencies

Vite and TypeScript build the app. Phaser 3.90.0 is the latest stable Phaser 3 version found at initialization; keeping the specified major avoids an untested engine migration. TypeScript 6 is pinned because the installed TypeScript ESLint package rejects TypeScript 7. Dexie provides IndexedDB transactions. Zod validates saves and protocol input. QRCode generates QR frames, and jsQR decodes camera images locally. None loads from a CDN at runtime.

All gameplay content is local. A future content validator must grow with the typed data sets; the current validator checks only the authored arrival interactions that exist today.
