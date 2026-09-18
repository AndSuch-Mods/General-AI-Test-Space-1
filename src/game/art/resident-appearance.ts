import { RESIDENT_FRAMES, RESIDENT_NATIVE_HEIGHT, RESIDENT_NATIVE_WIDTH } from './resident-atlas';

export type ResidentAppearance = 'amber' | 'moss' | 'violet';
type Rect = readonly [left: number, top: number, right: number, bottom: number];

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
  moss: [[32, 43, 34], [42, 59, 41], [55, 78, 49], [75, 97, 63], [99, 119, 82]],
  violet: [[40, 30, 48], [55, 39, 66], [76, 52, 91], [101, 71, 115], [129, 96, 140]],
} as const;

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

/** Shared native artwork for Phaser and character creation. Treat the returned canvas as read-only. */
export function residentCanvas(image: HTMLImageElement, frameName: string, appearance: ResidentAppearance): HTMLCanvasElement {
  const frame = RESIDENT_FRAMES.find(candidate => candidate.name === frameName);
  if (!frame) throw new Error(`Unknown resident frame: ${frameName}`);
  let images = canvases.get(image);
  if (!images) { images = new Map(); canvases.set(image, images); }
  const key = `${appearance}:${frameName}`;
  const cached = images.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = RESIDENT_NATIVE_WIDTH; canvas.height = RESIDENT_NATIVE_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not draw the resident.');
  context.imageSmoothingEnabled = false;
  context.drawImage(image, frame.x, frame.y, frame.width, frame.height, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  recolorResidentPixels(pixels.data, frameName, appearance);
  context.putImageData(pixels, 0, 0);
  images.set(key, canvas);
  return canvas;
}
