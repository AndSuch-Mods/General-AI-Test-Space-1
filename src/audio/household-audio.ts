import type { RoomMap } from '../content/room';
export type HouseholdCue = 'step' | 'open' | 'close' | 'paper' | 'ignite' | 'extinguish' | 'stove-ignite' | 'stove-off' | 'sink-on' | 'sink-off' | 'door' | 'place' | 'sleep' | 'wake' | 'disturbed' | 'ui';
export type HouseholdSoundScene = { map: RoomMap; night: boolean; hearth: boolean; sink?: boolean; stove?: boolean };
type Appliance = 'sink' | 'stove';
type Bus = 'music' | 'effect' | 'fire' | Appliance;
const APPLIANCES = { sink: { level: .04, high: 300, low: 3600 }, stove: { level: .017, high: 1900, low: 6500 } } as const;
type Voice = { sources: AudioScheduledSourceNode[]; nodes: AudioNode[]; bus: Bus };

// "An Unlatched Window", an original eight-bar miniature, in D minor.
// Eighth-note positions include written rests. The second statement changes its ending.
const PHRASES: readonly (readonly (number | null)[])[] = [
  [69, null, 65, null, 64, 62, null, null],
  [65, null, 67, 69, null, 72, null, 69],
  [67, null, 62, null, 65, 64, null, 62],
  [64, null, 68, null, 71, 69, null, null],
  [62, null, 65, 69, null, 74, null, 72],
  [69, null, 65, null, 67, 69, null, null],
  [67, null, 65, 64, null, 62, null, 64],
  [61, null, 64, null, 62, null, null, null],
];
const HARMONY = [[50, 57, 60, 65], [46, 53, 57, 62], [43, 50, 57, 62], [45, 52, 55, 61],
  [50, 57, 60, 64], [46, 53, 57, 60], [43, 50, 55, 62], [45, 52, 55, 61]] as const;
const EIGHTH = 60 / 70 / 2;
const FIRE_BED_LEVEL = .24;
const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** Entirely local synthesis. Nothing is constructed or played until unlock(). */
export class HouseholdAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private music?: GainNode;
  private effects?: GainNode;
  private roomFilter?: BiquadFilterNode;
  private graph: AudioNode[] = [];
  private noise?: AudioBuffer;
  private fireBed?: AudioBuffer;
  private fireVoice?: Voice;
  private fireGain?: GainNode;
  private fireStartedAt = 0;
  private applianceBeds: Partial<Record<Appliance, AudioBuffer>> = {};
  private applianceLoops: Partial<Record<Appliance, { voice: Voice; gain: GainNode; startedAt: number }>> = {};
  private fireSeed = 0x6e6d6265;
  private voices = new Set<Voice>();
  private timer?: ReturnType<typeof setInterval>;
  private enabled = true;
  private musicEnabled = true;
  private unlocked = false;
  private disposed = false;
  private lifecycle = 0;
  private scene: HouseholdSoundScene = { map: 'castle', night: true, hearth: false, sink: false, stove: false };
  private nextNote = 0;
  private nextCrackle = 0;
  private scoreStep = 0;
  private cueStep = 0;
  private clockPending = false;
  private lastCue = new Map<HouseholdCue, number>();
  private readonly hidden = () => { if (document.hidden) this.suspend(); };
  private readonly leaving = () => this.suspend();

  constructor() {
    document.addEventListener('visibilitychange', this.hidden);
    window.addEventListener('pagehide', this.leaving);
  }

  /** Call directly from a pointer/key gesture, including after iOS suspends audio. */
  async unlock(): Promise<void> {
    if (this.disposed || !this.enabled) return;
    if (!this.context) this.build();
    const context = this.context!;
    const lifecycle = this.lifecycle;
    await context.resume();
    // A resume requested on pointer-down may settle after the checkbox changes.
    // That older gesture must neither restart muted voices nor suspend a newer enable.
    if (this.disposed || lifecycle !== this.lifecycle || !this.enabled) return;
    if (document.hidden) { this.suspend(); return; }
    this.unlocked = true;
    this.start();
  }

  setEnabled(enabled: boolean) {
    this.lifecycle++;
    this.enabled = enabled;
    if (!this.context || this.disposed) return;
    const now = this.audioTime();
    if (now !== undefined) {
      this.master!.gain.cancelScheduledValues(now);
      this.master!.gain.setTargetAtTime(enabled ? .48 : 0, now, .02);
    } else if (!enabled) {
      this.master!.gain.cancelScheduledValues(0); this.master!.gain.value = 0;
    }
    if (!enabled) { this.stopTimer(); this.stopVoices(); }
    else if (this.unlocked && this.context.state === 'running' && !document.hidden) this.start();
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!this.context || this.disposed) return;
    const now = this.audioTime();
    if (now !== undefined) this.music!.gain.setTargetAtTime(enabled ? .32 : 0, now, .08);
    else if (!enabled) { this.music!.gain.cancelScheduledValues(0); this.music!.gain.value = 0; }
    if (!enabled) this.stopVoices('music');
    this.scoreStep -= this.scoreStep % 8;
    this.nextNote = now === undefined ? 0 : now + .1;
  }

  setScene(scene: HouseholdSoundScene) {
    const next = { ...scene, sink: !!scene.sink, stove: !!scene.stove };
    if (next.map === this.scene.map && next.night === this.scene.night && next.hearth === this.scene.hearth && next.sink === this.scene.sink && next.stove === this.scene.stove) return;
    this.scene = next;
    if (!this.context || this.disposed) return;
    const now = this.audioTime();
    if (now === undefined) return;
    this.roomFilter!.frequency.setTargetAtTime(scene.map === 'landing' ? 1650 : scene.night ? 2400 : 3300, now, 1.2);
    this.updateFire(now);
    this.updateAppliances(now);
  }

  cue(name: HouseholdCue) {
    if (!this.canPlay()) return;
    const now = this.audioTime();
    if (now === undefined) return;
    if (now - (this.lastCue.get(name) ?? -1) < (name === 'step' ? .12 : .07)) return;
    this.lastCue.set(name, now); this.cueStep++;
    const tone = (start: number, end: number, length: number, gain: number, delay = 0) => this.wood(now + delay, start, end, length, gain);
    const rustle = (length: number, cutoff: number, gain: number, delay = 0, band = false) => this.noiseVoice(now + delay, length, cutoff, gain, band);
    switch (name) {
      case 'step': tone(this.cueStep % 2 ? 108 : 94, 46, .13, .055); rustle(.095, 720, .033); break;
      case 'open': tone(230, 145, .24, .043); rustle(.24, 650, .06, 0, true); tone(90, 42, .12, .052, .16); break;
      case 'close': tone(103, 37, .22, .09); rustle(.07, 920, .072); break;
      case 'paper': rustle(.13, 2100, .047, 0, true); rustle(.18, 3100, .033, .1, true); break;
      case 'ignite': this.ember(now, .25, 1600, .025); this.ember(now + .13, .29, 980, .017); break;
      case 'extinguish': rustle(.25, 950, .017, 0, true); break;
      case 'stove-ignite': tone(1300, 940, .035, .014); tone(1270, 900, .04, .012, .09); rustle(.36, 2800, .032, .14, true); break;
      case 'stove-off': tone(210, 110, .07, .018); rustle(.16, 3200, .012, 0, true); break;
      case 'sink-on': tone(220, 115, .09, .018); rustle(.4, 1900, .022, .03, true); break;
      case 'sink-off': tone(190, 105, .08, .018); rustle(.22, 1700, .015, 0, true); break;
      case 'door': tone(190, 105, .46, .065); rustle(.43, 410, .078, 0, true); tone(89, 39, .19, .066, .31); break;
      case 'place': tone(151, 64, .12, .06); rustle(.065, 1150, .047); break;
      case 'disturbed': rustle(.24, 740, .048, 0, true); tone(118, 81, .23, .025, .08); break;
      case 'sleep': this.note(65, now, 1.25, .10, 'effect'); this.note(62, now + .27, 1.7, .095, 'effect'); break;
      case 'wake': this.note(62, now, 1.2, .09, 'effect'); this.note(65, now + .22, 1.4, .075, 'effect'); this.note(69, now + .48, 1.7, .067, 'effect'); break;
      case 'ui': tone(420, 285, .065, .019); break;
    }
  }

  suspend() {
    this.lifecycle++;
    this.stopTimer(); this.stopVoices(); this.lastCue.clear();
    if (this.context && this.context.state !== 'closed') void this.context.suspend().catch(() => undefined);
  }

  destroy() {
    if (this.disposed) return;
    this.disposed = true; this.lifecycle++; this.stopTimer(); this.stopVoices();
    document.removeEventListener('visibilitychange', this.hidden);
    window.removeEventListener('pagehide', this.leaving);
    this.graph.forEach(node => node.disconnect()); this.graph = [];
    if (this.context) void this.context.close().catch(() => undefined);
    this.context = undefined; this.noise = undefined; this.fireBed = undefined;
    this.applianceBeds = {};
  }

  private canPlay() { return !this.disposed && this.enabled && this.unlocked && !document.hidden && this.context?.state === 'running'; }

  private audioTime(): number | undefined {
    const now = this.context?.currentTime;
    if (now === undefined || !Number.isFinite(now) || now < 0) {
      // A waking WebKit context can transiently expose an unusable clock.
      // Keep the authorized scheduler alive, but never send it to Web Audio.
      this.clockPending = true;
      return;
    }
    return now;
  }

  private build() {
    const Constructor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Constructor) throw Error('This browser does not support game audio.');
    const context = this.context = new Constructor({ latencyHint: 'interactive' });
    const master = this.master = context.createGain(), music = this.music = context.createGain(), effects = this.effects = context.createGain();
    const filter = this.roomFilter = context.createBiquadFilter(), compressor = context.createDynamicsCompressor();
    const reverb = context.createConvolver(), send = context.createGain(), wet = context.createGain();
    master.gain.value = 0; music.gain.value = this.musicEnabled ? .32 : 0; effects.gain.value = .55;
    filter.type = 'lowpass'; filter.frequency.value = this.scene.map === 'landing' ? 1650 : this.scene.night ? 2400 : 3300; filter.Q.value = .25;
    compressor.threshold.value = -15; compressor.knee.value = 10; compressor.ratio.value = 4; compressor.attack.value = .006; compressor.release.value = .2;
    send.gain.value = .16; wet.gain.value = .22;
    music.connect(filter); filter.connect(master); effects.connect(master);
    filter.connect(send); effects.connect(send); send.connect(reverb); reverb.connect(wet); wet.connect(master);
    master.connect(compressor); compressor.connect(context.destination);
    this.graph = [master, music, effects, filter, compressor, reverb, send, wet];
    let seed = 0x7457696c;
    const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296 * 2 - 1; };
    const impulse = context.createBuffer(2, Math.ceil(context.sampleRate * 1.15), context.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < data.length; i++) data[i] = random() * (1 - i / data.length) ** 3 * .4;
    }
    reverb.buffer = impulse;
    this.noise = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = random();
    this.fireBed = this.buildFireBed(context);
    this.applianceBeds = { sink: this.buildApplianceBed(context, 'sink'), stove: this.buildApplianceBed(context, 'stove') };
    this.setScene(this.scene);
  }

  private start() {
    if (this.timer || !this.canPlay()) return;
    this.clockPending = true;
    this.timer = setInterval(() => this.schedule(), 100);
    this.schedule();
  }

  private schedule() {
    if (!this.canPlay()) { this.stopTimer(); return; }
    const now = this.audioTime();
    if (now === undefined) return;
    if (this.clockPending) {
      this.master!.gain.cancelScheduledValues(now);
      this.master!.gain.setTargetAtTime(.48, now, .04);
      this.music!.gain.setTargetAtTime(this.musicEnabled ? .32 : 0, now, .08);
      this.roomFilter!.frequency.setTargetAtTime(this.scene.map === 'landing' ? 1650 : this.scene.night ? 2400 : 3300, now, 1.2);
      this.nextNote = now + .08; this.nextCrackle = now + .8;
      this.scoreStep -= this.scoreStep % 8;
      this.clockPending = false;
    }
    this.updateFire(now);
    this.updateAppliances(now);
    if (this.nextNote < now - .2) this.nextNote = now + .05;
    if (this.musicEnabled) while (this.nextNote < now + .18) {
      const bar = Math.floor(this.scoreStep / 8) % 8, beat = this.scoreStep % 8, statement = Math.floor(this.scoreStep / 64) % 2;
      const chord = HARMONY[bar], at = this.nextNote;
      const roomLevel = this.scene.map === 'landing' ? .68 : 1;
      if (beat === 0) {
        chord.forEach((pitch, index) => this.note(pitch, at, EIGHTH * 8 + .3, (.031 - index * .003) * roomLevel, 'music', true));
        this.note(chord[0] - 12, at + .015, 2.3, .082 * roomLevel, 'music');
      }
      let pitch = PHRASES[bar][beat];
      if (statement && bar === 6 && beat === 5) pitch = 69;
      if (statement && bar === 7 && beat === 4) pitch = 74;
      if (pitch !== null) this.note(pitch, at + (beat % 2 ? .014 : 0), 1.65, (beat === 0 ? .13 : .105) * roomLevel, 'music');
      this.scoreStep = (this.scoreStep + 1) % 128; this.nextNote += EIGHTH;
    }
    if (this.fireVoice && now >= this.nextCrackle) {
      // Small dry wood releases, occasionally paired, give the quiet bed its fire
      // texture. Rounded attacks avoid isolated digital clicks.
      this.ember(now + .02, .14 + this.fireRandom() * .2, 1100 + this.fireRandom() * 1600, .018 + this.fireRandom() * .02);
      if (this.fireRandom() < .4) this.ember(now + .08 + this.fireRandom() * .12, .12 + this.fireRandom() * .15, 850 + this.fireRandom() * 1300, .01 + this.fireRandom() * .013);
      this.nextCrackle = now + .18 + this.fireRandom() ** 2 * 1.65;
    }
  }

  private fireRandom() {
    let seed = this.fireSeed; seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; this.fireSeed = seed;
    return (seed >>> 0) / 4294967296;
  }

  private buildFireBed(context: AudioContext) {
    // Overlapping wood-grain releases, not a continuous wind/rain noise bed.
    // Each release has a rounded onset, a dry noisy body and short wood resonance.
    const rate = 24000, duration = 11.3, length = Math.round(rate * duration);
    const buffer = context.createBuffer(2, length, rate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let at = .02; at < duration; at += .035 + this.fireRandom() ** 2 * .25) {
        const span = .07 + this.fireRandom() * .24, level = .045 + this.fireRandom() * .10;
        const body = 180 + this.fireRandom() * 230, attack = .008 + this.fireRandom() * .016;
        let grain = 0;
        for (let i = 0; i < span * rate; i++) {
          const t = i / rate, index = Math.floor(at * rate) + i;
          if (index >= length) break;
          grain = grain * .55 + (this.fireRandom() * 2 - 1) * .45;
          const rise = Math.sin(Math.min(1, t / attack) * Math.PI / 2) ** 2;
          const envelope = rise * Math.exp(-5 * t / span) * Math.min(1, (span - t) / .012);
          const timber = Math.sin(t * body * Math.PI * 2) * .18 + Math.sin(t * body * 1.43 * Math.PI * 2) * .07;
          data[index] += (grain + timber * Math.exp(-t * 22)) * envelope * level;
        }
      }
    }
    return this.finishLoop(buffer);
  }

  private buildApplianceBed(context: AudioContext, kind: Appliance) {
    const rate = 24000, length = Math.round(rate * 6.7), buffer = context.createBuffer(2, length, rate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel); let smooth = 0, low = 0;
      for (let i = 0; i < length; i++) {
        const noise = this.fireRandom() * 2 - 1;
        smooth = smooth * .62 + noise * .38; low = low * .95 + noise * .05;
        data[i] = kind === 'sink' ? (smooth - low) * .7 : noise - smooth;
      }
      if (kind === 'sink') for (let at = .04; at < 6.7; at += .035 + this.fireRandom() * .13) {
        const span = .035 + this.fireRandom() * .055, pitch = 850 + this.fireRandom() * 1700;
        for (let i = 0; i < span * rate; i++) {
          const t = i / rate, index = Math.floor(at * rate) + i;
          if (index >= length) break;
          // Tiny downward liquid resonances inside the soft running stream.
          data[index] += Math.sin(2 * Math.PI * pitch * (t - t * t * 2)) * Math.sin(Math.PI * t / span) ** 2 * .045;
        }
      }
    }
    return this.finishLoop(buffer);
  }

  private finishLoop(buffer: AudioBuffer) {
    const length = buffer.length, rate = buffer.sampleRate;
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      // Fold the tail into the head across 350 ms. Both ends then have the same
      // samples and slope, so the loop has no discontinuity or periodic pop.
      const overlap = Math.round(rate * .35), start = length - overlap;
      const first = data.slice(0, overlap);
      for (let i = 0; i < overlap; i++) {
        const blend = .5 - .5 * Math.cos(i / (overlap - 1) * Math.PI);
        data[start + i] = data[start + i] * (1 - blend) + first[i] * blend;
      }
      let mean = 0;
      for (let i = 0; i < length; i++) mean += data[i];
      mean /= length;
      for (let i = 0; i < length; i++) data[i] -= mean;
    }
    return buffer;
  }

  private updateFire(now: number) {
    if (!this.context) return;
    const audible = this.canPlay() && this.scene.hearth && this.scene.map !== 'landing' && this.scene.map !== 'kitchen';
    if (!audible) {
      const voice = this.fireVoice, gain = this.fireGain;
      this.fireVoice = undefined; this.fireGain = undefined; this.nextCrackle = 0;
      if (voice && gain) {
        const held = FIRE_BED_LEVEL * Math.min(1, Math.max(0, now - this.fireStartedAt) / 1.3);
        gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(held, now); gain.gain.linearRampToValueAtTime(0, now + .45);
        voice.sources.forEach(source => source.stop(now + .5));
      }
      return;
    }
    if (this.fireVoice) return;
    const context = this.context, source = context.createBufferSource(), high = context.createBiquadFilter(), low = context.createBiquadFilter(), gain = context.createGain();
    source.buffer = this.fireBed!; source.loop = true;
    // The folded tail reaches the first 350 ms of audio. Resume beyond that
    // matching section on wrap, preserving a continuous waveform at loopEnd.
    source.loopStart = .35; source.loopEnd = 11.3;
    high.type = 'highpass'; high.frequency.value = 110; high.Q.value = .5;
    low.type = 'lowpass'; low.frequency.value = 4000; low.Q.value = .4;
    source.connect(high); high.connect(low); low.connect(gain); gain.connect(this.effects!);
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(FIRE_BED_LEVEL, now + 1.3);
    this.fireStartedAt = now;
    this.fireVoice = { sources: [source], nodes: [source, high, low, gain], bus: 'fire' }; this.fireGain = gain;
    this.track(this.fireVoice, now, Infinity); this.nextCrackle = now + .8;
  }

  private updateAppliances(now: number) {
    if (!this.context) return;
    for (const kind of ['sink', 'stove'] as const) {
      const enabled = this.canPlay() && this.scene.map === 'kitchen' && this.scene[kind];
      const active = this.applianceLoops[kind], settings = APPLIANCES[kind];
      if (!enabled) {
        if (!active) continue;
        delete this.applianceLoops[kind];
        active.gain.gain.cancelScheduledValues(now);
        active.gain.gain.setValueAtTime(settings.level * Math.min(1, Math.max(0, now - active.startedAt) / .35), now);
        active.gain.gain.linearRampToValueAtTime(0, now + .28);
        active.voice.sources.forEach(source => source.stop(now + .32));
        continue;
      }
      if (active) continue;
      const source = this.context.createBufferSource(), high = this.context.createBiquadFilter(), low = this.context.createBiquadFilter(), gain = this.context.createGain();
      source.buffer = this.applianceBeds[kind]!; source.loop = true; source.loopStart = .35; source.loopEnd = 6.7;
      high.type = 'highpass'; high.frequency.value = settings.high; high.Q.value = .5;
      low.type = 'lowpass'; low.frequency.value = settings.low; low.Q.value = .4;
      source.connect(high); high.connect(low); low.connect(gain); gain.connect(this.effects!);
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(settings.level, now + .35);
      const voice: Voice = { sources: [source], nodes: [source, high, low, gain], bus: kind };
      this.applianceLoops[kind] = { voice, gain, startedAt: now }; this.track(voice, now, Infinity);
    }
  }

  private ember(at: number, duration: number, cutoff: number, level: number) {
    const context = this.context!, source = context.createBufferSource(), filter = context.createBiquadFilter(), high = context.createBiquadFilter(), envelope = context.createGain();
    const timber = context.createOscillator(), partial = context.createGain();
    envelope.gain.value = 0;
    source.buffer = this.noise!;
    filter.type = 'lowpass'; filter.frequency.value = cutoff; filter.Q.value = .4;
    high.type = 'highpass'; high.frequency.value = 170; high.Q.value = .5;
    timber.type = 'sine'; timber.frequency.value = 190 + this.fireRandom() * 220; partial.gain.value = .13;
    const attack = .012 + this.fireRandom() * .012;
    envelope.gain.setValueAtTime(0, at); envelope.gain.linearRampToValueAtTime(level, at + attack);
    envelope.gain.exponentialRampToValueAtTime(.00001, at + duration); envelope.gain.linearRampToValueAtTime(0, at + duration + .02);
    source.connect(high); high.connect(filter); filter.connect(envelope); envelope.connect(this.effects!);
    timber.connect(partial); partial.connect(envelope);
    this.track({ sources: [source, timber], nodes: [source, high, filter, envelope, timber, partial], bus: 'fire' }, at, duration + .04, this.fireRandom());
  }

  private note(midi: number, at: number, duration: number, level: number, bus: Bus, pad = false) {
    const context = this.context!, envelope = context.createGain(), filter = context.createBiquadFilter();
    envelope.gain.value = 0;
    const fundamental = context.createOscillator(), overtone = context.createOscillator(), partial = context.createGain();
    fundamental.type = pad ? 'sine' : 'triangle'; fundamental.frequency.value = frequency(midi);
    overtone.type = 'sine'; overtone.frequency.value = frequency(midi) * (pad ? 2 : 2.002); partial.gain.value = pad ? .11 : .19;
    filter.type = 'lowpass'; filter.frequency.value = pad ? 1050 : 2300; filter.Q.value = .4;
    fundamental.connect(filter); overtone.connect(partial); partial.connect(filter); filter.connect(envelope);
    envelope.connect(bus === 'music' ? this.music! : this.effects!);
    envelope.gain.setValueAtTime(.0001, at);
    envelope.gain.linearRampToValueAtTime(level, at + (pad ? .65 : .009));
    if (!pad) envelope.gain.exponentialRampToValueAtTime(level * .38, at + .22);
    envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
    this.track({ sources: [fundamental, overtone], nodes: [fundamental, overtone, partial, filter, envelope], bus }, at, duration + .04);
  }

  private wood(at: number, start: number, end: number, duration: number, level: number) {
    const context = this.context!, source = context.createOscillator(), envelope = context.createGain();
    envelope.gain.value = 0;
    source.type = 'sine'; source.frequency.setValueAtTime(start, at); source.frequency.exponentialRampToValueAtTime(end, at + duration);
    envelope.gain.setValueAtTime(.0001, at); envelope.gain.linearRampToValueAtTime(level, at + .007); envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
    source.connect(envelope); envelope.connect(this.effects!);
    this.track({ sources: [source], nodes: [source, envelope], bus: 'effect' }, at, duration + .02);
  }

  private noiseVoice(at: number, duration: number, cutoff: number, level: number, band = false) {
    const context = this.context!, source = context.createBufferSource(), filter = context.createBiquadFilter(), envelope = context.createGain();
    // Future noise starts must begin silent, not at GainNode's default unity
    // before the first automation sample; otherwise ignition gets a hard tick.
    envelope.gain.value = 0;
    source.buffer = this.noise!; filter.type = band ? 'bandpass' : 'lowpass'; filter.frequency.value = cutoff; filter.Q.value = .65;
    envelope.gain.setValueAtTime(.0001, at); envelope.gain.linearRampToValueAtTime(level, at + Math.min(.025, duration * .2)); envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
    source.connect(filter); filter.connect(envelope); envelope.connect(this.effects!);
    this.track({ sources: [source], nodes: [source, filter, envelope], bus: 'effect' }, at, duration + .02);
  }

  private track(voice: Voice, at: number, duration: number, offset = 0) {
    if (this.voices.size >= 40) this.release(this.voices.values().next().value!);
    this.voices.add(voice);
    let remaining = voice.sources.length;
    for (const source of voice.sources) {
      source.onended = () => { if (--remaining === 0) this.release(voice); };
      if (source instanceof AudioBufferSourceNode) source.start(at, offset); else source.start(at);
      if (Number.isFinite(duration)) source.stop(at + duration);
    }
  }

  private release(voice: Voice) {
    if (!this.voices.delete(voice)) return;
    if (voice === this.fireVoice) { this.fireVoice = undefined; this.fireGain = undefined; }
    for (const kind of ['sink', 'stove'] as const) if (this.applianceLoops[kind]?.voice === voice) delete this.applianceLoops[kind];
    voice.sources.forEach(source => { source.onended = null; try { source.stop(); } catch { /* Already ended. */ } });
    voice.nodes.forEach(node => node.disconnect());
  }
  private stopVoices(bus?: Bus) { for (const voice of this.voices) if (!bus || voice.bus === bus) this.release(voice); }
  private stopTimer() { clearInterval(this.timer); this.timer = undefined; }
}
