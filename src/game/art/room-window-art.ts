/** Original Gothic stonework and purple drapes, sampled at the room's native scale. */
export const WINDOW_NATIVE = { width: 52, height: 80 } as const;
export const WINDOW_FRAME_NATIVE = { width: 52, height: 86 } as const;
export const WINDOW_FRAME_OFFSET_Y = -12;
export const WINDOW_SOURCE = { x: 75, y: 764, width: 288, height: 302 } as const;

// Measured against the original atlas after nearest-neighbor sampling to 52×80.
// Each inclusive span follows glass, leaving the stone tracery and mullion intact.
const glassRows: Readonly<Record<number, readonly (readonly [number, number])[]>> = {
  10: [[25, 26]], 11: [[24, 27]], 12: [[23, 28]], 13: [[23, 28]],
  14: [[24, 27]], 15: [[24, 26]], 16: [[21, 21], [25, 25], [30, 30]],
  17: [[20, 22], [29, 31]], 18: [[20, 23], [28, 31]],
  19: [[19, 23], [28, 32]], 20: [[19, 23], [27, 32]],
};
export function inWindowPane(x: number, y: number) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) return false;
  if (y >= 21 && y <= 60) return x >= 18 && x <= 24 || x >= 27 && x <= 33;
  return glassRows[y]?.some(([start, end]) => x >= start && x <= end) ?? false;
}

export function windowFramePixels(original: Uint8ClampedArray | Uint8Array) {
  const data = new Uint8ClampedArray(WINDOW_FRAME_NATIVE.width * WINDOW_FRAME_NATIVE.height * 4);
  const copy = (x: number, y: number, sx: number, sy: number) => data.set(original.subarray((sy * 52 + sx) * 4, (sy * 52 + sx) * 4 + 4), (y * 52 + x) * 4);
  for (let y = 0; y < 80; y++) for (let x = 0; x < 52; x++) {
    if (inWindowPane(x, y)) continue;
    const at = (y * 52 + x) * 4;
    // Remove the old low rod between the drapes, preserving the gray arch.
    if (x > 12 && x < 39 && y < 8 && !(original[at + 2] >= original[at + 1] && original[at + 1] >= original[at])) continue;
    copy(x, y + 6, x, y);
  }
  // Extend the original velvet upward while keeping its lower hem in place.
  for (let y = 4; y < 86; y++) for (let x = 0; x < 52; x++) {
    if (x <= 12 || x >= 39) copy(x, y, x, Math.min(79, 3 + Math.floor((y - 4) * 77 / 82)));
  }
  // Original rod grain and finials, raised above the unchanged stone arch.
  for (let y = 2; y < 4; y++) for (let x = 4; x < 48; x++) copy(x, y, 16 + (x - 4) % 4, 5);
  for (let y = 0; y < 9; y++) for (const x of [0, 1, 2, 3, 48, 49, 50, 51]) copy(x, y, x, y);
  return data;
}
export function drawWindowFrame(context: CanvasRenderingContext2D, source: CanvasImageSource, ox = 0, oy = 0) {
  context.save(); context.imageSmoothingEnabled = false;
  context.drawImage(source, WINDOW_SOURCE.x, WINDOW_SOURCE.y, WINDOW_SOURCE.width, WINDOW_SOURCE.height, ox, oy + 6, 52, 80);
  const original = context.getImageData(ox, oy + 6, 52, 80).data;
  const image = context.createImageData(52, 86); image.data.set(windowFramePixels(original));
  context.putImageData(image, ox, oy); context.restore();
}
