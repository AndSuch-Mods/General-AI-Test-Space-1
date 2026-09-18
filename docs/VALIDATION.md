# Validation record

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
