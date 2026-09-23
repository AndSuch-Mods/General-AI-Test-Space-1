import type { CharacterLook } from './character-look';
import { copyPixel, emptyRaster, nativeIndex, overlay, rasterSource, type CharacterRaster } from './character-pixel-art';

export type SourceFacing = 'down' | 'right' | 'up';
export type CharacterExpression = 'neutral' | 'sleeping' | 'grumpy';
/** The approved source's clear eye, duplicated after the September eye correction. */
const OPEN_EYE = [[49, 35, 32], [52, 35, 29], [117, 60, 24], [206, 203, 201], [194, 115, 38], [248, 241, 232]] as const;

export function matchedOpenEyes(frame: CharacterRaster) {
  for (const left of [13, 18]) for (let y = 0; y < 3; y++) for (let x = 0; x < 2; x++) {
    const p = nativeIndex(left + x, 13 + y);
    frame.pixels.set([...OPEN_EYE[y * 2 + x], 255], p * 4); frame.materials[p] = 9;
  }
}

/** One canonical head in each direction is shared by every body and footfall. */
export function residentHead(look: CharacterLook, facing: SourceFacing): CharacterRaster {
  const original = rasterSource(`original-${facing}-idle`), head = emptyRaster();
  if (look.hairStyle === 'short') overlay(head, original, (_x, y) => y < (look.outfit === 'coat' ? 20 : 18));
  else {
    const styled = rasterSource(`head-${look.hairStyle}-${facing}`);
    overlay(head, styled, (_x, y, material) => y < 19 || material === 3);
    // Preserve the approved facial identity inside the separate hair silhouette.
    if (facing === 'down') overlay(head, original, (x, y) => x >= 12 && x <= 21 && y >= 12 && y < 19);
    if (facing === 'right') overlay(head, original, (x, y) => x >= 18 && x <= 24 && y >= 10 && y < 19);
    if (look.outfit === 'coat') overlay(head, original, (_x, y) => y === 19);
  }
  for (let y = 0; y < 20; y++) for (let x = 0; x < 32; x++) {
    const p = nativeIndex(x, y), i = p * 4;
    if (!head.pixels[i + 3]) continue;
    const face = facing === 'down' ? x >= 12 && x <= 21 && y >= 12 && y < 19 : facing === 'right' ? x >= 18 && x <= 24 && y >= 10 && y < 19 : false;
    if (face && head.pixels[i] > 125 && head.pixels[i] > head.pixels[i + 1] * 1.12) head.materials[p] = 2;
    // The original head includes the amber scarf's top folds. Its dark folds are
    // the same fixed accessory as its gold highlights, not selectable coat cloth.
    if (look.outfit === 'coat' && head.materials[p] === 4) head.materials[p] = 8;
  }
  if (facing === 'down') matchedOpenEyes(head);
  return head;
}

/** Expression backing comes from the colored cheek, matching all skin tones. */
export function expressResident(frame: CharacterRaster, facing: SourceFacing, expression: CharacterExpression) {
  if (expression === 'neutral' || facing === 'up') return;
  if (facing === 'down') {
    for (const left of [13, 18]) {
      for (let y = 13; y <= 15; y++) for (let x = left; x < left + 2; x++) copyPixel(frame, frame, x, y, left + 1, 16);
      for (let x = left; x < left + 2; x++) {
        const p = nativeIndex(x, expression === 'sleeping' ? 15 : 14 + (x === left ? 0 : 1));
        frame.pixels.set([52, 35, 29, 255], p * 4); frame.materials[p] = 9;
      }
    }
  } else {
    for (let y = 12; y <= 13; y++) for (let x = 21; x <= 22; x++) copyPixel(frame, frame, x, y, 22, 14);
    for (let x = 21; x <= 22; x++) {
      const p = nativeIndex(x, expression === 'sleeping' ? 13 : x === 21 ? 12 : 13);
      frame.pixels.set([52, 35, 29, 255], p * 4); frame.materials[p] = 9;
    }
  }
}
