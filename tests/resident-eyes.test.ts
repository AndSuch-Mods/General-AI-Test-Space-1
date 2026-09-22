import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyResidentLook, correctResidentEyes, APPEARANCE_OPTIONS } from '../src/game/art/resident-appearance';
import { BODY_OPTIONS, DEFAULT_LOOK, HAIR_COLOR_OPTIONS, HAIR_STYLE_OPTIONS, OUTFIT_OPTIONS, SKIN_TONE_OPTIONS } from '../src/game/art/character-look';
import sourcePixels from './fixtures/resident-down-idle-rgba.json';

// Real original PNG, source crop (30,29,248,372), nearest-neighbor to32×48.
// The PNG hash prevents a changed source silently leaving this measured fixture stale.
const original = () => new Uint8ClampedArray(sourcePixels);
const pixel = (data: Uint8ClampedArray, x: number, y: number) => Array.from(data.slice((y * 32 + x) * 4, (y * 32 + x) * 4 + 4));
const eye = (data: Uint8ClampedArray, x: number) => [13, 14, 15].flatMap(y => [pixel(data, x, y), pixel(data, x + 1, y)]);
// The source art has alpha253 internally; the corrected feature is fully opaque.
const canonicalEye = eye(original(), 18).map(([r, g, b]) => [r, g, b, 255]);

describe('original resident eye correction', () => {
  it('uses the approved raster and retains its complete open eye in both positions', () => {
    const png = readFileSync(new URL('../public/art/residents-v2.png', import.meta.url));
    expect(createHash('sha256').update(png).digest('hex')).toBe('219358d84902c0514389b2aa5d6ef84bed19a554f864102d0dde1095b47bcb49');
    const pixels = original();
    expect(eye(pixels, 13)).not.toEqual(canonicalEye);
    correctResidentEyes(pixels, 'down-idle');
    expect(eye(pixels, 13)).toEqual(canonicalEye); expect(eye(pixels, 18)).toEqual(canonicalEye);
    for (const x of [14, 19]) {
      expect(pixel(pixels, x, 14).slice(0, 3).every(channel => channel > 190)).toBe(true);
      expect(pixel(pixels, x, 15).slice(0, 3).every(channel => channel > 230)).toBe(true);
    }
  });

  it('changes only the two measured eye clusters and is idempotent', () => {
    const before = original(), pixels = before.slice(); correctResidentEyes(pixels, 'down-idle');
    for (let y = 0; y < 48; y++) for (let x = 0; x < 32; x++) {
      if (y >= 13 && y <= 15 && (x === 13 || x === 14 || x === 18 || x === 19)) continue;
      expect(pixel(pixels, x, y)).toEqual(pixel(before, x, y));
    }
    const once = pixels.slice(); correctResidentEyes(pixels, 'down-idle'); expect(pixels).toEqual(once);
    for (const facing of ['right', 'up']) {
      const untouched = original(); correctResidentEyes(untouched, `${facing}-idle`); expect(untouched).toEqual(before);
    }
  });

  it('preserves equally open eyes after every body, hairstyle, hair color and skin choice', () => {
    for (const body of BODY_OPTIONS) for (const hairStyle of HAIR_STYLE_OPTIONS) for (const hairColor of HAIR_COLOR_OPTIONS) for (const skinTone of SKIN_TONE_OPTIONS) {
      const look = { ...DEFAULT_LOOK, body, hairStyle, hairColor, skinTone }, pixels = original();
      correctResidentEyes(pixels, 'down-idle'); applyResidentLook(pixels, 'down-idle', 'amber', look); correctResidentEyes(pixels, 'down-idle');
      expect(eye(pixels, 13), JSON.stringify(look)).toEqual(canonicalEye); expect(eye(pixels, 18)).toEqual(canonicalEye);
    }
    for (const appearance of APPEARANCE_OPTIONS) for (const outfit of OUTFIT_OPTIONS) for (const frame of ['down-idle', 'down-step-left', 'down-passing', 'down-step-right']) {
      const pixels = original(); applyResidentLook(pixels, frame, appearance, { ...DEFAULT_LOOK, outfit }); correctResidentEyes(pixels, frame);
      expect(eye(pixels, 13)).toEqual(canonicalEye); expect(eye(pixels, 18)).toEqual(canonicalEye);
    }
  });
});
