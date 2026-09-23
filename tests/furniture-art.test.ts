import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { drawFurniture, furnitureArt, type ArtTurn, type FurnitureSources } from '../src/game/art/room-furniture';
import { ROOM_FRAMES } from '../src/game/art/room-atlas';
import { getRoomObjects, ROOM_MAPS, type FurnitureId } from '../src/content/room';

type Raster = { width: number; height: number; pixels: Uint8ClampedArray };
function decode(name: string): Raster {
  const png = readFileSync(new URL('../public/art/' + name, import.meta.url));
  expect(png[24]).toBe(8); expect([2, 6]).toContain(png[25]); expect(png[28]).toBe(0);
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20), bpp = png[25] === 6 ? 4 : 3, chunks: Buffer[] = [];
  for (let offset = 8; offset < png.length;) {
    const size = png.readUInt32BE(offset);
    if (png.toString('ascii', offset + 4, offset + 8) === 'IDAT') chunks.push(png.subarray(offset + 8, offset + 8 + size));
    offset += size + 12;
  }
  const packed = inflateSync(Buffer.concat(chunks)), stride = width * bpp, raw = new Uint8Array(stride * height);
  const paeth = (a: number, b: number, c: number) => { const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c); return da <= db && da <= dc ? a : db <= dc ? b : c; };
  for (let y = 0; y < height; y++) {
    const filter = packed[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const index = y * stride + x, a = x >= bpp ? raw[index - bpp] : 0, b = y ? raw[index - stride] : 0, c = y && x >= bpp ? raw[index - stride - bpp] : 0;
      raw[index] = packed[y * (stride + 1) + x + 1] + (filter === 0 ? 0 : filter === 1 ? a : filter === 2 ? b : filter === 3 ? Math.floor((a + b) / 2) : paeth(a, b, c));
    }
  }
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let p = 0; p < width * height; p++) { pixels.set(raw.subarray(p * bpp, p * bpp + 3), p * 4); pixels[p * 4 + 3] = bpp === 4 ? raw[p * bpp + 3] : 255; }
  return { width, height, pixels };
}

// Minimal nearest-neighbor raster canvas exercises real source sampling without a native dependency.
class PixelCanvas {
  width = 0; height = 0; private bytes = new Uint8ClampedArray();
  get pixels() { if (this.bytes.length !== this.width * this.height * 4) this.bytes = new Uint8ClampedArray(this.width * this.height * 4); return this.bytes; }
  getContext() { return pixelContext(this); }
}
function pixelContext(canvas: PixelCanvas) {
    return {
      imageSmoothingEnabled: false, fillStyle: '#000000',
      drawImage(source: Raster, ...v: number[]) {
        const [sx, sy, sw, sh, dx, dy, dw, dh] = v.length === 8 ? v : v.length === 4 ? [0, 0, source.width, source.height, ...v] : [0, 0, source.width, source.height, v[0], v[1], source.width, source.height];
        for (let y = Math.ceil(dy); y < dy + dh; y++) for (let x = Math.ceil(dx); x < dx + dw; x++) {
          if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) continue;
          const px = sx + Math.floor((x - dx + .5) * sw / dw), py = sy + Math.floor((y - dy + .5) * sh / dh), at = (py * source.width + px) * 4;
          if (source.pixels[at + 3]) canvas.pixels.set(source.pixels.subarray(at, at + 4), (y * canvas.width + x) * 4);
        }
      },
      getImageData(x: number, y: number, width: number, height: number) {
        const data = new Uint8ClampedArray(width * height * 4);
        for (let py = 0; py < height; py++) for (let px = 0; px < width; px++) data.set(canvas.pixels.subarray(((y + py) * canvas.width + x + px) * 4, ((y + py) * canvas.width + x + px) * 4 + 4), (py * width + px) * 4);
        return { data, width, height };
      },
      putImageData(image: { data: Uint8ClampedArray; width: number; height: number }, x: number, y: number) {
        for (let py = 0; py < image.height; py++) for (let px = 0; px < image.width; px++) canvas.pixels.set(image.data.subarray((py * image.width + px) * 4, (py * image.width + px) * 4 + 4), ((y + py) * canvas.width + x + px) * 4);
      },
      clearRect(x: number, y: number, width: number, height: number) { for (let py = Math.ceil(y); py < y + height; py++) for (let px = Math.ceil(x); px < x + width; px++) canvas.pixels.fill(0, (py * canvas.width + px) * 4, (py * canvas.width + px) * 4 + 4); },
      fillRect(x: number, y: number, width: number, height: number) {
        const color = [1, 3, 5].map(p => parseInt(this.fillStyle.slice(p, p + 2), 16));
        for (let py = Math.ceil(y); py < y + height; py++) for (let px = Math.ceil(x); px < x + width; px++) if (px >= 0 && py >= 0 && px < canvas.width && py < canvas.height) canvas.pixels.set([...color, 255], (py * canvas.width + px) * 4);
      },
    };
}
const original = decode('room-v2-props.png'), beds = decode('furniture-v8-beds.png');
const sources = { original, beds } as unknown as FurnitureSources;
function rendered(id: string, turn: ArtTurn = 0, part: 'full' | 'base' | 'foreground' = 'full', opening = 0) {
  vi.stubGlobal('document', { createElement: () => new PixelCanvas() });
  const art = furnitureArt(id, turn)!, canvas = new PixelCanvas(); canvas.width = art.nativeWidth; canvas.height = art.nativeHeight;
  drawFurniture(canvas.getContext() as unknown as CanvasRenderingContext2D, id, turn, part, opening, sources); return canvas;
}
afterEach(() => vi.unstubAllGlobals());

describe('approved furniture source and directional geometry', () => {
  it('preserves the approved source file and every sampled front furniture pixel', () => {
    expect(createHash('sha256').update(readFileSync(new URL('../public/art/room-v2-props.png', import.meta.url))).digest('hex')).toBe('5d0172ab780da328e9b4d1c0b9ed49e4ab3fbf8c7d7799a6956192cca1ed7ea9');
    for (const id of ['bed', 'desk', 'bookshelf', 'pantry', 'chest', 'side-table']) {
      const actual = rendered(id), frame = ROOM_FRAMES.find(f => f.name === id)!;
      for (let y = 0; y < actual.height; y++) for (let x = 0; x < actual.width; x++) {
        const sx = frame.x + Math.floor((x + .5) * frame.width / actual.width), sy = frame.y + Math.floor((y + .5) * frame.height / actual.height), at = (sy * original.width + sx) * 4;
        const expected = original.pixels[at + 3] ? original.pixels.subarray(at, at + 4) : new Uint8ClampedArray(4);
        expect(actual.pixels.subarray((y * actual.width + x) * 4, (y * actual.width + x) * 4 + 4), id).toEqual(expected);
      }
    }
  });
  it('matches every rotated room drawing bound without exchanging vertical elevation and floor length', () => {
    for (const map of ROOM_MAPS) for (const object of getRoomObjects(map)) for (const turn of [0, 1, 2, 3] as ArtTurn[]) {
      const art = furnitureArt(object.id, turn); if (!art) continue;
      const turned = getRoomObjects(map, { [object.id as FurnitureId]: { x: 0, y: 0, rotation: turn } }).find(o => o.id === object.id)!;
      expect({ width: art.width, height: art.height }, `${map}/${object.id}/${turn}`).toEqual({ width: turned.bounds.width, height: turned.bounds.height });
    }
    expect([furnitureArt('desk', 1)!.width, furnitureArt('desk', 1)!.height]).toEqual([48, 122]);
    expect([furnitureArt('chest', 1)!.width, furnitureArt('chest', 1)!.height]).toEqual([44, 96]);
  });
  it('splits the approved bed without losing art and leaves both sleeping faces uncovered in every view', () => {
    const full = rendered('bed'), base = rendered('bed', 0, 'base'), front = rendered('bed', 0, 'foreground');
    for (let p = 0; p < full.pixels.length; p += 4) expect(front.pixels.subarray(p, p + 4).some(Boolean) ? front.pixels.subarray(p, p + 4) : base.pixels.subarray(p, p + 4)).toEqual(full.pixels.subarray(p, p + 4));
    for (const turn of [0, 1, 2, 3] as ArtTurn[]) {
      const art = furnitureArt('bed', turn)!, foreground = rendered('bed', turn, 'foreground');
      for (const pillow of art.pillows) {
        const x = Math.round(pillow.x / 2), y = Math.round(pillow.y / 2);
        expect(foreground.pixels[(y * foreground.width + x) * 4 + 3], `pillow ${turn}/${x}/${y}`).toBe(0);
      }
    }
  });
  it('gives original front containers distinct closed, partial and open poses', () => {
    for (const id of ['chest', 'pantry', 'desk']) {
      const poses = [0, 1 / 3, 2 / 3, 1].map(amount => createHash('sha256').update(rendered(id, 0, 'full', amount).pixels).digest('hex'));
      expect(new Set(poses).size, id).toBe(4);
    }
  });
});
