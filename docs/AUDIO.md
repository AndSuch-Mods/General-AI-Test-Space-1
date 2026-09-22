# Household audio

`src/audio/household-audio.ts` synthesizes all sound locally with Web Audio. It has no downloaded samples, third-party melodies, runtime network calls or package dependencies.

The original miniature, **An Unlatched Window**, uses eight written bars in D minor at 70 BPM. A soft triangle/sine instrument plays a fixed melody over sustained harmony and a quiet bass. The second statement changes the ending. Rests, note envelopes and a short synthesized room response leave space for movement and interactions. The entry hall is quieter and more muffled. Day and night alter the room filter.

Wooden footsteps, chest/door movement, paper, ignition, extinguishing, placement, sleep, waking and UI taps use separate pitched and filtered-noise envelopes. The deterministic noise buffers and reverberation impulse are generated on the device. These are original synthesized working assets, not a claim that the full game's soundtrack or audio pass is finished.

## Integration

Create one `HouseholdAudio`. Call and await `unlock()` directly from a pointer or keyboard gesture, and again after mobile suspension. It creates no AudioContext before that call. Catch an unsupported-browser or resume error without blocking gameplay.

- `setEnabled(false)` mutes music, ambience and effects. Re-enabling does not bypass the gesture requirement.
- `setMusicEnabled(false)` removes musical voices while leaving effects and hearth ambience available.
- `setScene({ map, night, hearth })` follows authoritative room and world state.
- `cue(name)` responds to an accepted interaction or actual movement. Do not emit footsteps for a blocked movement request. Emit replicated environmental cues once per accepted change.
- `suspend()` stops scheduled voices and the scheduler. Visibility loss and page exit also call it automatically. `destroy()` releases the graph, closes the context and removes listeners.

One 100 ms scheduler schedules only 180 ms ahead. At most 40 voices may exist, with one or two sources each. Every voice disconnects on completion; muting, suspension and destruction cancel outstanding voices. Conservative bus gains and output compression bound the mix. No sound starts before unlock or while the document is hidden. A standalone installed iPhone, Bluetooth route changes and interruption/resume still need listening and device acceptance.

## Fireplace revision, 2026-09-22

The fireplace now has a continuous stereo bed of low, airy colored noise and a quieter ember hiss. Slow overlapping changes in intensity keep it from sounding like a fixed electronic tone. A 350 ms crossfade joins the buffer loop; a high-pass removes sub-bass/DC and a low-pass softens the hiss. This 24 kHz buffer uses about 1.4 MB. It fades in over 1.3 seconds and out over 450 ms.

Individual ember releases last 130–430 ms, with 28–58 ms attacks. Deterministic variation changes their spacing, noise offset, cutoff and level. They sit inside the continuous bed instead of making a repeated sequence of isolated, sharp clicks. Ignition is a breath of air and flame; extinguishing has a soft hiss. The fire follows the local hearth flag in the bedroom or kitchen and is absent from the entry hall. Music mute leaves these room sounds available. The existing public audio API is unchanged.

The actual browser graph was rendered offline for 14 seconds with music disabled, ignition at the start and extinguishing at 12 seconds. Generated review files are `.local/fireplace-preview-mix.wav`, `.local/fireplace-preview-audition.wav`, `.local/fireplace-envelope.png` and `.local/fireplace-preview-metrics.json`. The audition copy adds 18 dB for easier isolated listening; it does not change game gains.

The unboosted render peaked at -30.01 dBFS, with zero clipped samples and mean DC of 0.00000088. Active 100 ms RMS windows stayed between 0.00439 and 0.00941 after startup. The loop-boundary window had RMS 0.00731 and maximum adjacent-sample difference 0.00375, below the overall maximum of 0.01176. The envelope was visually inspected for continuity and the requested fade. This is signal validation, not a claim of an iPhone speaker listening test. Headphone and phone-speaker review, including the music mix, remains necessary.
