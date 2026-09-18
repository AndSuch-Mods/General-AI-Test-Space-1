# Validation record

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
