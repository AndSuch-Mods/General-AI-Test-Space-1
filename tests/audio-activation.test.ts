import { afterEach, describe, expect, it, vi } from 'vitest';
import { HouseholdAudio } from '../src/audio/household-audio';

function audioHarness() {
  vi.stubGlobal('document', Object.assign(new EventTarget(), { hidden: false }));
  vi.stubGlobal('window', new EventTarget());
  const pending: (() => void)[] = [];
  const context = { state: 'suspended', currentTime: 1,
    resume: vi.fn(() => new Promise<void>(resolve => pending.push(() => { context.state = 'running'; resolve(); }))),
    suspend: vi.fn(async () => { context.state = 'suspended'; }), close: vi.fn(async () => {}) };
  const audio = new HouseholdAudio();
  const internals = audio as unknown as { context: unknown; master: unknown; start: () => void; stopTimer: () => void; stopVoices: () => void };
  internals.context = context;
  internals.master = { gain: { cancelScheduledValues: vi.fn(), setTargetAtTime: vi.fn() } };
  internals.start = vi.fn(); internals.stopTimer = vi.fn(); internals.stopVoices = vi.fn();
  return { audio, context, pending, internals };
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

function clockHarness() {
  vi.useFakeTimers();
  vi.stubGlobal('document', Object.assign(new EventTarget(), { hidden: false }));
  vi.stubGlobal('window', new EventTarget());
  const finite = (time: number) => { if (!Number.isFinite(time) || time < 0) throw Error('The provided value is non-finite'); };
  const parameter = () => ({ value: 0, cancelScheduledValues: vi.fn(finite),
    setTargetAtTime: vi.fn((_value: number, time: number) => finite(time)),
    setValueAtTime: vi.fn((_value: number, time: number) => finite(time)),
    linearRampToValueAtTime: vi.fn((_value: number, time: number) => finite(time)) });
  const node = () => ({ connect: vi.fn(), disconnect: vi.fn() });
  const gain = () => ({ ...node(), gain: parameter() });
  const filter = () => ({ ...node(), frequency: parameter(), Q: parameter() });
  class Source {
    connect = vi.fn(); disconnect = vi.fn();
    start = vi.fn(finite); stop = vi.fn((time = 0) => finite(time));
    onended: (() => void) | null = null;
  }
  vi.stubGlobal('AudioBufferSourceNode', Source);
  const sources: Source[] = [];
  const context = { state: 'running', currentTime: 1,
    resume: vi.fn(async () => { context.state = 'running'; }),
    suspend: vi.fn(async () => { context.state = 'suspended'; }), close: vi.fn(async () => {}),
    createGain: gain, createBiquadFilter: filter,
    createBufferSource: () => { const source = new Source(); sources.push(source); return source; },
  };
  const master = gain(), music = gain(), roomFilter = filter();
  const note = vi.fn((_midi: number, at: number) => finite(at));
  const wood = vi.fn(finite), noiseVoice = vi.fn(finite), ember = vi.fn(finite);
  const audio = new HouseholdAudio();
  Object.assign(audio, { context, master, music, effects: node(), roomFilter, note, wood, noiseVoice, ember });
  return { audio, context, master, music, roomFilter, note, wood, noiseVoice, sources };
}

describe('audio gesture activation', () => {
  it('ignores an old resume after mute without suspending a later enabling gesture', async () => {
    const { audio, context, pending, internals } = audioHarness();
    const oldGesture = audio.unlock();
    audio.setEnabled(false);
    audio.setEnabled(true);
    const enablingGesture = audio.unlock();
    pending[1](); await enablingGesture;
    expect(internals.start).toHaveBeenCalledTimes(1);
    pending[0](); await oldGesture;
    expect(context.suspend).not.toHaveBeenCalled();
    expect(internals.start).toHaveBeenCalledTimes(1);
    expect(context.state).toBe('running'); audio.destroy();
  });

  it('resumes a suspended context for each explicit re-enable gesture and does not autoplay from preferences', async () => {
    const { audio, context, pending, internals } = audioHarness();
    audio.setEnabled(true); expect(context.resume).not.toHaveBeenCalled();
    for (let cycle = 0; cycle < 2; cycle++) {
      audio.setEnabled(false); audio.suspend();
      // Pointer-down and capture click precede the checkbox's enabled change.
      await audio.unlock(); expect(context.state).toBe('suspended');
      audio.setEnabled(true);
      const enabled = audio.unlock(); pending[cycle](); await enabled;
      expect(context.state).toBe('running');
    }
    expect(context.resume).toHaveBeenCalledTimes(2);
    expect(internals.start).toHaveBeenCalledTimes(2); audio.destroy();
  });

  it('cannot restart voices after an in-flight gesture is cancelled by hiding or muting', async () => {
    const { audio, pending, internals } = audioHarness();
    const gesture = audio.unlock(); audio.suspend(); audio.setEnabled(false);
    pending[0](); await gesture;
    expect(internals.start).not.toHaveBeenCalled(); audio.destroy();
  });
});

describe('audio clock recovery', () => {
  it.each([NaN, Infinity, -Infinity, -1])('defers public scheduling at %s and restores the latest scene and gains once finite', async clock => {
    const { audio, context, master, music, roomFilter, note, wood, sources } = clockHarness();
    try {
      context.currentTime = clock;
      await audio.unlock();
      const scene = { map: 'kitchen', night: false, hearth: true } as const;
      expect(() => {
        audio.setScene(scene); audio.cue('step'); audio.setMusicEnabled(false);
        audio.setEnabled(false); audio.setEnabled(true); audio.setMusicEnabled(true);
        vi.advanceTimersByTime(300);
      }).not.toThrow();
      expect(roomFilter.frequency.setTargetAtTime).not.toHaveBeenCalled();
      expect(note).not.toHaveBeenCalled(); expect(wood).not.toHaveBeenCalled(); expect(sources).toHaveLength(0);
      expect(vi.getTimerCount()).toBe(1);
      context.currentTime = 3;
      audio.setScene(scene); // Equal scene state must not strand the deferred update.
      vi.advanceTimersByTime(100);
      expect(master.gain.setTargetAtTime).toHaveBeenLastCalledWith(.48, 3, .04);
      expect(music.gain.setTargetAtTime).toHaveBeenLastCalledWith(.32, 3, .08);
      expect(roomFilter.frequency.setTargetAtTime).toHaveBeenLastCalledWith(3300, 3, 1.2);
      expect(note).toHaveBeenCalled(); expect(sources).toHaveLength(1); expect(sources[0].start).toHaveBeenCalledWith(3, 0);
      expect(wood).not.toHaveBeenCalled(); // Old one-shot cues are dropped, not replayed.
      audio.cue('step'); expect(wood).toHaveBeenCalled();
    } finally { audio.destroy(); }
    expect(vi.getTimerCount()).toBe(0);
  });

  it('mutes immediately during a bad clock and does not restart after suspension without another gesture', async () => {
    const { audio, context, master, music, note, sources } = clockHarness();
    try {
      audio.setScene({ map: 'castle', night: true, hearth: true }); await audio.unlock();
      expect(sources).toHaveLength(1);
      const notes = note.mock.calls.length;
      context.currentTime = NaN;
      audio.setMusicEnabled(false); audio.setEnabled(false); audio.suspend();
      expect(master.gain.value).toBe(0); expect(music.gain.value).toBe(0);
      expect(sources[0].stop).toHaveBeenCalled(); expect(sources[0].disconnect).toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
      context.currentTime = 5; audio.setEnabled(true); vi.advanceTimersByTime(500);
      expect(note).toHaveBeenCalledTimes(notes); expect(sources).toHaveLength(1);
      await audio.unlock();
      expect(sources).toHaveLength(2); expect(note).toHaveBeenCalledTimes(notes);
      expect(music.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 5, .08);
    } finally { audio.destroy(); }
  });

  it('pauses an already-running scheduler through an invalid clock without scheduling NaN voices', async () => {
    const { audio, context, note, sources } = clockHarness();
    try {
      await audio.unlock(); const notes = note.mock.calls.length;
      context.currentTime = NaN; audio.setScene({ map: 'castle', night: true, hearth: true });
      vi.advanceTimersByTime(1000);
      expect(note).toHaveBeenCalledTimes(notes); expect(sources).toHaveLength(0); expect(vi.getTimerCount()).toBe(1);
      context.currentTime = 8; vi.advanceTimersByTime(100);
      expect(note.mock.calls.length).toBeGreaterThan(notes); expect(sources).toHaveLength(1);
      expect(sources[0].start).toHaveBeenCalledWith(8, 0);
    } finally { audio.destroy(); }
  });

  it('still surfaces unrelated audio errors instead of swallowing every scheduling failure', () => {
    const { audio, roomFilter } = clockHarness();
    try {
      roomFilter.frequency.setTargetAtTime.mockImplementationOnce(() => { throw Error('Broken audio node'); });
      expect(() => audio.setScene({ map: 'landing', night: false, hearth: false })).toThrow('Broken audio node');
    } finally { audio.destroy(); }
  });
});
