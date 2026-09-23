# Household audio

## Current hearth, 0.1.11

A processed CC0 wood-fire recording replaces synthetic hearth pops. See HOUSEHOLD_POLISH_11.md for provenance and offline/lifecycle behavior. Local asset loading never blocks unlock/music, the loop seam is blended, and added pop scheduling stops once loaded. Other audio remains synthesized. Synthesis-only descriptions below refer to earlier builds.

`src/audio/household-audio.ts` synthesizes all sound locally with Web Audio. It has no downloaded samples, third-party melodies, runtime network calls or package dependencies.

The original miniature, **An Unlatched Window**, uses eight written bars in D minor at 70 BPM. A soft triangle/sine instrument plays a fixed melody over sustained harmony and a quiet bass. The second statement changes the ending. Rests, note envelopes and a short synthesized room response leave space for movement and interactions. The entry hall is quieter and more muffled. Day and night alter the room filter.

Wooden footsteps, chest/door movement, paper, ignition, extinguishing, placement, sleep, waking and UI taps use separate pitched and filtered-noise envelopes. The deterministic noise buffers and reverberation impulse are generated on the device. These are original synthesized working assets, not a claim that the full game's soundtrack or audio pass is finished.

## Integration

Create one `HouseholdAudio`. Call and await `unlock()` directly from a pointer or keyboard gesture, and again after mobile suspension. It creates no AudioContext before that call. Catch an unsupported-browser or resume error without blocking gameplay.

Every scheduling path requires a finite, nonnegative audio clock. A temporarily invalid clock defers scheduling while the authorized timer waits for recovery; the latest scene and sound preferences then apply. Old one-shot cues are dropped. Muting still cancels voices immediately, and suspension still requires a new gesture. The main-menu release exposed this failure in macOS WebKit; a browser regression injects a NaN clock during resident creation and verifies that entering the room succeeds and audio can resume.

The sound checkbox calls `unlock()` again inside its enabling change event. The earlier pointer-down can run while sound is still muted. A lifecycle counter rejects stale resume completions after mute or suspension, so an old gesture cannot undo a later enable. Returning to the title clears the room fire state before another gesture can resume sound.

- `setEnabled(false)` mutes music, ambience and effects. Re-enabling does not bypass the gesture requirement.
- `setMusicEnabled(false)` removes musical voices while leaving effects and hearth ambience available.
- `setScene({ map, night, hearth, sink?, stove? })` follows authoritative room and world state. Omitted appliance flags mean off. Pass the actual local room switches on every change; use `hearth` only for fireplaces and the separate kitchen flags for water/gas. Clear all three on the title screen.
- `cue('stove-ignite' | 'stove-off' | 'sink-on' | 'sink-off')` accompanies accepted appliance changes; `ignite`/`extinguish` remain fireplace cues. Emit each transition once, including replicated changes.
- `cue(name)` responds to an accepted interaction or actual movement. Do not emit footsteps for a blocked movement request. Emit replicated environmental cues once per accepted change.
- `suspend()` stops scheduled voices and the scheduler. Visibility loss and page exit also call it automatically. `destroy()` releases the graph, closes the context and removes listeners.

One 100 ms scheduler schedules only 180 ms ahead. At most 40 voices may exist, with one or two sources each. Every voice disconnects on completion; muting, suspension and destruction cancel outstanding voices. Conservative bus gains and output compression bound the mix. No sound starts before unlock or while the document is hidden. A standalone installed iPhone, Bluetooth route changes and interruption/resume still need listening and device acceptance.

## Wood, running water and gas, 2026-09-23

The active fireplace now layers rounded wood-grain releases, short resonant tails and irregular paired pops. It has no continuous wind/rain noise layer. The previous exact noise-bed synthesis is retained, unused, in `src/audio/archive/rain-candidate-2026-09-22.ts` for possible future rain work. Production audio does not import it.

The kitchen sink has a separate soft stream with small liquid resonances. The gas stove uses a higher, steady burner hiss and a short igniter/flare cue. Each loop fades independently when switched off or leaving the kitchen; music mute preserves ambience, while master mute, hiding and destruction stop every source. Delayed voice envelopes explicitly start at zero to avoid a one-sample unity-gain tick during ignition.

One focused lifecycle run passed all 12 tests, including independent appliance switches, omitted flags, finite-clock recovery, hiding, mute and gesture resume. Actual Web Audio renders at game gain measured fire/water/gas at 16.6/9.1/10.1 dB below music RMS. The combined music/fire and music/kitchen peaks were -24.9/-24.4 dBFS, with no clipped samples, absolute mean DC below 0.000001 and at most 15 voices. The first render exposed an ignition spike; initializing delayed envelopes at zero removed it in the verification render. Review samples and metrics are in `.local/household-sounds/` (`fire.wav`, `sink.wav`, `stove.wav`, `music-fire.wav`, `music-kitchen.wav`). No normalization or loudness boost was applied. These signal checks do not establish headphone or physical iPhone listening acceptance.

## Archived fireplace balance revision, 2026-09-22

The previous fire overwhelmed the music and resembled wind. Its replacement removes the slow gust envelope, deep rumble and broad hiss. A quieter, narrower band of continuous combustion texture supports short, irregular wood crackles. Ember releases last 75–195 ms with rounded 12–24 ms attacks; occasional softer pairs vary the rhythm without hard impulses. Ignition and extinguishing are quieter too. The stereo loop retains its 350 ms crossfade, DC removal, 1.3 second fade-in and 450 ms fade-out. The existing API, offline synthesis, room selection, music, mute and gesture lifecycle are unchanged.

The actual old and new browser graphs were rendered for 29 seconds at game gains, including the unchanged music. Across the active interval, the revised fire measured 14.8 dB below the published `fe9750d` fire and 13.9 dB below music RMS. Fire energy below 145 Hz fell from 53.7% to 3.2%, reducing the wind-like rumble. The new fire peaked at -39.6 dBFS; the combined mix peaked at -25.0 dBFS. Every render had zero clipped samples and absolute mean DC below 0.000001. The mix used at most 14 voices against the limit of 40. Waveform envelopes were inspected for continuity and fades.

Review artifacts in `.local/fire-balance/` include `fire.wav`, `music-fire.wav`, and `comparison-before-then-after.wav` (29 seconds before, one second silence, 29 seconds after). These stereo 24 kHz files have no normalization or audition boost. `metrics.json`, `spectral-check.json` and `envelopes.png` record the signal checks; `.local/render-fire-balance.mjs` reproduces the renders.

All three audio activation regression tests passed. Actual Chromium checks confirmed two offline mute/re-enable cycles and removal of all active fire voices and the scheduler on mute/suspension. These are signal and lifecycle checks; subjective headphone listening and physical iPhone speaker acceptance remain unverified.
