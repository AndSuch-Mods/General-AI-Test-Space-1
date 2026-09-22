# Validation

## 0.1.6, September 22 room and resident corrections

- Previous icon commit `2d6174d` did not deploy: Chromium initial pairing timed out in run `35650751360`; macOS WebKit passed. The live site was still `7e01239`. This was a blocked deployment, not evidence of an iOS icon-cache defect.
- A local Chromium probe confirmed normal candidates use `.local` names and `--disable-features=WebRtcHideLocalIpsWithMdns` switches to numeric host addresses. Linux CI uses that test-only flag, keeping real DataChannels, offline-origin shutdown, reconnect and all assertions. Virtual-runner mDNS is a suspected cause, not a proven diagnosis of every timeout. Production browser behavior and macOS WebKit remain unchanged. Chromium documents the feature in its [local-IP policy](https://chromium.googlesource.com/chromium/src/+/376fc41e87a058f7a7b300b0ec3a4982b4ec0960/components/policy/resources/templates/policy_definitions/Miscellaneous/WebRtcLocalIpsAllowedUrls.yaml).
- New unit checks cover every doorway round trip, opposite-wall geography, safe arrival with legacy furniture, directional arrangement clearance and doubled window geometry. Browser routes use actual updated doors. Creation checks cover initial presets, preserving manual choices and saved new styles. Physical two-iPhone acceptance remains open.
 record

## 0.1.5 character and bed checkpoint

Commit `7e01239` passed all 53 unit checks and all 20 browser cases on both Chromium and macOS WebKit in Actions run `35647925855`. This includes actual DataChannel reconnection, the occupied-bed reaction, custom profiles, journal synchronization, solo play, save recovery and origin-stopped offline play. A renderer fixture separately confirmed that historical reaction counters do not replay and a new reaction clears. Subsequent icon packaging changes preserve the supplied source and include 180, 192 and 512 pixel PNGs in the offline manifest. Main deployment initially encountered an external Google apt mirror size mismatch before browser installation; its failed runner was retried.

Specification coverage, lint, types, production build and all 53 unit tests pass locally. New checks cover older-save migration, complete personal look persistence, moved-bed crossings, cooldown/idempotency, failed-save rollback and guest dawn-report delivery. Visual review checked every customization option and stable heads across all walking poses.

Full browser results belong to this checkpoint's Actions run. The preceding 0.1.4 branch passed 19 Chromium and 19 macOS WebKit cases, but its main deployment rerun hit a Chromium reconnect failure, so Pages did not publish that revision. Local 0.1.5 broad testing also hit a movement-driver timeout under VM load; it was stopped while final preview/layout edits were in progress. These attempts are not counted as passing acceptance. Physical two-iPhone checks remain pending.

## Shared living room and private bedrooms, 0.1.4

- Local Chromium passed all 19 scenarios across the full run and a focused rerun. The only initial failure was the cancellation test registering its pointer listener without awaiting registration; that driver race is fixed. The corrected touch case passes locally in Chromium and WebKit. Actual local peer reconnect, shared beds, room separation and offline behavior passed.
- Visually reviewed the shared living room and both residents in one bed through actual WebRTC pairing. Each resident has a separate head position and consistent closed-eye rest pose above the quilt. The sofa, chair and daily notebook use the room's native pixel grid. No page errors occurred.
- Master hash and 53 sections, lint, TypeScript, 49 unit tests and production build pass locally. New authority tests cover forbidden visitor edits, allowed visitor use, independent lights and layouts, shared living-room edits, room travel, two sleeping positions, settling time, dawn reports and persisted report reload.
- The browser suite now contains 19 scenarios per engine. The additional bedroom scenario checks visiting the second bedroom, ownership controls, sleep animation, night transition and the daily journal across reload. The existing actual-peer sleep scenario now checks separated positions in one bed.
- The preceding 0.1.3 checkpoint passed 16 of 18 cases in each CI engine. It exposed a real race: opening inventory before a container finished closing could leave its close button inactive. Inventory now waits until that animation completes. WebKit also reported an internal error on emulated-offline reload; the audio case still checks live output offline, then tests persisted mute with emulation restored. Separate real-origin-shutdown cases retain cold offline save/load coverage.
- The full Chromium and macOS WebKit run gates deployment. Its final result is recorded in the exact checkpoint Actions run. Physical two-iPhone acceptance remains open.

## Direct household controls, arrangement and audio, 0.1.3

- Master hash and all 53 sections, lint, TypeScript, 45 unit tests and production build pass locally. New checks cover all ten movable pieces, collisions and reachable paths, concurrent edits, duplicate commands, failed-save rollback, attachment offsets, schema 2 migration, hearth toggling and sleep until the next 06:00.
- The browser suite contains 18 scenarios per engine. New checks verify saved placement and cancellation, opening completion before the chest sheet, closing after dismissal, and actual nonzero audio output offline with independent persisted music and sound switches. Existing coverage retains cold offline launch, two save slots, backups, integrity repair, update preservation and actual peer reconnect.
- The initial local Chromium run passed 14 scenarios. Two ambiguous Continue selectors were corrected and their scenarios passed on rerun. Software-renderer latency also delayed test key releases in the two peer scenarios; the test driver now releases fine movement inside the page when the first authoritative step is rendered. CI runs the complete suite in Chromium and macOS WebKit before deployment; consult the exact checkpoint run for final results.
- The resident now uses one unchanged head per facing through all walking frames. An added browser pixel check compares all four front-facing heads. This removes the source artwork's changing eye shapes rather than letting footfall alter facial expression.
- Visually reviewed the wooden doorway at the wall threshold, common room pixel scale and resident face at 844 by 390. Candle flames use their supporting object's depth. Reading, sleep confirmation and storage sheets sit above the bottom controls.
- Original music and effects use the Web Audio engine documented in AUDIO.md and require no downloads beyond the offline package. Automated waveform checks establish output and mute behavior. Physical iPhone listening, audio interruption and two-device acceptance remain open in DEVICE_TESTS.md.

## Resident, menu and household rework, 0.1.2

- Master hash and all 53 specification sections, lint, TypeScript, 39 unit tests and production build pass locally. New core checks cover appearance masks, configured time scale, sunrise fatigue, independent rest, storage failure rollback, map collision/travel, container presence and two-resident save migration.
- The suite now contains 16 browser scenarios per engine. Local Chromium passed all scenarios across the full run and focused reruns. The default AUTO/WebGL renderer and real-origin-offline co-op storage/reconnect checks passed on rerun in 38.3 and 21.4 seconds respectively.
- The local Windows WebKit run passed all 14 supported scenarios; its two actual-peer scenarios explicitly skip because that runtime has no RTCPeerConnection. macOS 15 CI runs all 16, including both actual DataChannel tests, before Pages can publish.
- New browser checks inspect preview pixels and coat changes, compact creation forms, seven-slot migration, A/B behavior, inert right-side background taps, adult renderer dimensions, actual bed entry, three successive daylight phases, paused solo menus, saved doorway travel, co-op map separation and independent/shared sleep.
- A short synthetic key pulse could disappear between rendering frames under VM load. The test driver now releases fine movement after observing an authoritative step and settles before turning; it makes no world-state edits. This also prevents held test keys overshooting the bed's narrow approach. The default WebGL check remains enabled; the software-rendered VM timed out once during an earlier full run.
- Reviewed title, creation and gameplay at 844 by 390 and 667 by 375. The room and resident use a common native pixel density. Doors and containers animate separately; daytime mist and three night variants use the saved shared clock. The new original door/stair asset and exact prompt are recorded in ART_ROOM_V3_PROMPT.md.
- The offline manifest contains 18 files, about 14.0 MB uncompressed, version `26d1c82be1bed10c`. Browser checks retain cold launch with the HTTP server stopped, integrity repair, explicit save-preserving updates, backups and reconnect conservation.

The checkpoint workflow runs the complete suite on Chromium and macOS WebKit and requires both jobs before deployment. [Actions](https://github.com/AndSuch-Mods/General-AI-Test-Space-1/actions) records the results for each exact commit. Physical iPhone installation, sustained frame rate, sleep, touch input and two-phone offline networking still require DEVICE_TESTS.md. These desktop results do not close those device gates or later content phases.

## Room and controls rework, 0.1.1

- Specification hash and all 53 sections, lint, TypeScript, 23 unit tests and production build pass locally.
- The browser suite now has ten scenarios per engine. Local Chromium passed the nine solo/offline/recovery/room cases. Its expanded real-peer test passed after fixing silently dropped movement requests and routing around the new solid furniture.
- Local Windows WebKit passed nine cases. Its runtime has no RTCPeerConnection, so the peer case is explicitly skipped there. The macOS 15 CI job runs that actual peer test before deployment.
- New checks exercise left/right profiles, closer camera scale, solid bed collision, furniture dialogue, candle state across reloads, mission notifications, persistent quick-slot references, compact controls and cancelled touch input. Core tests cover every solid from accessible sides, swept collision, diagonal speed, all furnishing actions, old-position repair, storage rollback and simultaneous shared-chest withdrawals.
- The peer test now includes guest deposit and host withdrawal, separate resulting inventories, dropout and rejoin with the actual HTTP server stopped.
- Landscape art and interface were inspected at 844 by 390 and 667 by 375. All compact control hit areas remain at least 44 by 44 CSS pixels. Hearth and candle lighting are separate animated layers.
- The current offline package is approximately 12.2 MB before compression. Earlier art is retained as development history. Physical iPhone acceptance remains open.

The [checkpoint Actions runs](https://github.com/AndSuch-Mods/General-AI-Test-Space-1/actions) record final Chromium and macOS WebKit outcomes for each commit. Both jobs must pass before Pages deploys. The room rework does not close the future map, time, sleep or full inventory-system gates.

## Art and Phase 1 checkpoint, 2026-09-18

`f4f0e85b59b612a527df31033103b17ac6c40aa1` contains the first integrated detailed art pass. Every repository file was checked against the workspace's Git blob hash before the checkpoint was published.

- Master hash and all 53 specification sections verified.
- Local lint, TypeScript, 15 unit tests and production build passed.
- CI Chromium on Linux passed all seven browser scenarios: save slots/rewards/export/reload; cold page with the HTTP origin shut down; actual WebRTC pairing/personal state/shared hearth/reconnect; default renderer; offline asset repair; explicit update preservation; import rejection and replacement confirmation.
- CI WebKit on macOS 26 passed six of seven. Local network discovery timed out before creating the host offer. No RTC test was skipped or marked passing.
- Windows WebKit passed the offline-origin shutdown and three recovery tests, but this platform's WebKit lacks RTCPeerConnection. Windows Chromium was too slow for reliable two-window interaction in this VM; CI provides the recorded Chromium result.
- Title artwork reviewed in the app at 1280x720, 844x390 and 667x375. Room, resident and shared hearth reviewed at 844x390. New art is included in the offline asset manifest, about 7.7 MB uncompressed for the whole build.

The follow-up at `328232d0c4a1061b4f3be8a35ec99073e1c36b8f` passed all seven Chromium and all seven WebKit scenarios on the pinned macOS 15 host, including actual co-op pairing and reconnect. [CI run 35369453548](https://github.com/AndSuch-Mods/General-AI-Test-Space-1/actions/runs/35369453548) records the result. Only the host OS changed; the WebKit package and test cases were retained. The macOS 26 failure remains an environment compatibility concern, not a passing result. A [current WebRTC issue](https://github.com/w3c/webrtc-pc/issues/3109) describes mDNS triggering macOS Local Network permission, but it has not established the cause of this CI failure. [GitHub lists both host versions as available](https://github.com/actions/runner-images).

The peer test now shuts down its actual HTTP server after joining, then exercises personal discoveries, shared changes, dropout and re-pairing. It checks server unavailability with a failed external fetch. This avoids browser offline emulation, which also disrupted fresh Chromium peer connections in a local experiment. The stronger test passed locally in Chromium in 12.2 seconds. Checkpoint `bfb4bb9c758a4efcaa56dbb1db8f26003de68892` passed all 14 browser scenarios and all 15 unit tests in [CI run 35370441518](https://github.com/AndSuch-Mods/General-AI-Test-Space-1/actions/runs/35370441518), including offline peer reconnect in both engines. It does not emulate two physical phones or prove all routers support local peers.

Physical two-iPhone installation, camera/QR, network reachability, suspension, reconnect and offline local-network tests remain open in DEVICE_TESTS.md. Passing desktop automation does not prove these device gates.

0.1.6 local checkpoint: specification coverage, lint, types, 60 unit tests and production build pass. The offline package contains 21 files (14,823,129 bytes), version b07e49542b019ec6. All three icon PNG dimensions and cache hashes match, and the archived source is byte-identical to the supplied image. Creation presets, persistent revised appearance, compact controls and adult render checks pass in Chromium. Full browser results remain recorded by the commit-specific Actions runs; physical iPhone checks remain pending. Reviewed the enlarged frame/sky and walnut doorway art in local rendered scenes. The initial door traversal check exposed chest selection near a doorway; the corrected jamb collision and arrival offset now pass the bedroom route, and unit tests assert the counterpart door is the nearest action on arrival.
