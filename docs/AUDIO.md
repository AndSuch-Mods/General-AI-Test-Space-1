# Household audio

`src/audio/household-audio.ts` synthesizes all sound locally with Web Audio. It has no downloaded samples, third-party melodies, runtime network calls or package dependencies.

The original miniature, **An Unlatched Window**, uses eight written bars in D minor at 70 BPM. A soft triangle/sine instrument plays a fixed melody over sustained harmony and a quiet bass. The second statement changes the ending. Rests, note envelopes and a short synthesized room response leave space for movement and interactions. The landing is quieter and more muffled. Day and night alter the room filter. A lit castle hearth adds restrained, patterned crackles.

Wooden footsteps, chest/door movement, paper, ignition, extinguishing, placement, sleep, waking and UI taps use separate pitched and filtered-noise envelopes. The deterministic noise buffers and reverberation impulse are generated on the device. These are original synthesized working assets, not a claim that the full game's soundtrack or audio pass is finished.

## Integration

Create one `HouseholdAudio`. Call and await `unlock()` directly from a pointer or keyboard gesture, and again after mobile suspension. It creates no AudioContext before that call. Catch an unsupported-browser or resume error without blocking gameplay.

- `setEnabled(false)` mutes music, ambience and effects. Re-enabling does not bypass the gesture requirement.
- `setMusicEnabled(false)` removes musical voices while leaving effects and hearth ambience available.
- `setScene({ map, night, hearth })` follows authoritative room and world state.
- `cue(name)` responds to an accepted interaction or actual movement. Do not emit footsteps for a blocked movement request. Emit replicated environmental cues once per accepted change.
- `suspend()` stops scheduled voices and the scheduler. Visibility loss and page exit also call it automatically. `destroy()` releases the graph, closes the context and removes listeners.

One 100 ms scheduler schedules only 180 ms ahead. At most 40 voices may exist, with one or two sources each. Every voice disconnects on completion; muting, suspension and destruction cancel outstanding voices. Conservative bus gains and output compression bound the mix. No sound starts before unlock or while the document is hidden. A standalone installed iPhone, Bluetooth route changes and interruption/resume still need listening and device acceptance.
