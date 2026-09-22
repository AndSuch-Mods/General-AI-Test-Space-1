import { CHARACTER_MATERIALS, type CharacterMaterial, type CharacterPalette } from './character-palette';

export type Point = readonly [number, number];
/** Integer-only drawing surface. Materials are explicit, never inferred from finished RGB. */
export class CharacterPixelArt {
  readonly pixels = new Uint8ClampedArray(32 * 48 * 4);
  readonly materials = new Uint8Array(32 * 48);
  constructor(readonly palette: CharacterPalette) {}
  pixel(x: number, y: number, material: CharacterMaterial, shade: number) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || x >= 32 || y < 0 || y >= 48) return;
    const index = y * 32 + x, color = this.palette[material][shade];
    this.pixels.set([...color, 255], index * 4);
    this.materials[index] = CHARACTER_MATERIALS.indexOf(material) + 1;
  }
  rect(x: number, y: number, width: number, height: number, material: CharacterMaterial, shade: number) {
    for (let row = y; row < y + height; row++) for (let column = x; column < x + width; column++) this.pixel(column, row, material, shade);
  }
  polygon(points: readonly Point[], material: CharacterMaterial, shade: number) {
    const top = Math.max(0, Math.floor(Math.min(...points.map(p => p[1])))), bottom = Math.min(47, Math.ceil(Math.max(...points.map(p => p[1]))));
    for (let y = top; y <= bottom; y++) {
      const intersections: number[] = [];
      points.forEach(([x1, y1], index) => {
        const [x2, y2] = points[(index + 1) % points.length];
        if (y1 <= y + .5 && y2 > y + .5 || y2 <= y + .5 && y1 > y + .5) intersections.push(x1 + (y + .5 - y1) * (x2 - x1) / (y2 - y1));
      });
      intersections.sort((a, b) => a - b);
      for (let pair = 0; pair + 1 < intersections.length; pair += 2) {
        for (let x = Math.ceil(intersections[pair] - .5); x < intersections[pair + 1] - .5; x++) this.pixel(x, y, material, shade);
      }
    }
  }
  stroke(points: readonly Point[], radius: number, material: CharacterMaterial, shade: number) {
    for (let index = 0; index < points.length - 1; index++) {
      const [x1, y1] = points[index], [x2, y2] = points[index + 1], steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
      for (let step = 0; step <= steps; step++) {
        const x = Math.round(x1 + (x2 - x1) * step / steps), y = Math.round(y1 + (y2 - y1) * step / steps);
        for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) if (dx * dx + dy * dy <= radius * radius + 1) this.pixel(x + dx, y + dy, material, shade);
      }
    }
  }
  mirrored() {
    const result = new CharacterPixelArt(this.palette);
    for (let y = 0; y < 48; y++) for (let x = 0; x < 32; x++) {
      const from = y * 32 + x, to = y * 32 + 31 - x;
      result.pixels.set(this.pixels.subarray(from * 4, from * 4 + 4), to * 4);
      result.materials[to] = this.materials[from];
    }
    return result;
  }
}
