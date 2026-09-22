import { RESIDENT_FRAMES, RESIDENT_NATIVE_HEIGHT, RESIDENT_NATIVE_WIDTH } from './resident-atlas';
import { DEFAULT_LOOK, type CharacterLook } from './character-look';

export const APPEARANCE_OPTIONS = ['amber', 'moss', 'violet', 'navy', 'wine', 'cream'] as const;
export type ResidentAppearance = typeof APPEARANCE_OPTIONS[number];
type Rect = readonly [left: number, top: number, right: number, bottom: number];
type Color = readonly [number, number, number];

// Native pixel coordinates protect the hands and leather bags in each measured pose.
// Hair, face and boots are outside the torso band entirely. This is a garment mask,
// never a whole-character tint, and both the creation menu and room use it.
const protectedPixels: Record<string, readonly Rect[]> = {
  'down-idle': [[7, 30, 11, 33], [23, 30, 25, 33], [18, 31, 22, 35]],
  'down-step-left': [[6, 29, 10, 32], [20, 28, 24, 33], [18, 32, 22, 35]],
  'down-passing': [[7, 30, 12, 33], [22, 27, 25, 31], [18, 31, 22, 35]],
  'down-step-right': [[6, 28, 11, 32], [23, 29, 25, 33], [18, 31, 22, 35]],
  'right-idle': [[13, 30, 17, 33], [8, 27, 12, 34]],
  'right-step-left': [[6, 28, 10, 31], [23, 26, 27, 30], [10, 29, 15, 34]],
  'right-passing': [[21, 27, 25, 31], [10, 28, 15, 34]],
  'right-step-right': [[22, 26, 27, 30], [9, 27, 15, 34]],
  'up-idle': [[23, 30, 25, 34], [8, 27, 14, 35]],
  'up-step-left': [[6, 28, 10, 32], [23, 27, 27, 32], [9, 28, 14, 34]],
  'up-passing': [[23, 29, 26, 33], [8, 27, 14, 34]],
  'up-step-right': [[6, 28, 11, 32], [23, 26, 26, 31], [8, 28, 14, 34]],
};

const palettes = {
  amber: [[42, 29, 25], [59, 40, 29], [79, 54, 36], [103, 73, 49], [134, 96, 64]],
  moss: [[32, 43, 34], [42, 59, 41], [55, 78, 49], [75, 97, 63], [99, 119, 82]],
  violet: [[40, 30, 48], [55, 39, 66], [76, 52, 91], [101, 71, 115], [129, 96, 140]],
  navy: [[24, 31, 45], [33, 45, 65], [44, 60, 84], [62, 80, 105], [86, 105, 128]],
  wine: [[44, 25, 34], [65, 32, 45], [88, 42, 54], [113, 57, 66], [141, 77, 80]],
  cream: [[70, 58, 45], [101, 85, 63], [137, 119, 90], [175, 158, 127], [215, 201, 170]],
} as const;

const skinPalettes = {
  fair: [[151, 96, 74], [194, 133, 102], [224, 173, 140], [245, 208, 177]],
  warm: [[123, 74, 49], [167, 107, 69], [208, 148, 100], [239, 188, 139]],
  tan: [[109, 64, 44], [145, 89, 56], [182, 123, 77], [213, 159, 107]],
  brown: [[75, 43, 37], [108, 62, 43], [145, 92, 59], [179, 124, 85]],
  deep: [[48, 31, 32], [71, 43, 37], [99, 62, 46], [133, 89, 62]],
} as const;
const hairPalettes = {
  chestnut: [[38, 25, 24], [58, 36, 28], [79, 50, 35], [109, 71, 47]],
  black: [[20, 21, 27], [30, 31, 37], [44, 45, 51], [63, 63, 68]],
  copper: [[59, 29, 24], [95, 43, 28], [139, 68, 34], [184, 100, 51]],
  blonde: [[79, 57, 37], [121, 90, 48], [171, 135, 70], [213, 182, 111]],
  silver: [[51, 49, 58], [91, 91, 103], [139, 143, 152], [191, 196, 198]],
} as const;

export function residentTextureKey(appearance: ResidentAppearance, look: CharacterLook = DEFAULT_LOOK): string {
  return `resident-v4-${appearance}-${look.body}-${look.hairStyle}-${look.hairColor}-${look.skinTone}-${look.outfit}`;
}
export function residentSkinColor(look: CharacterLook = DEFAULT_LOOK): string {
  return `rgb(${skinPalettes[look.skinTone][2].join(',')})`;
}

const offset = (x: number, y: number) => (y * RESIDENT_NATIVE_WIDTH + x) * 4;
function paint(pixels: Uint8ClampedArray, x: number, y: number, color: Color) {
  pixels.set([...color, 255], offset(x, y));
}
const inArea = (areas: readonly Rect[], x: number, y: number) => areas.some(([l, t, r, b]) => x >= l && x < r && y >= t && y < b);

/** Original pixel layers on the measured sprite. Every outfit is available to either body. */
export function applyResidentLook(pixels: Uint8ClampedArray, frameName: string, appearance: ResidentAppearance, look: CharacterLook = DEFAULT_LOOK) {
  if (pixels.length !== 32 * 48 * 4 || !protectedPixels[frameName]) throw new Error('Unknown resident frame or native grid.');
  const facing = frameName.split('-')[0], skin = skinPalettes[look.skinTone], hair = hairPalettes[look.hairColor];
  const original = pixels.slice();
  for (let y = 0; y < 35; y++) for (let x = 0; x < 32; x++) {
    const i = offset(x, y), r = original[i], g = original[i + 1], b = original[i + 2];
    if (original[i + 3] < 128) continue;
    const headHair = facing === 'up' ? y < 17 : facing === 'right' ? y < 10 || y < 15 && x < 18 : y < 11 || y < 14 && (x < 13 || x > 20);
    if (look.hairColor !== 'chestnut' && headHair && r < 155 && r >= g && g >= b) {
      paint(pixels, x, y, hair[r < 42 ? 0 : r < 66 ? 1 : r < 92 ? 2 : 3]);
    }
    const eye = facing === 'down' && y >= 14 && y <= 15 && (x >= 13 && x <= 14 || x >= 18 && x <= 19)
      || facing === 'right' && x >= 21 && x <= 22 && y >= 12 && y <= 13;
    const face = facing !== 'up' && y >= 11 && y < 19 && x >= 12 && x <= 24;
    const hand = y >= 26 && inArea(protectedPixels[frameName], x, y);
    if (look.skinTone !== 'warm' && !eye && (face || hand) && r > 142 && r > g * 1.15 && g > b * 1.18 && r - g > 28) {
      paint(pixels, x, y, skin[r < 169 ? 0 : r < 198 ? 1 : r < 229 ? 2 : 3]);
    }
  }
  recolorResidentPixels(pixels, frameName, appearance);
  const cloth = palettes[appearance];
  if (look.outfit === 'vest' || look.outfit === 'skirt') {
    // The original moving arms remain, now in cream shirt sleeves beneath a vest.
    for (let y = 23; y < 31; y++) for (let x = 6; x < 27; x++) {
      const i = offset(x, y), r = original[i], g = original[i + 1];
      if ((look.outfit === 'skirt' || x < 12 || x > 21) && !inArea(protectedPixels[frameName], x, y) && original[i + 3] > 128 && r > g * 1.12 && r > 42 && r < 140) {
        paint(pixels, x, y, palettes.cream[r < 65 ? 1 : r < 95 ? 2 : 3]);
      }
    }
  }
  if (look.outfit === 'tunic') {
    for (let y = 24; y <= 37; y++) for (let x = facing === 'right' ? 13 : 12; x <= 21; x++) {
      if (inArea(protectedPixels[frameName], x, y)) continue;
      paint(pixels, x, y, cloth[y === 31 ? 0 : x === 12 || x === 21 || y === 37 ? 1 : x < 16 ? 3 : 2]);
    }
  }
  if (look.body === 'female') {
    // Shape the clothed torso rather than compressing the arms, legs and walking stride.
    // The chest is covered by the high neckline; its contour is a broad fabric fold.
    const prior = pixels.slice(), topCloth = look.outfit === 'skirt' ? palettes.cream : cloth;
    for (let y = 17; y <= 18; y++) {
      for (let x = 12; x <= 22; x++) pixels.fill(0, offset(x, y), offset(x, y) + 4);
      for (let x = 12; x <= 22; x++) if (prior[offset(x, y) + 3]) {
        const narrowed = Math.round(17 + (x - 17) * .8);
        pixels.set(prior.subarray(offset(x, y), offset(x, y) + 4), offset(narrowed, y));
      }
    }
    for (let y = 23; y <= 35; y++) {
      const waist = y >= 28 && y <= 31, hips = y >= 32;
      const left = facing === 'right' ? hips ? 12 : 13 : waist ? 13 : 11;
      const right = facing === 'right' ? waist ? 20 : hips ? 22 : y === 24 || y === 25 ? 23 : y === 27 ? 21 : 22 : waist ? 21 : 23;
      for (let x = 11; x <= 24; x++) {
        if (inArea(protectedPixels[frameName], x, y)) continue;
        const i = offset(x, y), r = original[i], g = original[i + 1], b = original[i + 2];
        const originalCloth = original[i + 3] > 128 && r < 145 && r > g * 1.1 && g >= b;
        if (x < left || x > right) {
          if (waist && originalCloth) pixels.fill(0, i, i + 4);
          continue;
        }
        // Retain moving forearms, satchel straps, scarf and the coat's shirt opening.
        if (prior[i + 3] && !originalCloth && look.outfit !== 'tunic' && look.outfit !== 'dress') continue;
        if (x === left || x === right || y === 35) paint(pixels, x, y, topCloth[0]);
        else {
          const chestFold = facing !== 'up' && y >= 24 && y <= 25;
          paint(pixels, x, y, topCloth[waist ? 1 : chestFold && x < right - 2 ? 3 : x < left + 3 ? 3 : 2]);
        }
      }
    }
  }
  if (look.outfit === 'dress' || look.outfit === 'skirt') {
    const saved = pixels.slice(), top = look.outfit === 'skirt' ? 31 : 30, hem = look.outfit === 'skirt' ? 40 : 42;
    const sway = frameName.endsWith('step-left') ? -1 : frameName.endsWith('step-right') ? 1 : 0;
    for (let y = top; y <= hem; y++) {
      const spread = Math.floor((y - top) / 4), shift = y >= 36 ? sway : 0;
      const left = (facing === 'right' ? 12 : 11) - spread + shift, right = 22 + spread + shift;
      for (let x = left; x <= right; x++) {
        if (inArea(protectedPixels[frameName], x, y) && saved[offset(x, y) + 3]) continue;
        paint(pixels, x, y, cloth[y === top || y === hem || x === left || x === right ? 0 : (x - left) % 4 === 1 ? 3 : 2]);
      }
    }
  }
  if (look.hairStyle === 'cropped' || look.hairStyle === 'swept') {
    const cropped = look.hairStyle === 'cropped';
    // Replace the tall original cap with an authored close crop or side-swept crown.
    // Eye rows remain untouched. All directions use their canonical idle head.
    for (let y = 0; y < 17; y++) for (let x = 6; x < 28; x++) {
      const clear = y < 11 || facing === 'up' || facing === 'right' && x < 18 && y < 15;
      if (clear) pixels.fill(0, offset(x, y), offset(x, y) + 4);
    }
    const rows: readonly (readonly [number, number])[] = cropped
      ? [[13, 20], [11, 22], [10, 23], [10, 23], [10, 23]]
      : [[18, 20], [14, 22], [11, 23], [10, 24], [10, 24], [10, 23], [10, 23]];
    const hairRow = (y: number, left: number, right: number) => {
      for (let x = left; x <= right; x++) paint(pixels, x, y, hair[x === left || x === right ? 0 : x < left + 3 ? 3 : x > right - 3 ? 1 : 2]);
    };
    rows.forEach(([left, right], row) => hairRow(row + (cropped ? 6 : 4), left, right));
    if (facing === 'up') {
      [[10, 23], [10, 23], [11, 22], [12, 21], [14, 19]].forEach(([left, right], row) => hairRow(row + 11, left, right));
      for (let x = 15; x <= 18; x++) paint(pixels, x, 16, skin[1]);
    } else if (facing === 'right') {
      for (let y = 11; y <= 14; y++) hairRow(y, 10 + (y === 14 ? 1 : 0), 17);
      if (!cropped) { paint(pixels, 20, 11, hair[2]); paint(pixels, 21, 11, hair[0]); }
    } else {
      for (let y = 11; y <= 13; y++) {
        for (let x = 12; x <= 22; x++) paint(pixels, x, y, skin[x === 12 || x === 22 ? 1 : 2]);
        paint(pixels, 11, y, hair[0]); paint(pixels, 23, y, hair[0]);
      }
      if (!cropped) for (let y = 10; y <= 13; y++) hairRow(y, 11, 21 - (y - 10) * 3);
    }
    if (!cropped) for (let y = 6; y <= 9; y++) for (let x = 12 + (9 - y); x <= 20; x++) paint(pixels, x, y, hair[3]);
  }
  if (look.hairStyle === 'bob' || look.hairStyle === 'long' || look.hairStyle === 'braid') {
    const strand = (left: number, right: number, top: number, bottom: number) => {
      for (let y = top; y <= bottom; y++) {
        const wide = right - left > 6;
        const inset = y === bottom ? wide ? 2 : 1 : wide && y === bottom - 1 ? 1 : 0;
        for (let x = left + inset; x <= right - inset; x++) {
          const edge = x === left + inset || x === right - inset || y === bottom;
          const highlight = x <= left + 3 && y < bottom - 2;
          const shadow = x >= right - 3 || y >= bottom - 2;
          paint(pixels, x, y, hair[edge ? 0 : highlight ? 3 : shadow ? 1 : 2]);
          // Two subdued locks break up the broad rear layer without noisy single pixels.
          if (wide && x === left + 6 && y >= top + 3 && y < bottom - 2) paint(pixels, x, y, hair[1]);
        }
      }
    };
    const long = look.hairStyle === 'long';
    if (facing === 'up') {
      strand(10, 23, 15, look.hairStyle === 'bob' ? 21 : long ? 28 : 18);
    } else if (facing === 'right') {
      strand(10, 14, 11, look.hairStyle === 'bob' ? 21 : long ? 28 : 18);
    } else {
      strand(10, 12, 12, look.hairStyle === 'bob' ? 21 : long ? 27 : 18);
      strand(22, 24, 12, look.hairStyle === 'bob' ? 21 : long ? 27 : 18);
    }
    if (look.hairStyle === 'braid') {
      const center = facing === 'up' ? 17 : 11;
      for (let y = 18; y <= 30; y++) {
        const x = center + Math.floor((y - 18) / 2) % 2;
        paint(pixels, x - 1, y, hair[0]); paint(pixels, x, y, hair[y % 2 ? 2 : 3]); paint(pixels, x + 1, y, hair[1]);
      }
      paint(pixels, center, 30, cloth[4]); paint(pixels, center + 1, 30, cloth[4]);
    }
  }
}

/** Recolors only warm cloth pixels inside the authored garment mask. */
export function recolorResidentPixels(pixels: Uint8ClampedArray, frameName: string, appearance: ResidentAppearance): void {
  if (pixels.length !== RESIDENT_NATIVE_WIDTH * RESIDENT_NATIVE_HEIGHT * 4) throw new Error('Resident pixels must use the native 32 by 48 grid.');
  const protectedAreas = protectedPixels[frameName];
  if (!protectedAreas) throw new Error(`Unknown resident frame: ${frameName}`);
  if (appearance === 'amber') return;
  const palette = palettes[appearance];
  for (let y = 20; y < 35; y++) for (let x = 6; x < 27; x++) {
    if (protectedAreas.some(([left, top, right, bottom]) => x >= left && x < right && y >= top && y < bottom)) continue;
    const index = (y * RESIDENT_NATIVE_WIDTH + x) * 4;
    const r = pixels[index], g = pixels[index + 1], b = pixels[index + 2];
    // Cream skin/shirt, golden scarf, charcoal trousers and dark outlines keep their colors.
    if (pixels[index + 3] < 128 || r < 36 || r > 140 || g < 22 || g > 110 || b < 17 || b > 85 || r < g * 1.12 || g < b * 1.08 || r - g > 45 || g - b > 28) continue;
    const light = r * .3 + g * .59 + b * .11;
    const shade = light < 38 ? 0 : light < 49 ? 1 : light < 63 ? 2 : light < 82 ? 3 : 4;
    [pixels[index], pixels[index + 1], pixels[index + 2]] = palette[shade];
  }
}

const canvases = new WeakMap<HTMLImageElement, Map<string, HTMLCanvasElement>>();
const baseCanvases = new WeakMap<HTMLImageElement, Map<string, HTMLCanvasElement>>();

/** The native down-facing sample lost the right eye's light pixels in reduction.
 * Restore its two-by-two eye cluster from the clear opposite eye, beneath the brow. */
export function correctResidentEyes(pixels: Uint8ClampedArray, frameName: string) {
  if (!frameName.startsWith('down-')) return;
  for (let y = 14; y <= 15; y++) for (let x = 0; x < 2; x++) {
    const source = (y * RESIDENT_NATIVE_WIDTH + 18 + x) * 4;
    const target = (y * RESIDENT_NATIVE_WIDTH + 13 + x) * 4;
    pixels.set(pixels.slice(source, source + 4), target);
  }
  // Keep a dark iris in each two-pixel eye at the final native resolution.
  for (const x of [14, 19]) pixels.set([53, 40, 41, 255], (15 * RESIDENT_NATIVE_WIDTH + x) * 4);
}

function baseResidentCanvas(image: HTMLImageElement, frameName: string): HTMLCanvasElement {
  const frame = RESIDENT_FRAMES.find(candidate => candidate.name === frameName);
  if (!frame) throw new Error(`Unknown resident frame: ${frameName}`);
  let images = baseCanvases.get(image);
  if (!images) { images = new Map(); baseCanvases.set(image, images); }
  const cached = images.get(frameName);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = RESIDENT_NATIVE_WIDTH; canvas.height = RESIDENT_NATIVE_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not draw the resident.');
  context.imageSmoothingEnabled = false;
  context.drawImage(image, frame.x, frame.y, frame.width, frame.height, 0, 0, canvas.width, canvas.height);
  // The source walking frames contain unintended facial changes. Keep one head
  // per facing while the torso, arms and legs animate beneath it.
  if (!frameName.endsWith('-idle')) {
    const idle = baseResidentCanvas(image, `${frameName.split('-')[0]}-idle`);
    context.clearRect(0, 0, canvas.width, 20);
    context.drawImage(idle, 0, 0, canvas.width, 20, 0, 0, canvas.width, 20);
  }
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  correctResidentEyes(pixels.data, frameName);
  context.putImageData(pixels, 0, 0);
  images.set(frameName, canvas);
  return canvas;
}

/** Shared native artwork for Phaser and creation. Treat the cached canvas as read-only. */
export function residentCanvas(image: HTMLImageElement, frameName: string, appearance: ResidentAppearance, look: CharacterLook = DEFAULT_LOOK): HTMLCanvasElement {
  let images = canvases.get(image);
  if (!images) { images = new Map(); canvases.set(image, images); }
  const key = `${residentTextureKey(appearance, look)}:${frameName}`;
  const cached = images.get(key);
  if (cached) return cached;
  const base = baseResidentCanvas(image, frameName);
  const canvas = document.createElement('canvas'); canvas.width = base.width; canvas.height = base.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not draw the resident.');
  context.drawImage(base, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  applyResidentLook(pixels.data, frameName, appearance, look);
  context.putImageData(pixels, 0, 0); images.set(key, canvas);
  return canvas;
}
