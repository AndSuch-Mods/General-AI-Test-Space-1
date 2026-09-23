import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import type Phaser from 'phaser';
import { drawWindowFrame, inWindowPane, WINDOW_NATIVE, WINDOW_SOURCE } from '../src/game/art/room-window-art';
import { RoomWindowSky } from '../src/game/art/room-windows';
import { createPlayer, createWorld } from '../src/game/model';
import { baseRoomObjects, ROOM_MAPS, ROOM_SIZE } from '../src/content/room';

// Read the real approved RGBA atlas, including PNG filters, without a native canvas dependency.
function originalWindow() {
  const png = readFileSync(new URL('../public/art/room-v2-props.png', import.meta.url));
  expect([png[24], png[25], png[28]]).toEqual([8, 6, 0]);
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20), chunks: Buffer[] = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset), kind = png.toString('ascii', offset + 4, offset + 8);
    if (kind === 'IDAT') chunks.push(png.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const compressed = inflateSync(Buffer.concat(chunks)), pixels = new Uint8Array(width * height * 4), stride = width * 4;
  const paeth = (a: number, b: number, c: number) => {
    const value = a + b - c, da = Math.abs(value - a), db = Math.abs(value - b), dc = Math.abs(value - c);
    return da <= db && da <= dc ? a : db <= dc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const filter = compressed[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const at = y * stride + x, a = x >= 4 ? pixels[at - 4] : 0, b = y ? pixels[at - stride] : 0, c = y && x >= 4 ? pixels[at - stride - 4] : 0;
      pixels[at] = compressed[y * (stride + 1) + x + 1] + (filter === 0 ? 0 : filter === 1 ? a : filter === 2 ? b : filter === 3 ? Math.floor((a + b) / 2) : paeth(a, b, c));
    }
  }
  const native = new Uint8Array(WINDOW_NATIVE.width * WINDOW_NATIVE.height * 4);
  for (let y = 0; y < WINDOW_NATIVE.height; y++) for (let x = 0; x < WINDOW_NATIVE.width; x++) {
    const sx = WINDOW_SOURCE.x + Math.floor((x + .5) * WINDOW_SOURCE.width / WINDOW_NATIVE.width);
    const sy = WINDOW_SOURCE.y + Math.floor((y + .5) * WINDOW_SOURCE.height / WINDOW_NATIVE.height);
    native.set(pixels.subarray((sy * width + sx) * 4, (sy * width + sx) * 4 + 4), (y * WINDOW_NATIVE.width + x) * 4);
  }
  return native;
}
function alphaCanvas(original?: Uint8Array) {
  const alpha = new Uint8Array(WINDOW_NATIVE.width * WINDOW_NATIVE.height);
  const pixels = new Uint8Array(alpha.length * 4);
  const rect = (x: number, y: number, w: number, h: number, value: number) => {
    for (let py = y; py < y + h; py++) for (let px = x; px < x + w; px++) if (px >= 0 && py >= 0 && px < WINDOW_NATIVE.width && py < WINDOW_NATIVE.height) {
      const index = py * WINDOW_NATIVE.width + px; alpha[index] = value;
      if (!value) pixels.fill(0, index * 4, index * 4 + 4);
    }
  };
  const context = { fillStyle: '', save: () => {}, restore: () => {}, imageSmoothingEnabled: true,
    getImageData: () => ({ data: new Uint8ClampedArray(pixels) }),
    drawImage: (_source: CanvasImageSource, ...coordinates: number[]) => {
      expect(coordinates).toEqual([75, 764, 288, 302, 0, 0, 52, 80]);
      expect(context.imageSmoothingEnabled).toBe(false);
      pixels.set(original!); for (let index = 0; index < alpha.length; index++) alpha[index] = original![index * 4 + 3];
    }, fillRect: (x: number, y: number, w: number, h: number) => {
      rect(x, y, w, h, 255);
      const text = String(context.fillStyle), color = text.startsWith('#') ? [1, 3, 5].map(offset => parseInt(text.slice(offset, offset + 2), 16)) : text.match(/\d+/g)!.map(Number);
      for (let py = y; py < y + h; py++) for (let px = x; px < x + w; px++) pixels.set([...color, 255], (py * WINDOW_NATIVE.width + px) * 4);
    }, clearRect: (x: number, y: number, w: number, h: number) => rect(x, y, w, h, 0) } as unknown as CanvasRenderingContext2D;
  return { alpha, pixels, context };
}
describe('window frame and animated aperture', () => {
  it('fits the original native window at exactly twice scale, evenly around every room center', () => {
    for (const map of ROOM_MAPS) {
      const windows = baseRoomObjects(map).filter(object => object.id.startsWith('window-')).sort((a, b) => a.bounds.x - b.bounds.x);
      expect(windows, map).toHaveLength(2);
      for (const { bounds } of windows) {
        expect(bounds.width).toBe(WINDOW_NATIVE.width * 2);
        expect(bounds.height).toBe(WINDOW_NATIVE.height * 2);
        expect(bounds.y).toBe(windows[0].bounds.y);
      }
      const centers = windows.map(({ bounds }) => bounds.x + bounds.width / 2);
      expect(centers[0] + centers[1], map).toBe(ROOM_SIZE.width);
      expect(windows[0].bounds.x + windows[0].bounds.width).toBeLessThan(ROOM_SIZE.width / 2);
      expect(windows[1].bounds.x).toBeGreaterThan(ROOM_SIZE.width / 2);
    }
  });
  it('preserves every original drape, stone and mullion pixel outside the measured glass', () => {
    const original = originalWindow(), frame = alphaCanvas(original);
    drawWindowFrame(frame.context, {} as CanvasImageSource);
    let cleared = 0, preserved = 0;
    for (let y = 0; y < 80; y++) for (let x = 0; x < 52; x++) {
      const index = (y * 52 + x) * 4, source = original.subarray(index, index + 4);
      if (inWindowPane(x, y)) {
        cleared++;
        const [r, g, b, a] = source;
        // Glass contains the source's blue sky/trees or its cream moon. Never cut gray stone or velvet.
        expect(a, `${x},${y} must belong to the original window`).toBeGreaterThanOrEqual(250);
        expect(b - r >= 20 && b - g >= 15 || r > 160 && g > 160 && b > 130, `${x},${y}: ${source}`).toBe(true);
        expect(frame.alpha[y * 52 + x]).toBe(0);
      } else {
        if (source[3]) preserved++;
        expect(frame.pixels.subarray(index, index + 4)).toEqual(source);
      }
    }
    expect(cleared).toBeGreaterThan(600); expect(preserved).toBeGreaterThan(2500);
    // Both uprights, the center mullion, sill, purple drapes and upper stone tracery remain opaque.
    for (const [x, y] of [[16, 40], [25, 40], [26, 40], [35, 40], [25, 66], [8, 30], [42, 30], [23, 16]]) expect(frame.alpha[y * 52 + x]).toBeGreaterThanOrEqual(250);
  });
  it('keeps all daylight, weather and night variants within uncovered glass', () => {
    const frame = alphaCanvas(originalWindow()), sky = alphaCanvas(originalWindow()); drawWindowFrame(frame.context, {} as CanvasImageSource);
    const scene = { textures: { get: () => ({ getSourceImage: () => ({}) }), createCanvas: () => ({ context: sky.context, refresh: () => {} }) } } as unknown as Phaser.Scene;
    const view = new RoomWindowSky(scene), world = createWorld(createPlayer('Keeper'));
    let paneCount = 0;
    for (let y = 0; y < 80; y++) for (let x = 0; x < 52; x++) if (inWindowPane(x, y)) { paneCount++; expect(frame.alpha[y * 52 + x]).toBe(0); }
    expect(paneCount).toBeGreaterThan(600);
    expect(frame.alpha.filter(value => value > 0).length).toBeGreaterThan(2500);
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
  it('keeps the original sky grain and trees while removing the painted moon for daytime and clouded nights', () => {
    const sky = alphaCanvas(originalWindow());
    const scene = { textures: { get: () => ({ getSourceImage: () => ({}) }), createCanvas: () => ({ context: sky.context, refresh: () => {} }) } } as unknown as Phaser.Scene;
    const view = new RoomWindowSky(scene), world = createWorld(createPlayer('Keeper'));
    const color = (x: number, y: number) => Array.from(sky.pixels.subarray((y * 52 + x) * 4, (y * 52 + x) * 4 + 3));
    world.seed = 0; world.weather = 'clear'; world.clock.totalMinutes = 1320; view.update(world, false);
    expect(color(21, 29).every(channel => channel > 175)).toBe(true);
    const nightColors = new Set<string>();
    for (let y = 34; y <= 60; y++) for (let x = 18; x <= 24; x++) nightColors.add(color(x, y).join(','));
    expect(nightColors.size).toBeGreaterThan(100);
    world.clock.totalMinutes = 720; view.update(world, false);
    expect(Math.max(...color(21, 29))).toBeLessThan(180);
    // The removed moon matches its mirrored sky background beneath a moving
    // mist bank; the local fog phase may change a few channel values.
    for (let channel = 0; channel < 3; channel++) expect(Math.abs(color(21, 29)[channel] - color(30, 29)[channel])).toBeLessThan(12);
    world.seed = 2; world.clock.totalMinutes = 1320; view.update(world, false);
    expect(Math.max(...color(21, 29))).toBeLessThan(120);
  });
  it('animates night mist and drifting lights while reduced motion keeps the same night still', () => {
    const sky = alphaCanvas(originalWindow());
    const scene = { textures: { get: () => ({ getSourceImage: () => ({}) }), createCanvas: () => ({ context: sky.context, refresh: () => {} }) } } as unknown as Phaser.Scene;
    const view = new RoomWindowSky(scene), world = createWorld(createPlayer('Keeper'));
    world.seed = 1; world.weather = 'fog'; world.clock.totalMinutes = 1320;
    view.update(world, false); const animatedStart = sky.pixels.slice();
    world.clock.totalMinutes += 4; view.update(world, false);
    expect(sky.pixels).not.toEqual(animatedStart);
    view.update(world, true); const reducedStart = sky.pixels.slice();
    world.clock.totalMinutes += 4; view.update(world, true);
    expect(sky.pixels).toEqual(reducedStart);
  });
  it('makes clear-day mist visibly move across the glass without washing away its detail', () => {
    const sky = alphaCanvas(originalWindow());
    const scene = { textures: { get: () => ({ getSourceImage: () => ({}) }), createCanvas: () => ({ context: sky.context, refresh: () => {} }) } } as unknown as Phaser.Scene;
    const view = new RoomWindowSky(scene), world = createWorld(createPlayer('Keeper'));
    world.weather = 'clear'; world.clock.totalMinutes = 720; view.update(world, false);
    const before = sky.pixels.slice(); world.clock.totalMinutes += 4; view.update(world, false);
    let visiblyChanged = 0;
    for (let index = 0; index < sky.pixels.length; index += 4) {
      if (Math.max(...[0, 1, 2].map(channel => Math.abs(sky.pixels[index + channel] - before[index + channel]))) >= 3) visiblyChanged++;
    }
    expect(visiblyChanged).toBeGreaterThan(100);
  });
});
