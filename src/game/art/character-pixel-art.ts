import { RESIDENT_RASTER_DATA } from './resident-raster-data';
import { characterPalette, type ResidentAppearance, type Ramp } from './character-palette';
import type { CharacterLook } from './character-look';

export type CharacterRaster = { pixels: Uint8ClampedArray; materials: Uint8Array };
export type PixelMask = (x: number, y: number, material: number) => boolean;
export const nativeIndex = (x: number, y: number) => y * 32 + x;
export const emptyRaster = (): CharacterRaster => ({ pixels: new Uint8ClampedArray(32 * 48 * 4), materials: new Uint8Array(32 * 48) });
const decoded = new Map<string, CharacterRaster>();

/** Decode measured native raster masters once; callers only receive copies. */
export function rasterSource(name: string): CharacterRaster {
  let source = decoded.get(name);
  if (!source) {
    const data = RESIDENT_RASTER_DATA[name];
    if (!data) throw new Error(`Unknown resident raster: ${name}`);
    source = { pixels: Uint8ClampedArray.from(atob(data.pixels), c => c.charCodeAt(0)), materials: Uint8Array.from(atob(data.materials), c => c.charCodeAt(0)) };
    decoded.set(name, source);
  }
  return { pixels: source.pixels.slice(), materials: source.materials.slice() };
}

export function copyPixel(target: CharacterRaster, source: CharacterRaster, x: number, y: number, sx = x, sy = y) {
  if (x < 0 || x >= 32 || y < 0 || y >= 48 || sx < 0 || sx >= 32 || sy < 0 || sy >= 48) return;
  const from = nativeIndex(sx, sy), to = nativeIndex(x, y);
  if (!source.pixels[from * 4 + 3]) return;
  target.pixels.set(source.pixels.subarray(from * 4, from * 4 + 4), to * 4);
  target.materials[to] = source.materials[from];
}

export function overlay(target: CharacterRaster, source: CharacterRaster, mask: PixelMask = () => true) {
  for (let y = 0; y < 48; y++) for (let x = 0; x < 32; x++) if (mask(x, y, source.materials[nativeIndex(x, y)])) copyPixel(target, source, x, y);
}

/** Inverse nearest-neighbor mapping retains the painted texture on each limb. */
export function transformLayer(target: CharacterRaster, source: CharacterRaster, mask: PixelMask, map: (x: number, y: number) => readonly [number, number]) {
  for (let y = 0; y < 48; y++) for (let x = 0; x < 32; x++) {
    const [xx, yy] = map(x, y), sx = Math.round(xx), sy = Math.round(yy);
    if (sx >= 0 && sx < 32 && sy >= 0 && sy < 48 && mask(sx, sy, source.materials[nativeIndex(sx, sy)])) copyPixel(target, source, x, y, sx, sy);
  }
}

export function mirrorRaster(source: CharacterRaster): CharacterRaster {
  const target = emptyRaster();
  for (let y = 0; y < 48; y++) for (let x = 0; x < 32; x++) copyPixel(target, source, x, y, 31 - x, y);
  return target;
}

function shadedColor(ramp: Ramp, amount: number): readonly number[] {
  const t = Math.max(0, Math.min(4, amount)), low = Math.floor(t), high = Math.min(4, low + 1);
  return ramp[low].map((value, channel) => Math.round(value + (ramp[high][channel] - value) * (t - low)));
}

/** Import-time material masks and continuous ramps preserve the original fine shading. */
export function colorRaster(frame: CharacterRaster, appearance: ResidentAppearance, look: CharacterLook) {
  const palette = characterPalette(appearance, look);
  for (let p = 0; p < 32 * 48; p++) {
    const m = frame.materials[p], i = p * 4;
    const lum = frame.pixels[i] * .3 + frame.pixels[i + 1] * .59 + frame.pixels[i + 2] * .11;
    const ramp = m === 2 && look.skinTone !== 'warm' ? palette.skin : m === 3 && look.hairColor !== 'chestnut' ? palette.hair : m === 4 && appearance !== 'amber' ? palette.cloth : undefined;
    if (!ramp) continue;
    const amount = m === 2 ? (lum - 48) / 37 : m === 3 ? (lum - 17) / 25 : (lum - 18) / 27;
    frame.pixels.set(shadedColor(ramp, amount), i);
  }
}
