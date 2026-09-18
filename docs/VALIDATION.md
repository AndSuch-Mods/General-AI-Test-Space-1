# Validation record

## Art and Phase 1 checkpoint, 2026-09-18

`f4f0e85b59b612a527df31033103b17ac6c40aa1` contains the first integrated detailed art pass. Every repository file was checked against the workspace's Git blob hash before the checkpoint was published.

- Master hash and all 53 specification sections verified.
- Local lint, TypeScript, 15 unit tests and production build passed.
- CI Chromium on Linux passed all seven browser scenarios: save slots/rewards/export/reload; cold page with the HTTP origin shut down; actual WebRTC pairing/personal state/shared hearth/reconnect; default renderer; offline asset repair; explicit update preservation; import rejection and replacement confirmation.
- CI WebKit on macOS 26 passed six of seven. Local network discovery timed out before creating the host offer. No RTC test was skipped or marked passing.
- Windows WebKit passed the offline-origin shutdown and three recovery tests, but this platform's WebKit lacks RTCPeerConnection. Windows Chromium was too slow for reliable two-window interaction in this VM; CI provides the recorded Chromium result.
- Title artwork reviewed in the app at 1280x720, 844x390 and 667x375. Room, resident and shared hearth reviewed at 844x390. New art is included in the offline asset manifest, about 7.7 MB uncompressed for the whole build.

The next run pins the supported macOS 15 host to isolate OS-level local-network behavior. This changes the runner OS, not the WebKit test cases or browser package. A [current WebRTC issue](https://github.com/w3c/webrtc-pc/issues/3109) describes mDNS triggering macOS Local Network permission, but it has not established the cause of this CI failure. [GitHub lists both host versions as available](https://github.com/actions/runner-images).

Physical two-iPhone installation, camera/QR, network reachability, suspension, reconnect and offline local-network tests remain open in DEVICE_TESTS.md. Passing desktop automation does not prove these device gates.
