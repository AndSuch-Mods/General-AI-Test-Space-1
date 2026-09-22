import { describe, expect, it } from 'vitest';
import type Phaser from 'phaser';
import { drawWindowFrame, inWindowPane, WINDOW_NATIVE } from '../src/game/art/room-window-art';
import { RoomWindowSky } from '../src/game/art/room-windows';
import { createPlayer, createWorld } from '../src/game/model';

function alphaCanvas() {
  const alpha = new Uint8Array(WINDOW_NATIVE.width * WINDOW_NATIVE.height);
  const rect = (x: number, y: number, w: number, h: number, value: number) => {
    for (let py = y; py < y + h; py++) for (let px = x; px < x + w; px++) if (px >= 0 && py >= 0 && px < WINDOW_NATIVE.width && py < WINDOW_NATIVE.height) alpha[py * WINDOW_NATIVE.width + px] = value;
  };
  const context = { fillStyle: '', fillRect: (x: number, y: number, w: number, h: number) => rect(x, y, w, h, 255), clearRect: (x: number, y: number, w: number, h: number) => rect(x, y, w, h, 0) } as CanvasRenderingContext2D;
  return { alpha, context };
}
describe('window frame and animated aperture', () => {
  it('keeps all daylight, weather and night variants within uncovered glass', () => {
    const frame = alphaCanvas(), sky = alphaCanvas(); drawWindowFrame(frame.context);
    const scene = { textures: { createCanvas: () => ({ context: sky.context, refresh: () => {} }) } } as unknown as Phaser.Scene;
    const view = new RoomWindowSky(scene), world = createWorld(createPlayer('Keeper'));
    let paneCount = 0;
    for (let y = 0; y < 80; y++) for (let x = 0; x < 52; x++) if (inWindowPane(x, y)) { paneCount++; expect(frame.alpha[y * 52 + x]).toBe(0); }
    expect(paneCount).toBeGreaterThan(1500);
    expect(frame.alpha.filter(value => value > 0).length).toBeGreaterThan(1000);
    for (const seed of [0, 1, 2]) for (const minute of [240, 360, 720, 1140, 1320, 1322]) for (const weather of ['clear', 'fog', 'rain'] as const) {
      world.seed = seed; world.clock.totalMinutes = minute; world.weather = weather; view.update(world, false);
      let overlaps = 0, mismatch = 0;
      for (let index = 0; index < sky.alpha.length; index++) {
        if (sky.alpha[index] && frame.alpha[index]) overlaps++;
        if ((sky.alpha[index] > 0) !== inWindowPane(index % 52, Math.floor(index / 52))) mismatch++;
      }
      expect({ overlaps, mismatch }, `${seed}:${minute}:${weather}`).toEqual({ overlaps: 0, mismatch: 0 });
    }
  });
});
