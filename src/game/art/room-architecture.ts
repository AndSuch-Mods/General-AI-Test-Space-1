import type Phaser from 'phaser';

export const ARCHITECTURE_IMAGES = [
  { key: 'door-source-v10', path: 'art/door-parts-v10.png' },
  { key: 'household-materials-v8', path: 'art/household-materials-v8.png' },
] as const;
export type DoorWall = 'north' | 'west' | 'south' | 'east';
type Crop = { x: number; y: number; width: number; height: number };
type Point = { x: number; y: number };
type DoorRaster = { width: number; height: number; data: Uint8ClampedArray };
const parts = {
  front: { x: 337, y: 38, width: 203, height: 314 }, back: { x: 714, y: 38, width: 202, height: 314 },
  north: { x: 306, y: 814, width: 252, height: 380 }, south: { x: 639, y: 1035, width: 312, height: 111 },
  westNear: { x: 378, y: 429, width: 57, height: 358 }, westFar: { x: 429, y: 385, width: 38, height: 371 },
  eastNear: { x: 824, y: 429, width: 55, height: 358 }, eastFar: { x: 788, y: 385, width: 39, height: 371 },
  beam: { x: 350, y: 837, width: 153, height: 40 }, recess: { x: 365, y: 890, width: 130, height: 270 },
  knob: { x: 499, y: 195, width: 30, height: 31 }, edge: { x: 342, y: 39, width: 191, height: 28 },
} satisfies Record<string, Crop>;

/** Extra canvas surrounds the unchanged doorway footprint and carries its swinging leaf. */
export function doorArt(wall: DoorWall) {
  const size = wall === 'north' ? { width: 112, height: 170, offsetX: -24, offsetY: 0 }
    : wall === 'south' ? { width: 104, height: 112, offsetX: -8, offsetY: -76 }
    : { width: 112, height: 156, offsetX: wall === 'west' ? 0 : -80, offsetY: -16 };
  return { texture: 'door-v10-' + wall, ...size, closed: 'closed', open: 'open', openFrames: ['open-0', 'open-1', 'open-2', 'open-3'] };
}
export function doorFrameBounds(wall: DoorWall) {
  return wall === 'north' ? { x: 12, y: 0, width: 43, height: 68 }
    : wall === 'south' ? { x: 4, y: 36, width: 43, height: 18 }
    : { x: wall === 'west' ? 0 : 40, y: 0, width: 16, height: 68 };
}
function painter(target: DoorRaster, source: DoorRaster) {
  const pixel = (x: number, y: number, frame: Crop, u: number, v: number) => {
    const sx = frame.x + Math.min(frame.width - 1, Math.floor(u * frame.width)), sy = frame.y + Math.min(frame.height - 1, Math.floor(v * frame.height));
    const from = (sy * source.width + sx) * 4, at = (y * target.width + x) * 4;
    if (source.data[from + 3] >= 192) { target.data.set(source.data.subarray(from, from + 4), at); target.data[at + 3] = 255; }
  };
  const quad = (frame: Crop, origin: Point, along: Point, down: Point, mirror = false) => {
    const corners = [origin, { x: origin.x + along.x, y: origin.y + along.y }, { x: origin.x + down.x, y: origin.y + down.y }, { x: origin.x + along.x + down.x, y: origin.y + along.y + down.y }];
    const determinant = along.x * down.y - along.y * down.x;
    if (Math.abs(determinant) < .01) return;
    for (let y = Math.max(0, Math.floor(Math.min(...corners.map(p => p.y)))); y < Math.min(target.height, Math.ceil(Math.max(...corners.map(p => p.y)))); y++) {
      for (let x = Math.max(0, Math.floor(Math.min(...corners.map(p => p.x)))); x < Math.min(target.width, Math.ceil(Math.max(...corners.map(p => p.x)))); x++) {
        const dx = x + .5 - origin.x, dy = y + .5 - origin.y;
        const u = (dx * down.y - dy * down.x) / determinant, v = (along.x * dy - along.y * dx) / determinant;
        if (u >= 0 && u < 1 && v >= 0 && v < 1) pixel(x, y, frame, mirror ? 1 - u : u, v);
      }
    }
  };
  const rect = (frame: Crop, x: number, y: number, width: number, height: number) => quad(frame, { x, y }, { x: width, y: 0 }, { x: 0, y: height });
  return { quad, rect };
}
/** Place the newly authored side posts upright; no whole-door squash or shear. */
export function doorFramePixels(source: DoorRaster, wall: DoorWall): DoorRaster {
  const art = doorArt(wall), out = { width: art.width / 2, height: art.height / 2, data: new Uint8ClampedArray(art.width * art.height) };
  const p = painter(out, source), frame = doorFrameBounds(wall);
  if (wall === 'north' || wall === 'south') p.rect(parts[wall], frame.x, frame.y, frame.width, frame.height);
  else {
    const west = wall === 'west', x = frame.x;
    p.rect(parts.recess, x + 4, 5, 9, 60); p.rect(parts.beam, x + 3, 4, 11, 5);
    p.rect(west ? parts.westFar : parts.eastFar, x + (west ? 10 : 0), 0, 6, 68);
    p.rect(west ? parts.westNear : parts.eastNear, x + (west ? 0 : 9), 0, 7, 68);
  }
  return out;
}
/** Rigid leaf geometry; both faces have the same free-edge brass hardware. */
export function doorLeafGeometry(wall: DoorWall, amount: number) {
  const step = Math.max(0, Math.min(3, Math.round(amount * 3)));
  if (wall === 'north') {
    const angle = [0, 42, 78, 112][step] * Math.PI / 180;
    return { origin: { x: 20, y: 13 }, along: { x: 27 * Math.cos(angle), y: 27 * .6 * Math.sin(angle) }, down: { x: 0, y: 50 }, back: angle > Math.PI / 2 };
  }
  if (wall === 'south') {
    const angle = [0, 30, 60, 90][step] * Math.PI / 180;
    return { origin: { x: 11, y: 46 }, along: { x: 33 * Math.cos(angle), y: -33 * Math.sin(angle) }, down: { x: -5 * Math.sin(angle), y: -5 * Math.cos(angle) }, back: false };
  }
  const sign = wall === 'west' ? 1 : -1, angle = [0, 32, 62, 90][step] * Math.PI / 180;
  return { origin: { x: wall === 'west' ? 6 : 50, y: 22 }, along: { x: sign * Math.max(6, 36 * Math.sin(angle)), y: -21.6 * Math.cos(angle) }, down: { x: 0, y: 44 }, back: wall === 'east' };
}
export function doorNativePixels(source: DoorRaster, wall: DoorWall, amount: number): DoorRaster {
  const out = doorFramePixels(source, wall), p = painter(out, source), leaf = doorLeafGeometry(wall, amount);
  p.quad(wall === 'south' ? parts.edge : leaf.back ? parts.back : parts.front, leaf.origin, leaf.along, leaf.down, leaf.back);
  // Hardware follows the leaf, and remains visible on both faces at edge-on poses.
  const free = { x: leaf.origin.x + leaf.along.x * .9 + leaf.down.x * .55, y: leaf.origin.y + leaf.along.y * .9 + leaf.down.y * .55 };
  if (wall === 'south') {
    const length = Math.hypot(leaf.along.x, leaf.along.y), nx = -leaf.along.y / length, ny = leaf.along.x / length;
    for (const side of [-1, 1]) p.rect(parts.knob, free.x + nx * side * 3 - 1.5, free.y + ny * side * 3 - 1.5, 3, 3);
  } else if (Math.abs(leaf.along.x) < 6 || leaf.back) p.rect(parts.knob, free.x - 1.5, free.y - 1.5, 3, 3);
  return out;
}
const doorSources = new WeakMap<CanvasImageSource, DoorRaster>();
export function drawDoor(context: CanvasRenderingContext2D, source: CanvasImageSource, wall: DoorWall, amount: number) {
  let pixels = doorSources.get(source);
  if (!pixels) {
    const image = source as HTMLImageElement, canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || image.width; canvas.height = image.naturalHeight || image.height;
    const c = canvas.getContext('2d')!; c.drawImage(source, 0, 0);
    pixels = { width: canvas.width, height: canvas.height, data: c.getImageData(0, 0, canvas.width, canvas.height).data }; doorSources.set(source, pixels);
  }
  const native = doorNativePixels(pixels, wall, amount), canvas = document.createElement('canvas'); canvas.width = native.width; canvas.height = native.height;
  const c = canvas.getContext('2d')!, image = c.createImageData(native.width, native.height); image.data.set(native.data); c.putImageData(image, 0, 0);
  context.imageSmoothingEnabled = false; context.drawImage(canvas, 0, 0);
}
export function buildDoorTextures(scene: Phaser.Scene) {
  const source = scene.textures.get('door-source-v10').getSourceImage() as HTMLImageElement;
  for (const wall of ['north', 'west', 'south', 'east'] as DoorWall[]) {
    const art = doorArt(wall), width = art.width / 2, height = art.height / 2;
    const texture = scene.textures.createCanvas(art.texture, width * 4, height)!;
    for (let i = 0; i < 4; i++) {
      texture.context.save(); texture.context.translate(i * width, 0); drawDoor(texture.context, source, wall, i / 3); texture.context.restore();
      texture.add('open-' + i, 0, i * width, 0, width, height);
    }
    texture.add('closed', 0, 0, 0, width, height); texture.add('open', 0, width * 3, 0, width, height); texture.refresh();
  }
}
/** New rooms share the original material detail; the approved bedroom materials stay intact. */
export function drawRoomFinish(context: CanvasRenderingContext2D, source: HTMLImageElement, name: 'hall-floor' | 'hall-wall' | 'kitchen-floor' | 'kitchen-wall', ox: number, oy = 0) {
  const right = name.endsWith('wall'), bottom = name.startsWith('kitchen');
  const x = right ? 633 : 0, y = bottom ? 619 : 0;
  const width = right ? source.width - 633 : 633, height = bottom ? source.height - 619 : 619;
  context.imageSmoothingEnabled = false; context.drawImage(source, x, y, width, height, ox, oy, 64, right ? 90 : 64);
}
