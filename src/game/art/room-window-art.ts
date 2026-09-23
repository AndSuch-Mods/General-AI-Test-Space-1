/** Original Gothic stonework and purple drapes, sampled at the room's native scale. */
export const WINDOW_NATIVE = { width: 52, height: 80 } as const;
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

export function drawWindowFrame(context: CanvasRenderingContext2D, source: CanvasImageSource, ox = 0, oy = 0) {
  context.save(); context.imageSmoothingEnabled = false;
  context.drawImage(source, WINDOW_SOURCE.x, WINDOW_SOURCE.y, WINDOW_SOURCE.width, WINDOW_SOURCE.height,
    ox, oy, WINDOW_NATIVE.width, WINDOW_NATIVE.height);
  for (let y = 0; y < WINDOW_NATIVE.height; y++) for (let x = 0; x < WINDOW_NATIVE.width; x++) {
    if (inWindowPane(x, y)) context.clearRect(ox + x, oy + y, 1, 1);
  }
  context.restore();
}
