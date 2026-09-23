import type { RoomMap } from '../content/room';
export type HouseholdCue = 'step' | 'open' | 'close' | 'paper' | 'ignite' | 'extinguish' | 'door' | 'place' | 'sleep' | 'wake' | 'disturbed' | 'ui';
export type HouseholdSoundScene = { map: RoomMap; night: boolean; hearth: boolean };
type Bus = 'music' | 'effect' | 'fire';
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
  private fireSeed = 0x6e6d6265;
  private voices = new Set<Voice>();
  private timer?: ReturnType<typeof setInterval>;
  private enabled = true;
  private musicEnabled = true;
  private unlocked = false;
  private disposed = false;
  private lifecycle = 0;
  private scene: HouseholdSoundScene = { map: 'castle', night: true, hearth: false };
  private nextNote = 0;
  private nextCrackle = 0;
  private scoreStep = 0;
  private cueStep = 0;
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
    this.master!.gain.setTargetAtTime(.48, context.currentTime, .04);
    this.start();
  }

  setEnabled(enabled: boolean) {
    this.lifecycle++;
    this.enabled = enabled;
    if (!this.context || this.disposed) return;
    this.master!.gain.cancelScheduledValues(this.context.currentTime);
    this.master!.gain.setTargetAtTime(enabled ? .48 : 0, this.context.currentTime, .02);
    if (!enabled) { this.stopTimer(); this.stopVoices(); }
    else if (this.unlocked && this.context.state === 'running' && !document.hidden) this.start();
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!this.context || this.disposed) return;
    this.music!.gain.setTargetAtTime(enabled ? .32 : 0, this.context.currentTime, .08);
    if (!enabled) this.stopVoices('music');
    this.scoreStep -= this.scoreStep % 8;
    this.nextNote = this.context.currentTime + .1;
  }

  setScene(scene: HouseholdSoundScene) {
    if (scene.map === this.scene.map && scene.night === this.scene.night && scene.hearth === this.scene.hearth) return;
    this.scene = { ...scene };
    if (!this.context || this.disposed) return;
    this.roomFilter!.frequency.setTargetAtTime(scene.map === 'landing' ? 1650 : scene.night ? 2400 : 3300, this.context.currentTime, 1.2);
    this.updateFire();
  }

  cue(name: HouseholdCue) {
    if (!this.canPlay()) return;
    const now = this.context!.currentTime;
    if (now - (this.lastCue.get(name) ?? -1) < (name === 'step' ? .12 : .07)) return;
    this.lastCue.set(name, now); this.cueStep++;
    const tone = (start: number, end: number, length: number, gain: number, delay = 0) => this.wood(now + delay, start, end, length, gain);
    const rustle = (length: number, cutoff: number, gain: number, delay = 0, band = false) => this.noiseVoice(now + delay, length, cutoff, gain, band);
    switch (name) {
      case 'step': tone(this.cueStep % 2 ? 108 : 94, 46, .13, .055); rustle(.095, 720, .033); break;
      case 'open': tone(230, 145, .24, .043); rustle(.24, 650, .06, 0, true); tone(90, 42, .12, .052, .16); break;
      case 'close': tone(103, 37, .22, .09); rustle(.07, 920, .072); break;
      case 'paper': rustle(.13, 2100, .047, 0, true); rustle(.18, 3100, .033, .1, true); break;
      case 'ignite': rustle(.78, 720, .088); rustle(.34, 1700, .038, .16, true); break;
      case 'extinguish': rustle(.5, 1500, .045, 0, true); break;
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
  }

  private canPlay() { return !this.disposed && this.enabled && this.unlocked && !document.hidden && this.context?.state === 'running'; }

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
    this.setScene(this.scene);
  }

  private start() {
    if (this.timer || !this.canPlay()) return;
    this.nextNote = this.context!.currentTime + .08;
    this.nextCrackle = this.context!.currentTime + .8;
    this.scoreStep -= this.scoreStep % 8;
    this.updateFire();
    this.timer = setInterval(() => this.schedule(), 100);
    this.schedule();
  }

  private schedule() {
    if (!this.canPlay()) { this.stopTimer(); return; }
    const now = this.context!.currentTime;
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
      // Soft, irregular ember releases sit inside a continuous air/wood bed.
      // Every burst gets fresh buffer position, cutoff, attack and decay.
      this.ember(now + .02, .13 + this.fireRandom() * .3, 680 + this.fireRandom() * 1350, .017 + this.fireRandom() * .017);
      this.nextCrackle = now + .45 + this.fireRandom() * 1.8;
    }
  }

  private fireRandom() {
    let seed = this.fireSeed; seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; this.fireSeed = seed;
    return (seed >>> 0) / 4294967296;
  }

  private buildFireBed(context: AudioContext) {
    // Low sample rate saves mobile memory; the final low-pass removes bright fizz.
    const rate = 24000, duration = 7.3, length = Math.round(rate * duration);
    const buffer = context.createBuffer(2, length, rate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let low = 0, mid = 0;
      for (let i = 0; i < length; i++) {
        const white = this.fireRandom() * 2 - 1;
        low = low * .993 + white * .007; mid = mid * .947 + white * .053;
        const phase = i / length * Math.PI * 2;
        const breath = .8 + .12 * Math.sin(phase * 2 + channel * .4) + .08 * Math.sin(phase * 5 + 1.7);
        const hiss = .023 * (.7 + .3 * Math.sin(phase * 7 + .8));
        data[i] = (low * 3.7 + mid * .65) * breath + (white - mid) * hiss;
      }
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

  private updateFire() {
    if (!this.context) return;
    const audible = this.canPlay() && this.scene.hearth && this.scene.map !== 'landing';
    if (!audible) {
      const voice = this.fireVoice, gain = this.fireGain;
      this.fireVoice = undefined; this.fireGain = undefined; this.nextCrackle = 0;
      if (voice && gain) {
        const now = this.context.currentTime;
        const held = .19 * Math.min(1, Math.max(0, now - this.fireStartedAt) / 1.3);
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
    source.loopStart = .35; source.loopEnd = 7.3;
    high.type = 'highpass'; high.frequency.value = 55; high.Q.value = .5;
    low.type = 'lowpass'; low.frequency.value = 2300; low.Q.value = .4;
    source.connect(high); high.connect(low); low.connect(gain); gain.connect(this.effects!);
    gain.gain.setValueAtTime(0, context.currentTime); gain.gain.linearRampToValueAtTime(.19, context.currentTime + 1.3);
    this.fireStartedAt = context.currentTime;
    this.fireVoice = { sources: [source], nodes: [source, high, low, gain], bus: 'fire' }; this.fireGain = gain;
    this.track(this.fireVoice, context.currentTime, Infinity); this.nextCrackle = context.currentTime + .8;
  }

  private ember(at: number, duration: number, cutoff: number, level: number) {
    const context = this.context!, source = context.createBufferSource(), filter = context.createBiquadFilter(), high = context.createBiquadFilter(), envelope = context.createGain();
    source.buffer = this.noise!;
    filter.type = 'lowpass'; filter.frequency.value = cutoff; filter.Q.value = .4;
    high.type = 'highpass'; high.frequency.value = 230; high.Q.value = .5;
    const attack = .028 + this.fireRandom() * .03;
    envelope.gain.setValueAtTime(0, at); envelope.gain.linearRampToValueAtTime(level, at + attack);
    envelope.gain.exponentialRampToValueAtTime(.00001, at + duration); envelope.gain.linearRampToValueAtTime(0, at + duration + .02);
    source.connect(high); high.connect(filter); filter.connect(envelope); envelope.connect(this.effects!);
    this.track({ sources: [source], nodes: [source, high, filter, envelope], bus: 'fire' }, at, duration + .04, this.fireRandom());
  }

  private note(midi: number, at: number, duration: number, level: number, bus: Bus, pad = false) {
    const context = this.context!, envelope = context.createGain(), filter = context.createBiquadFilter();
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
    source.type = 'sine'; source.frequency.setValueAtTime(start, at); source.frequency.exponentialRampToValueAtTime(end, at + duration);
    envelope.gain.setValueAtTime(.0001, at); envelope.gain.linearRampToValueAtTime(level, at + .007); envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
    source.connect(envelope); envelope.connect(this.effects!);
    this.track({ sources: [source], nodes: [source, envelope], bus: 'effect' }, at, duration + .02);
  }

  private noiseVoice(at: number, duration: number, cutoff: number, level: number, band = false) {
    const context = this.context!, source = context.createBufferSource(), filter = context.createBiquadFilter(), envelope = context.createGain();
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
    voice.sources.forEach(source => { source.onended = null; try { source.stop(); } catch { /* Already ended. */ } });
    voice.nodes.forEach(node => node.disconnect());
  }
  private stopVoices(bus?: Bus) { for (const voice of this.voices) if (!bus || voice.bus === bus) this.release(voice); }
  private stopTimer() { clearInterval(this.timer); this.timer = undefined; }
}
