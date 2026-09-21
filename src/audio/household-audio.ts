import type { RoomMap } from '../content/room';
export type HouseholdCue = 'step' | 'open' | 'close' | 'paper' | 'ignite' | 'extinguish' | 'door' | 'place' | 'sleep' | 'wake' | 'disturbed' | 'ui';
export type HouseholdSoundScene = { map: RoomMap; night: boolean; hearth: boolean };
type Bus = 'music' | 'effect';
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
  private voices = new Set<Voice>();
  private timer?: ReturnType<typeof setInterval>;
  private enabled = true;
  private musicEnabled = true;
  private unlocked = false;
  private disposed = false;
  private scene: HouseholdSoundScene = { map: 'castle', night: true, hearth: false };
  private nextNote = 0;
  private nextCrackle = 0;
  private scoreStep = 0;
  private crackleStep = 0;
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
    await context.resume();
    if (this.disposed || !this.enabled || document.hidden) { this.suspend(); return; }
    this.unlocked = true;
    this.master!.gain.setTargetAtTime(.48, context.currentTime, .04);
    this.start();
  }

  setEnabled(enabled: boolean) {
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
    if (!scene.hearth || scene.map === 'landing') this.nextCrackle = 0;
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
      case 'ignite': rustle(.08, 3200, .055, 0, true); rustle(.46, 930, .071, .07); tone(88, 176, .28, .039, .08); break;
      case 'extinguish': rustle(.32, 1700, .054, 0, true); break;
      case 'door': tone(190, 105, .46, .065); rustle(.43, 410, .078, 0, true); tone(89, 39, .19, .066, .31); break;
      case 'place': tone(151, 64, .12, .06); rustle(.065, 1150, .047); break;
      case 'disturbed': rustle(.24, 740, .048, 0, true); tone(118, 81, .23, .025, .08); break;
      case 'sleep': this.note(65, now, 1.25, .10, 'effect'); this.note(62, now + .27, 1.7, .095, 'effect'); break;
      case 'wake': this.note(62, now, 1.2, .09, 'effect'); this.note(65, now + .22, 1.4, .075, 'effect'); this.note(69, now + .48, 1.7, .067, 'effect'); break;
      case 'ui': tone(420, 285, .065, .019); break;
    }
  }

  suspend() {
    this.stopTimer(); this.stopVoices(); this.lastCue.clear();
    if (this.context && this.context.state !== 'closed') void this.context.suspend().catch(() => undefined);
  }

  destroy() {
    if (this.disposed) return;
    this.disposed = true; this.stopTimer(); this.stopVoices();
    document.removeEventListener('visibilitychange', this.hidden);
    window.removeEventListener('pagehide', this.leaving);
    this.graph.forEach(node => node.disconnect()); this.graph = [];
    if (this.context) void this.context.close().catch(() => undefined);
    this.context = undefined; this.noise = undefined;
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
    this.setScene(this.scene);
  }

  private start() {
    if (this.timer || !this.canPlay()) return;
    this.nextNote = this.context!.currentTime + .08;
    this.nextCrackle = this.context!.currentTime + .8;
    this.scoreStep -= this.scoreStep % 8;
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
    if (this.scene.hearth && this.scene.map !== 'landing' && now >= this.nextCrackle) {
      const pattern = [.7, 1.4, .9, 1.9, 1.2, .6, 1.7];
      this.noiseVoice(now + .01, .028 + this.crackleStep % 3 * .015, 1150 + this.crackleStep % 4 * 280, .018, true);
      this.nextCrackle = now + pattern[this.crackleStep % pattern.length]; this.crackleStep++;
    }
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

  private track(voice: Voice, at: number, duration: number) {
    if (this.voices.size >= 40) this.release(this.voices.values().next().value!);
    this.voices.add(voice);
    let remaining = voice.sources.length;
    for (const source of voice.sources) {
      source.onended = () => { if (--remaining === 0) this.release(voice); };
      source.start(at); source.stop(at + duration);
    }
  }

  private release(voice: Voice) {
    if (!this.voices.delete(voice)) return;
    voice.sources.forEach(source => { source.onended = null; try { source.stop(); } catch { /* Already ended. */ } });
    voice.nodes.forEach(node => node.disconnect());
  }
  private stopVoices(bus?: Bus) { for (const voice of this.voices) if (!bus || voice.bus === bus) this.release(voice); }
  private stopTimer() { clearInterval(this.timer); this.timer = undefined; }
}
