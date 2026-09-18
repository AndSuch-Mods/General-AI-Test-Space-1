import { describe, expect, it } from 'vitest';
import { recolorResidentPixels } from '../src/game/art/resident-appearance';

const index = (x: number, y: number) => (y * 32 + x) * 4;
const at = (pixels: Uint8ClampedArray, x: number, y: number) => Array.from(pixels.slice(index(x, y), index(x, y) + 4));
const set = (pixels: Uint8ClampedArray, x: number, y: number, color: number[]) => pixels.set(color, index(x, y));

describe('resident garment palette', () => {
  it('changes the coat while preserving the same brown in hair, boots and protected hands', () => {
    const pixels = new Uint8ClampedArray(32 * 48 * 4);
    const brown = [92, 65, 47, 255];
    for (const [x, y] of [[12, 25], [12, 8], [14, 44], [9, 31]]) set(pixels, x, y, brown);
    recolorResidentPixels(pixels, 'down-idle', 'moss');
    expect(at(pixels, 12, 25)).not.toEqual(brown);
    for (const [x, y] of [[12, 8], [14, 44], [9, 31]]) expect(at(pixels, x, y)).toEqual(brown);
  });

  it('preserves skin, shirt, scarf, trousers, transparency and outline inside the torso band', () => {
    const pixels = new Uint8ClampedArray(32 * 48 * 4);
    const colors = [[220, 160, 107, 255], [196, 179, 147, 255], [166, 109, 34, 255], [49, 48, 53, 255], [92, 65, 47, 0], [28, 20, 24, 255]];
    colors.forEach((color, offset) => set(pixels, 12 + offset, 25, color));
    const before = pixels.slice();
    recolorResidentPixels(pixels, 'down-idle', 'violet');
    expect(pixels).toEqual(before);
  });

  it('keeps amber exact and provides distinct green and violet cloth', () => {
    const pixels = new Uint8ClampedArray(32 * 48 * 4);
    set(pixels, 12, 25, [92, 65, 47, 255]);
    const amber = pixels.slice(), moss = pixels.slice(), violet = pixels.slice();
    recolorResidentPixels(amber, 'up-idle', 'amber');
    recolorResidentPixels(moss, 'up-idle', 'moss');
    recolorResidentPixels(violet, 'up-idle', 'violet');
    expect(amber).toEqual(pixels);
    expect(at(moss, 12, 25)[1]).toBeGreaterThan(at(moss, 12, 25)[0]);
    expect(at(violet, 12, 25)[2]).toBeGreaterThan(at(violet, 12, 25)[1]);
    expect(moss).not.toEqual(violet);
  });

  it('rejects a wrong frame or native grid instead of coloring an unrelated texture', () => {
    expect(() => recolorResidentPixels(new Uint8ClampedArray(4), 'down-idle', 'moss')).toThrow(/32 by 48/);
    expect(() => recolorResidentPixels(new Uint8ClampedArray(32 * 48 * 4), 'missing', 'moss')).toThrow(/Unknown resident frame/);
  });
});
