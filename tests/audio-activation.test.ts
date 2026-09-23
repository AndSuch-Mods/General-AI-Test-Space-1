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
afterEach(() => vi.unstubAllGlobals());

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
