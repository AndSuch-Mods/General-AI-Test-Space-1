import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { doorFrameBounds, doorFramePixels, doorLeafGeometry, doorNativePixels, type DoorWall } from '../src/game/art/room-architecture';

function sourceDoor() {
  const png = readFileSync(new URL('../public/art/door-parts-v10.png', import.meta.url));
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
  it.each<DoorWall>(['north', 'west', 'south', 'east'])('%s retains fixed exposed jambs while its separate leaf moves', wall => {
    const frame = doorFramePixels(source, wall);
    for (const amount of [0, 1 / 3, 2 / 3, 1]) {
      const opened = doorNativePixels(source, wall, amount), leaf = doorLeafGeometry(wall, amount);
      const determinant = leaf.along.x * leaf.down.y - leaf.along.y * leaf.down.x;
      const knob = { x: leaf.origin.x + leaf.along.x * .9 + leaf.down.x * .55, y: leaf.origin.y + leaf.along.y * .9 + leaf.down.y * .55 };
      let exposed = 0;
      for (let y = 0; y < frame.height; y++) for (let x = 0; x < frame.width; x++) {
        const dx = x + .5 - leaf.origin.x, dy = y + .5 - leaf.origin.y;
        const u = (dx * leaf.down.y - dy * leaf.down.x) / determinant, v = (leaf.along.x * dy - leaf.along.y * dx) / determinant;
        if (u >= 0 && u < 1 && v >= 0 && v < 1 || Math.hypot(x - knob.x, y - knob.y) < 6) continue;
        const at = (y * frame.width + x) * 4;
        expect(opened.data.subarray(at, at + 4)).toEqual(frame.data.subarray(at, at + 4));
        if (frame.data[at + 3]) exposed++;
      }
      expect(exposed).toBeGreaterThan(15);
    }
  });
  it.each<DoorWall>(['west', 'east'])('%s places upright posts and swings a full face downward into the room', wall => {
    const door = doorFramePixels(source, wall), bounds = doorFrameBounds(wall);
    const top = (x: number) => Array.from({ length: door.height }, (_, y) => y).find(y => door.data[(y * door.width + x) * 4 + 3] > 0)!;
    expect(top(bounds.x)).toBe(top(bounds.x + bounds.width - 1));
    expect(bounds.width).toBe(8);
    const closed = doorLeafGeometry(wall, 0), opened = doorLeafGeometry(wall, 1);
    expect(opened.origin.x).toEqual(closed.origin.x);
    expect(closed.along.y).toBe(0); expect(Math.abs(closed.along.x)).toBe(2);
    expect(closed.down.x).toBe(0);
    expect(Math.abs(opened.along.x)).toBe(36);
  });
  it('keeps the south leaf full length and the north open knob outside the left jamb', () => {
    expect(doorFrameBounds('south').height).toBe(9);
    for (const amount of [0, 1 / 3, 2 / 3, 1]) {
      const leaf = doorLeafGeometry('south', amount);
      expect(Math.hypot(leaf.along.x, leaf.along.y)).toBeCloseTo(33);
    }
    const north = doorLeafGeometry('north', 1);
    expect(north.origin.x + north.along.x).toBeLessThan(doorFrameBounds('north').x);
  });
  it('retains visible brass hardware on every wall in every opening pose', () => {
    for (const wall of ['north', 'west', 'south', 'east'] as DoorWall[]) for (const amount of [0, 1 / 3, 2 / 3, 1]) {
      const { data } = doorNativePixels(source, wall, amount); let brass = 0;
      for (let at = 0; at < data.length; at += 4) if (data[at] > 190 && data[at + 1] > 130 && data[at + 2] < 120 && data[at + 3]) brass++;
      expect(brass, `${wall}/${amount}`).toBeGreaterThan(0);
    }
  });
});
