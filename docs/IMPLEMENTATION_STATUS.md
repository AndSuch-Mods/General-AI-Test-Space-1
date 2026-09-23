# Implementation status

The original-art eye correction was published at `7b1539b`. Its source-pixel correction is included in the combined household restoration. See `EYE_CORRECTION_RELEASE.md` for that isolated release's evidence and the earlier intermittent CI reconnect history. Combined checks belong in VALIDATION.md and the exact checkpoint's Actions run.

The initial v7 procedural art was rejected. The full household request has resumed. Original furniture fronts are restored, approved generated wooden doors are retained, and compatible raster resident layers are integrated. The eye fix was a priority interruption, not a cancellation. Track every requirement in `HOUSEHOLD_ACCEPTANCE.md`; publication requires the combined restored artwork to pass review and regression checks.

Current build: **0.1.7**, the September 22 household rework. This remains an early playable household slice; Phase 1 device acceptance is open.

Implemented: compatible male/female raster layers with stable matched eyes; correctly masked, evenly spaced windows; centered directional doors crossed by walking; blocked-input facing; full-room touch layout drafts with clamping, placement colors, rotation and atomic saving; shared sofa/chair seating; directional beds, containers and attached desk objects; centered functional menus; portrait blocking through creation and play; smoother original fire ambience; a distinct entry hall and basic kitchen. Approved furniture fronts remain pixel-identical. Added views use explicit floor depth and upright elevation.

Existing systems remain: two world slots, host-authoritative solo/co-op, persistent individual profiles, bedroom ownership, shared storage, IndexedDB recovery, validated backups, guest mirrors, offline packages, configurable time, personal fatigue, two-person sleep and dawn journals. Schema 6 and protocol 8 preserve earlier saves while rejecting mixed-version pairing. The supplied home-screen icon remains in the offline package.

The current kitchen has a movable stove, sink and recipe worktable, with room for upgrades. Its appliance cues and recipe menu do not implement the later cooking/chocolate progression. Generic observation popups are removed; letters, journals, storage and sleep choices remain.

Validation and publication evidence belong in [VALIDATION.md](VALIDATION.md). The full unchanged target matrix remains in TEST_PLAN.md and the master. No physical iPhone results are claimed.

Open work:

- Actual iPhone installation, cold offline launch, touch feel and audio audition.
- Two-iPhone local Wi-Fi pairing, camera/QR permissions, suspension, reconnect and offline local-network operation.
- Phase 2 town/wilderness and fixed-rate simulation; current rooms do not complete the exploration slice.
- Later equipment layers and in-game wardrobe progression. Creation now has two bodies, six hairstyles, five outfits and personal skin/hair/clothing palettes.
- Multi-day device stress and complete clock/schedule consumers.
- Combat, crafting, cooking, fishing, NPC schedules, relationships and the main story.
- Guided recovery from a guest mirror newer than its host; current behavior safely rejects the join.
- Cleanup of old caches after all clients stop using them.
