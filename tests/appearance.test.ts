import { describe, expect, it } from 'vitest';
import { characterPixels, characterFrameState, residentTextureKey, CHARACTER_ANCHORS } from '../src/game/art/resident-appearance';
import { CHARACTER_MATERIALS, APPEARANCE_OPTIONS } from '../src/game/art/character-palette';
import { DEFAULT_LOOK, BODY_OPTIONS, HAIR_STYLE_OPTIONS, HAIR_COLOR_OPTIONS, SKIN_TONE_OPTIONS, OUTFIT_OPTIONS, type CharacterLook } from '../src/game/art/character-look';
import { RESIDENT_DIRECTIONS, RESIDENT_POSES, RESIDENT_FRAMES } from '../src/game/art/resident-atlas';
import originalIdle from './fixtures/resident-original-down-idle.json';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const sample = (look: CharacterLook = DEFAULT_LOOK) => characterPixels('amber', look, { facing: 'down', pose: 'idle' });
// Diagonal pixel clusters are connected in raster art; a detached limb is not.
const connected = (pixels: Uint8ClampedArray) => {
  const opaque = Array.from({ length: 32 * 48 }, (_, index) => index).filter(index => pixels[index * 4 + 3] !== 0);
  const reached = new Set<number>(), queue = [opaque[0]];
  for (let index = 0; index < queue.length; index++) {
    const cell = queue[index];
    if (reached.has(cell)) continue;
    reached.add(cell);
    for (const next of [cell % 32 ? cell - 1 : -1, cell % 32 < 31 ? cell + 1 : -1, cell - 32, cell + 32, cell % 32 ? cell - 33 : -1, cell % 32 < 31 ? cell - 31 : -1, cell % 32 ? cell + 31 : -1, cell % 32 < 31 ? cell + 33 : -1]) {
      if (next >= 0 && next < 32 * 48 && pixels[next * 4 + 3] && !reached.has(next)) queue.push(next);
    }
  }
  return reached.size === opaque.length;
};

describe('clean layered resident artwork', () => {
  it('preserves the approved original pixels apart from the matched-eye correction and binary alpha', () => {
    const hash = createHash('sha256').update(readFileSync('public/art/residents-v2.png')).digest('hex');
    expect(hash).toBe('219358d84902c0514389b2aa5d6ef84bed19a554f864102d0dde1095b47bcb49');
    const actual = sample().pixels;
    for (let y = 0; y < 48; y++) for (let x = 0; x < 32; x++) {
      if (y >= 13 && y <= 15 && (x >= 13 && x <= 14 || x >= 18 && x <= 19)) continue;
      const i = (y * 32 + x) * 4;
      const expected = originalIdle[i + 3] < 128 ? [0, 0, 0, 0] : [...originalIdle.slice(i, i + 3), 255];
      expect(Array.from(actual.slice(i, i + 4)), `original pixel ${x},${y}`).toEqual(expected);
    }
  });

  it('keeps the complete open-eye cluster matched through every body, hairstyle, skin and gait', () => {
    const expected = [[49, 35, 32], [52, 35, 29], [117, 60, 24], [206, 203, 201], [194, 115, 38], [248, 241, 232]];
    for (const body of BODY_OPTIONS) for (const hairStyle of HAIR_STYLE_OPTIONS) for (const skinTone of SKIN_TONE_OPTIONS) for (const pose of RESIDENT_POSES) {
      const frame = characterPixels('wine', { ...DEFAULT_LOOK, body, hairStyle, skinTone }, { facing: 'down', pose });
      for (const left of [13, 18]) for (let row = 0; row < 3; row++) for (let column = 0; column < 2; column++) {
        const p = ((13 + row) * 32 + left + column) * 4;
        expect(Array.from(frame.pixels.slice(p, p + 4))).toEqual([...expected[row * 2 + column], 255]);
      }
    }
  });

  it('does not leak the original scarf beyond the shoulders of other garments', () => {
    for (const outfit of OUTFIT_OPTIONS.filter(value => value !== 'coat')) {
      for (const facing of ['right', 'up'] as const) {
        const frame = characterPixels('amber', { ...DEFAULT_LOOK, outfit, hairStyle: 'cropped' }, { facing, pose: 'idle' });
        for (const x of [7, 8, 9, 25, 26]) expect(frame.pixels[(19 * 32 + x) * 4 + 3]).toBe(0);
      }
    }
  });

  it('keeps the approved head, scarf, boots and alpha unchanged when recoloring the default coat', () => {
    const original = sample().pixels;
    for (const appearance of APPEARANCE_OPTIONS) {
      const frame = characterPixels(appearance, DEFAULT_LOOK).pixels;
      for (let i = 0; i < frame.length; i++) {
        const row = Math.floor(i / 4 / 32);
        if (row < 20 || row >= 43 || i % 4 === 3) expect(frame[i], `${appearance} pixel channel ${i}`).toBe(original[i]);
      }
    }
  });
  it('keeps every body, hair and outfit connected in all directions while standing, walking and sitting', () => {
    for (const body of BODY_OPTIONS) for (const hairStyle of HAIR_STYLE_OPTIONS) for (const outfit of OUTFIT_OPTIONS) {
      const look = { ...DEFAULT_LOOK, body, hairStyle, outfit };
      for (const facing of RESIDENT_DIRECTIONS) for (const pose of ['idle', 'step-left', 'passing', 'step-right', 'sit', 'rest'] as const) {
        const { pixels } = characterPixels('amber', look, { facing, pose });
        expect(connected(pixels), `${body}/${hairStyle}/${outfit}/${facing}/${pose} has a detached part`).toBe(true);
        expect(pixels.filter((_, index) => index % 4 === 3).every(alpha => alpha === 0 || alpha === 255)).toBe(true);
      }
    }
  });

  it('changes only the declared material when recoloring clothing, skin or hair', () => {
    const base = sample();
    const variants = [
      ...APPEARANCE_OPTIONS.slice(1).map(appearance => ({ frame: characterPixels(appearance, DEFAULT_LOOK), material: 'cloth' })),
      ...SKIN_TONE_OPTIONS.filter(tone => tone !== DEFAULT_LOOK.skinTone).map(skinTone => ({ frame: sample({ ...DEFAULT_LOOK, skinTone }), material: 'skin' })),
      ...HAIR_COLOR_OPTIONS.filter(color => color !== DEFAULT_LOOK.hairColor).map(hairColor => ({ frame: sample({ ...DEFAULT_LOOK, hairColor }), material: 'hair' })),
    ];
    for (const { frame, material } of variants) {
      expect(frame.materials).toEqual(base.materials);
      let changed = 0;
      for (let pixel = 0; pixel < 32 * 48; pixel++) {
        const difference = [0, 1, 2].some(channel => frame.pixels[pixel * 4 + channel] !== base.pixels[pixel * 4 + channel]);
        if (difference) { changed++; expect(CHARACTER_MATERIALS[base.materials[pixel] - 1]).toBe(material); }
      }
      expect(changed).toBeGreaterThan(20);
    }
  });

  it('retains exactly the same head through every footfall, for both bodies and every hairstyle', () => {
    for (const body of BODY_OPTIONS) for (const hairStyle of HAIR_STYLE_OPTIONS) for (const facing of RESIDENT_DIRECTIONS) {
      const look = { ...DEFAULT_LOOK, body, hairStyle };
      const head = characterPixels('moss', look, { facing, pose: 'idle' }).pixels.slice(0, 32 * 20 * 4);
      for (const pose of RESIDENT_POSES) expect(characterPixels('moss', look, { facing, pose }).pixels.slice(0, head.length)).toEqual(head);
    }
  });

  it('provides distinct walking, seated, sleeping and annoyed expressions without renderer face patches', () => {
    const idle = sample().pixels;
    for (const pose of ['step-left', 'passing', 'step-right', 'sit', 'rest'] as const) expect(characterPixels('amber', DEFAULT_LOOK, { facing: 'down', pose }).pixels).not.toEqual(idle);
    const sleeping = characterPixels('amber', DEFAULT_LOOK, { facing: 'down', pose: 'rest' }).pixels;
    const grumpy = characterPixels('amber', DEFAULT_LOOK, { facing: 'down', pose: 'rest', expression: 'grumpy' }).pixels;
    expect(grumpy).not.toEqual(sleeping);
    for (const facing of RESIDENT_DIRECTIONS) expect(characterFrameState(`${facing}-grumpy`)).toEqual({ facing, pose: 'rest', expression: 'grumpy' });
    expect(CHARACTER_ANCHORS).toEqual({ standing: { x: 16, y: 47 }, seated: { x: 16, y: 32 }, pillow: { x: 16, y: 14 } });
  });

  it('mirrors a genuine side profile and gives every catalog entry a valid pose', () => {
    for (const pose of [...RESIDENT_POSES, 'sit', 'rest'] as const) {
      const left = characterPixels('wine', DEFAULT_LOOK, { facing: 'left', pose }).pixels;
      const right = characterPixels('wine', DEFAULT_LOOK, { facing: 'right', pose }).pixels;
      for (let y = 0; y < 48; y++) for (let x = 0; x < 32; x++) {
        expect(left.slice((y * 32 + x) * 4, (y * 32 + x + 1) * 4)).toEqual(right.slice((y * 32 + 31 - x) * 4, (y * 32 + 32 - x) * 4));
      }
    }
    expect(new Set(RESIDENT_FRAMES.map(frame => frame.name)).size).toBe(28);
    for (const frame of RESIDENT_FRAMES) expect(characterFrameState(frame.name)).toHaveProperty('facing');
    expect(() => characterFrameState('down-missing')).toThrow(/Unknown resident frame/);
  });

  it('keeps all saved choices distinct in artwork and cache keys', () => {
    const base = sample().pixels, key = residentTextureKey('amber');
    for (const [field, values] of Object.entries({ body: BODY_OPTIONS, hairStyle: HAIR_STYLE_OPTIONS, outfit: OUTFIT_OPTIONS })) {
      for (const value of values) {
        if (DEFAULT_LOOK[field as keyof CharacterLook] === value) continue;
        const look = { ...DEFAULT_LOOK, [field]: value };
        expect(sample(look).pixels).not.toEqual(base);
        expect(residentTextureKey('amber', look)).not.toBe(key);
      }
    }
  });
});
