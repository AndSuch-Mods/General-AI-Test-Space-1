import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { doorAperture, doorNativePixels, type DoorWall } from '../src/game/art/room-architecture';

function sourceDoor() {
  const png = readFileSync(new URL('../public/art/doors-v8.png', import.meta.url));
  expect([png[24], png[25], png[28]]).toEqual([8, 6, 0]);
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20), chunks: Buffer[] = [];
  for (let at = 8; at < png.length;) {
    const size = png.readUInt32BE(at);
    if (png.toString('ascii', at + 4, at + 8) === 'IDAT') chunks.push(png.subarray(at + 8, at + 8 + size));
    at += size + 12;
  }
  const bytes = inflateSync(Buffer.concat(chunks)), stride = width * 4, data = new Uint8ClampedArray(stride * height);
  const paeth = (a: number, b: number, c: number) => {
    const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c);
    return da <= db && da <= dc ? a : db <= dc ? b : c;
  };
  for (let y = 0; y < height; y++) for (let x = 0; x < stride; x++) {
    const filter = bytes[y * (stride + 1)], index = y * stride + x;
    const a = x >= 4 ? data[index - 4] : 0, b = y ? data[index - stride] : 0, c = y && x >= 4 ? data[index - stride - 4] : 0;
    data[index] = (bytes[y * (stride + 1) + x + 1] + (filter === 0 ? 0 : filter === 1 ? a : filter === 2 ? b : filter === 3 ? Math.floor((a + b) / 2) : paeth(a, b, c))) & 255;
  }
  return { width, height, data };
}
const source = sourceDoor();
describe('registered original door frames', () => {
  it.each<DoorWall>(['north', 'west', 'east'])('%s keeps every frame pixel outside the moving leaf fixed', wall => {
    const closed = doorNativePixels(source, wall, 0), aperture = doorAperture(wall)!;
    for (const amount of [1 / 3, 2 / 3, 1]) {
      const opened = doorNativePixels(source, wall, amount); let changed = 0;
      for (let y = 0; y < closed.height; y++) for (let x = 0; x < closed.width; x++) {
        const at = (y * closed.width + x) * 4, before = closed.data.subarray(at, at + 4), after = opened.data.subarray(at, at + 4);
        if (x < aperture.x || x >= aperture.x + aperture.width || y < aperture.y || y >= aperture.y + aperture.height) expect(after).toEqual(before);
        else if (before.some((value, index) => value !== after[index])) changed++;
      }
      expect(changed).toBeGreaterThan(20);
    }
  });
  it.each<DoorWall>(['west', 'east'])('%s rectifies its jamb tops against a straight side wall', wall => {
    const door = doorNativePixels(source, wall, 0);
    const top = (x: number) => Array.from({ length: door.height }, (_, y) => y).find(y => door.data[(y * door.width + x) * 4 + 3] > 0)!;
    expect(Math.abs(top(3) - top(12))).toBeLessThanOrEqual(3);
  });
});
