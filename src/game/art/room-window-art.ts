/** Native 52×80 geometry shared by frame painting and every outdoor pixel. */
export const WINDOW_NATIVE = { width: 52, height: 80 } as const;
function arch(x: number, y: number, inset = 0) {
  if (y < 3 + inset || y > 74 - inset || x < 5 + inset || x > 46 - inset) return false;
  const half = Math.min(20.5 - inset, (y - 3 - inset) * 1.12);
  return Math.abs(x - 25.5) <= half;
}
export function inWindowPane(x: number, y: number) {
  return arch(x, y, 5) && x !== 25 && x !== 26 && y !== 36 && y !== 37;
}
export function drawWindowFrame(context: CanvasRenderingContext2D, ox = 0, oy = 0) {
  const pixel = (x: number, y: number, color: string) => { context.fillStyle = color; context.fillRect(ox + x, oy + y, 1, 1); };
  for (let y = 0; y < WINDOW_NATIVE.height; y++) for (let x = 0; x < WINDOW_NATIVE.width; x++) {
    if (inWindowPane(x, y)) { context.clearRect(ox + x, oy + y, 1, 1); continue; }
    if (arch(x, y)) {
      const edge = !arch(x - 1, y) || !arch(x + 1, y) || !arch(x, y - 1) || !arch(x, y + 1);
      const reveal = arch(x, y, 3);
      pixel(x, y, edge ? '#302330' : reveal ? '#483442' : x < 26 ? '#98754d' : '#684936');
      if (arch(x, y, 5)) pixel(x, y, x === 25 || y === 36 ? '#b99a67' : '#4a3b39');
      else if (x % 7 === 0 && y % 11 < 6 && !edge) pixel(x, y, '#795b40');
    }
  }
  // Carved sill and short velvet drapes stay outside the exact glass opening.
  context.fillStyle = '#302330'; context.fillRect(ox + 2, oy + 74, 48, 5);
  context.fillStyle = '#a18158'; context.fillRect(ox + 3, oy + 74, 46, 2);
  context.fillStyle = '#644934'; context.fillRect(ox + 5, oy + 76, 42, 2);
  for (const x of [0, 47]) {
    context.fillStyle = '#352337'; context.fillRect(ox + x, oy + 22, 5, 51);
    context.fillStyle = '#69434f'; context.fillRect(ox + x + 1, oy + 23, 2, 45);
    context.fillStyle = '#8d645f'; context.fillRect(ox + x + 2, oy + 49, 2, 2);
  }
}
