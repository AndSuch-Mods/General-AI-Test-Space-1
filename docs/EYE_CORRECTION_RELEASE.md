# Original resident eye correction

The isolated correction delivered matched open idle eyes, retaining the approved resident's identity and stable face while walking. The larger household restoration has resumed. The user explicitly clarified that the eye interruption did not cancel any other work. See `HOUSEHOLD_ACCEPTANCE.md` for the full list.

The correction lives in the isolated `.local/eye-hotfix` checkout and `codex/eye-correction`, checkpoint `7b1539b02bab32ce1d3061484de73f46f1533edc`. Root development files are still the unpublished v7 restoration; do not reset or overwrite them to match the hotfix. Preserve this eye correction when the later character layers are integrated.

The renderer restores the original source's complete 2-by-3 open eye and brow cluster in both front-facing positions after customization. Original PNGs, body/face proportions, room artwork, saves and networking are unchanged. Offline package version: `317c692f775a78be`.

Validation: 63 unit tests; 21 browser cases per engine passed on Chromium and macOS WebKit for checkpoint `4b23618` in Actions run `35799660335`. Eye checks inspect actual preview pixels, both bodies, all hairstyles and skin palettes, saved appearance, and fixed faces during walking. Visual review includes the in-room sprite and game-scale before/after.

Publication is complete at `7b1539b`. The first main checkpoint was `4b23618`; its Pages job was held by Chromium reconnect failure in run `35800107082`, both original and retry. Mac WebKit passed. Three local reconnect repeats passed. The second offer and answer in the failure trace match and Connect completes, but the trace lacks peer lifecycle details. The previous disconnect toast can remain visible and is not proof the new connection closed. Checkpoint `7b1539b` adds test-only lifecycle and ICE diagnostics without changing production networking or assertions. Diagnostic branch run: `35801560189`.

Checkpoint `7b1539b` subsequently passed all 21 browser cases on each engine in `35801560189`, including real connected second peers in the diagnostic logs. Main points to that checkpoint. Release run `35802015049` passed both browser jobs and deployed successfully. These results do not establish the cause of the earlier intermittent reconnect failures.

Live verification passed at `https://andsuch-mods.github.io/General-AI-Test-Space-1/`: manifest `317c692f775a78be`, matching open eye pixels in male/female previews, the corrected in-room texture, saved customization, and a fresh offline page continuing the world without script errors. Screenshot: `.local/eye-hotfix-live.png`; results: `.local/eye-live-result.json`.

A separate persistent browser installed the old live package and saved a named customized resident before deployment. Its real Update ready / restart action loaded the correction, retained the name and appearance, and continued from a cold offline page. Result: `.local/eye-upgrade-result.json`. This did not touch user saves. Physical iPhone acceptance remains open.
