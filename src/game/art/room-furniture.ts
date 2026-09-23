import type Phaser from 'phaser';
import { ROOM_FRAMES, ROOM_TEXTURE } from './room-atlas';
import { FLOOR_Y_SCALE } from '../../content/room';

/** The default views continue to use ROOM_TEXTURE, byte-for-byte original assets. */
export const FURNITURE_IMAGES = [
  { key: 'furniture-v8-directions', url: './art/furniture-v8-directions.png' },
  { key: 'furniture-v8-seats', url: './art/furniture-v8-seats.png' },
  { key: 'furniture-v8-beds', url: './art/furniture-v8-beds.png' },
  { key: 'furniture-v9-kitchen', url: './art/furniture-v9-kitchen.png' },
  { key: 'furniture-v9-overhead', url: './art/furniture-v9-overhead.png' },
] as const;
export type FurnitureSources = { original: CanvasImageSource; directions: CanvasImageSource; seats: CanvasImageSource; beds: CanvasImageSource; kitchen: CanvasImageSource; overhead: CanvasImageSource };

export type ArtTurn = 0 | 1 | 2 | 3;
type Spec = { width: number; depth: number; elevation: number };
export const FURNITURE_ART_SPECS: Record<string, Spec> = {
  bed: { width: 140, depth: 96, elevation: 34 }, desk: { width: 105, depth: 48, elevation: 17 },
  bookshelf: { width: 100, depth: 44, elevation: 60 }, pantry: { width: 94, depth: 54, elevation: 82 },
  chest: { width: 88, depth: 44, elevation: 8 }, 'side-table': { width: 60, depth: 36, elevation: 12 },
  sofa: { width: 146, depth: 44, elevation: 44 }, armchair: { width: 66, depth: 34, elevation: 36 },
  carpet: { width: 226, depth: 132, elevation: 0 }, stove: { width: 96, depth: 60, elevation: 28 },
  sink: { width: 112, depth: 56, elevation: 26 }, worktop: { width: 140, depth: 56, elevation: 20 },
};
export const SEAT_RISE = 24;
type Point = { x: number; y: number };
function groundPoint(spec: Spec, turn: ArtTurn, x: number, y: number): Point {
  return turn === 0 ? { x, y } : turn === 1 ? { x: (spec.depth - y) / FLOOR_Y_SCALE, y: x * FLOOR_Y_SCALE }
    : turn === 2 ? { x: spec.width - x, y: spec.depth - y } : { x: y / FLOOR_Y_SCALE, y: (spec.width - x) * FLOOR_Y_SCALE };
}
/** Anchors are world pixels relative to the object bounds, before any scene placement. */
export function furnitureArt(id: string, turn: ArtTurn = 0) {
  const spec = FURNITURE_ART_SPECS[id]; if (!spec) return undefined;
  const width = turn % 2 ? spec.depth / FLOOR_Y_SCALE : spec.width, height = (turn % 2 ? spec.width * FLOOR_Y_SCALE : spec.depth) + spec.elevation;
  const anchor = (x: number, y: number, rise: number) => { const p = groundPoint(spec, turn, x, y); return { x: p.x, y: p.y + spec.elevation - rise }; };
  return {
    texture: `furniture-${id}-${turn}`, width, height, nativeWidth: Math.ceil(width / 2), nativeHeight: Math.ceil(height / 2),
    full: 'open-0', base: 'base', foreground: 'foreground', openFrames: ['open-0', 'open-1', 'open-2', 'open-3'],
    seatRise: SEAT_RISE,
    seats: id === 'sofa' ? [-32, 32].map(offset => anchor(spec.width / 2 + offset, spec.depth / 2, SEAT_RISE))
      : id === 'armchair' ? [anchor(spec.width / 2, spec.depth / 2, SEAT_RISE)] : [],
    // Measured pillow centers in the original front and derived side/rear artwork.
    pillows: id === 'bed' ? [
      [{ x: 43, y: 37 }, { x: 97, y: 37 }],
      [{ x: 70, y: 61 }, { x: 70, y: 111 }],
      [{ x: 97, y: 79 }, { x: 43, y: 79 }],
      [{ x: 26, y: 111 }, { x: 26, y: 61 }],
    ][turn].map(p => turn % 2 ? { x: p.x * width / spec.depth, y: p.y * height / (spec.width + spec.elevation) } : p) : [],
  };
}
type Crop = { x: number; y: number; width: number; height: number };
const crop = (x: number, y: number, width: number, height: number): Crop => ({ x, y, width, height });
// Individually measured opaque bounds. The generated sheet is not a uniform grid.
const directionalCrops: Record<string, Crop[]> = {
  desk: [crop(95, 315, 144, 172), crop(406, 315, 274, 169), crop(847, 315, 144, 172)],
  bookshelf: [crop(137, 491, 117, 308), crop(439, 497, 208, 290), crop(832, 491, 117, 308)],
  pantry: [crop(134, 810, 108, 277), crop(428, 811, 230, 269), crop(844, 810, 108, 277)],
  chest: [crop(129, 1100, 122, 160), crop(419, 1107, 248, 152), crop(834, 1100, 123, 160)],
  'side-table': [crop(122, 1283, 119, 133), crop(463, 1282, 160, 134), crop(844, 1283, 121, 133)],
};
const bedCrops = [crop(92, 94, 439, 654), crop(619, 142, 526, 621), crop(1234, 94, 448, 654)];
const seatCrops = {
  // The sheet's right-side profile faces west, so it is assigned to turn 1.
  sofa: [crop(57, 140, 413, 324), crop(1297, 109, 141, 355), crop(836, 234, 348, 230), crop(593, 109, 140, 355)],
  armchair: [crop(132, 616, 262, 296), crop(1293, 600, 146, 303), crop(896, 677, 230, 226), crop(594, 601, 143, 302)],
};
const kitchenCrops: Record<string, Crop[]> = {
  stove: [crop(66, 56, 272, 328), crop(1016, 54, 177, 331), crop(677, 84, 285, 301), crop(429, 55, 187, 330)],
  sink: [crop(44, 450, 315, 325), crop(1026, 466, 176, 309), crop(658, 466, 319, 309), crop(425, 466, 175, 309)],
  worktop: [crop(31, 903, 394, 271), crop(1049, 850, 163, 325), crop(647, 903, 375, 272), crop(456, 850, 162, 325)],
};
const overheadChest = [crop(147, 1200, 190, 305), crop(550, 1200, 190, 305)];
const cutouts = new WeakMap<CanvasImageSource, HTMLCanvasElement>();
/** The generator's RGB checker matte is removed only outside closed dark sprite outlines. */
function exteriorCutout(source: CanvasImageSource): HTMLCanvasElement {
  const cached = cutouts.get(source); if (cached) return cached;
  const image = source as HTMLImageElement, canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width; canvas.height = image.naturalHeight || image.height;
  const c = canvas.getContext('2d')!; c.drawImage(source, 0, 0);
  const pixels = c.getImageData(0, 0, canvas.width, canvas.height), data = pixels.data;
  const visited = new Uint8Array(canvas.width * canvas.height), queue = new Uint32Array(visited.length);
  let head = 0, tail = 0;
  const visit = (index: number) => {
    if (index < 0 || index >= visited.length || visited[index]) return;
    visited[index] = 1; const p = index * 4, r = data[p], g = data[p + 1], b = data[p + 2];
    if (Math.min(r, g, b) < 88 || Math.max(r, g, b) - Math.min(r, g, b) > 24) return;
    queue[tail++] = index; data[p + 3] = 0;
  };
  for (let x = 0; x < canvas.width; x++) { visit(x); visit((canvas.height - 1) * canvas.width + x); }
  for (let y = 0; y < canvas.height; y++) { visit(y * canvas.width); visit(y * canvas.width + canvas.width - 1); }
  while (head < tail) {
    const index = queue[head++], x = index % canvas.width;
    if (x) visit(index - 1); if (x + 1 < canvas.width) visit(index + 1); visit(index - canvas.width); visit(index + canvas.width);
  }
  c.putImageData(pixels, 0, 0); cutouts.set(source, canvas); return canvas;
}

/** Top and near end are sampled separately: elevation is never stretched along the ground. */
function drawProfile(c: CanvasRenderingContext2D, source: CanvasImageSource, frame: Crop, id: string, width: number, height: number) {
  const plane = ({ desk: .37, 'side-table': .41, stove: .50, sink: .51, worktop: .54 } as Record<string, number>)[id];
  if (!plane) { c.drawImage(source, frame.x, frame.y, frame.width, frame.height, 0, 0, width, height); return; }
  const endHeight = Math.max(3, Math.round(FURNITURE_ART_SPECS[id].elevation / 2)), topHeight = height - endHeight;
  const split = Math.round(frame.height * plane);
  c.drawImage(source, frame.x, frame.y, frame.width, split, 0, 0, width, topHeight);
  c.drawImage(source, frame.x, frame.y + split, frame.width, frame.height - split, 0, topHeight, width, endHeight);
}

function nativeFurniture(id: string, turn: ArtTurn, sources: FurnitureSources) {
  const art = furnitureArt(id, turn)!;
  const canvas = document.createElement('canvas'); canvas.width = art.nativeWidth; canvas.height = art.nativeHeight;
  const c = canvas.getContext('2d')!; c.imageSmoothingEnabled = false;
  let source: CanvasImageSource, frame: Crop;
  if (kitchenCrops[id]) { source = exteriorCutout(sources.kitchen); frame = kitchenCrops[id][turn]; }
  else if (id === 'chest' && turn % 2) { source = exteriorCutout(sources.overhead); frame = overheadChest[turn === 1 ? 0 : 1]; }
  else if (id === 'sofa' || id === 'armchair') { source = sources.seats; frame = seatCrops[id][turn]; }
  else if (turn === 0) { source = sources.original; frame = ROOM_FRAMES.find(frame => frame.name === id)!; }
  else if (id === 'bed') { source = sources.beds; frame = bedCrops[turn - 1]; }
  else { source = sources.directions; frame = directionalCrops[id][turn === 1 ? 2 : turn === 3 ? 0 : 1]; }
  if (turn % 2) drawProfile(c, source, frame, id, canvas.width, canvas.height);
  else c.drawImage(source, frame.x, frame.y, frame.width, frame.height, 0, 0, canvas.width, canvas.height);
  // Original default pixels stay unchanged; only derived mattes are thresholded.
  if (source !== sources.original) {
    const pixels = c.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = pixels.data[i] < 192 ? 0 : 255;
    c.putImageData(pixels, 0, 0);
  }
  if (id === 'chest' && turn % 2) {
    // The long lid runs north/south. Put its latch on the facing edge, not on the end cap.
    const w = canvas.width, h = canvas.height, patch = c.getImageData(4, h - 6, 4, 5);
    c.putImageData(patch, Math.floor(w / 2) - 2, h - 6);
    const original = ROOM_FRAMES.find(f => f.name === 'chest')!;
    c.drawImage(sources.original, original.x + 112, original.y + 76, 39, 62, turn === 1 ? 0 : w - 4, Math.round(h / 2) - 3, 4, 6);
  }
  if (id === 'stove' && turn !== 0) {
    // The generated side/back render hid burners; reuse the fixture's full four-burner top plane.
    const kitchen = exteriorCutout(sources.kitchen);
    if (turn % 2) {
      const topHeight = canvas.height - Math.round(FURNITURE_ART_SPECS.stove.elevation / 2), topWidth = canvas.width - 4;
      c.save(); c.translate(canvas.width / 2, topHeight / 2); c.rotate(turn === 1 ? Math.PI / 2 : -Math.PI / 2);
      c.drawImage(kitchen, 95, 99, 207, 111, -topHeight / 2, -topWidth / 2, topHeight, topWidth); c.restore();
    } else c.drawImage(kitchen, 95, 99, 207, 111, 5, 3, canvas.width - 10, 13);
  }
  return canvas;
}

/** Preserves the approved three-diamond motif, normalized to the current floor footprint. */
function drawOriginalCarpet(context: CanvasRenderingContext2D, turn: ArtTurn) {
  const spec = FURNITURE_ART_SPECS.carpet;
  const rect = (x: number, y: number, width: number, height: number, color: string) => {
    const p = groundPoint(spec, turn, (x - 338) * spec.width / 318, y - 316);
    const q = groundPoint(spec, turn, (x + width - 338) * spec.width / 318, y + height - 316);
    context.fillStyle = color;
    context.fillRect(Math.round(Math.min(p.x, q.x) / 2), Math.round(Math.min(p.y, q.y) / 2),
      Math.max(1, Math.round(Math.abs(q.x - p.x) / 2)), Math.max(1, Math.round(Math.abs(q.y - p.y) / 2)));
  };
  rect(338, 316, 318, 132, '#342435'); rect(342, 320, 310, 124, '#77434b');
  for (const r of [[347, 325, 300, 2], [347, 437, 300, 2], [347, 325, 2, 114], [645, 325, 2, 114]]) rect(r[0], r[1], r[2], r[3], '#b18b67');
  rect(354, 332, 286, 100, '#57303e');
  for (let x = 365; x < 635; x += 18) {
    rect(x, 335, 4, 4, '#87545c'); rect(x, 425, 4, 4, '#87545c');
    rect(x, 316, 1, 3, '#9e7b5b'); rect(x, 445, 1, 3, '#9e7b5b');
  }
  for (const center of [418, 497, 576]) {
    for (let y = -28; y <= 28; y += 2) {
      const edge = Math.floor((28 - Math.abs(y)) * 1.1 / 2) * 2;
      rect(center - edge, 382 + y, 2, 2, '#8d5961'); rect(center + edge - 2, 382 + y, 2, 2, '#8d5961');
      if (Math.abs(y) < 20) { const inner = 20 - Math.abs(y); rect(center - inner, 382 + y, 2, 2, '#a47e62'); rect(center + inner, 382 + y, 2, 2, '#a47e62'); }
    }
    rect(center - 5, 381, 11, 3, '#8d5961'); rect(center - 1, 377, 3, 11, '#8d5961');
  }
}

/** Opening moves only the original lid, door leaves or drawer faces, never the furniture bitmap. */
function openingPose(c: CanvasRenderingContext2D, native: HTMLCanvasElement, id: string, turn: ArtTurn, amount: number, sources: FurnitureSources) {
  const w = native.width, h = native.height;
  c.drawImage(native, 0, 0);
  if (amount <= 0) return;
  const rect = (x: number, y: number, width: number, height: number, color: string) => { c.fillStyle = color; c.fillRect(x, y, width, height); };
  if (id === 'chest') {
    if (turn % 2) {
      const lidWidth = Math.max(3, Math.round((w - 4) * (1 - .80 * amount)));
      rect(2, 2, w - 4, h - 5, '#261d23'); rect(3, 3, w - 6, h - 7, '#443026');
      rect(4, 5, w - 8, h - 11, '#241e25');
      c.drawImage(native, 2, 1, w - 4, h - 5, turn === 1 ? w - 2 - lidWidth : 2, 1, lidWidth, h - 5);
      return;
    }
    const hinge = Math.round(h * (turn % 2 ? .4 : .46)), lid = Math.max(3, Math.round(hinge * (1 - .5 * amount)));
    c.clearRect(0, 0, w, hinge); rect(2, lid, w - 4, hinge - lid + 2, '#231b23');
    rect(3, hinge - 1, w - 6, 2, '#755039');
    c.drawImage(native, 0, 0, w, hinge, 0, 0, w, lid);
  } else if (turn % 2 && (id === 'pantry' || id === 'desk' || id === 'side-table')) {
    const front = nativeFurniture(id, 0, sources), extent = Math.max(1, Math.round(amount * 4));
    const x = turn === 1 ? 0 : w - extent;
    if (id === 'pantry') {
      const y = Math.round(h * .64), height = Math.round(h * .27);
      c.drawImage(front, 4, 40, 18, 23, x, y, extent, height);
    } else {
      const positions = id === 'desk' ? [Math.round(h * .22), Math.round(h * .68)] : [Math.round(h * .48)];
      for (const y of positions) c.drawImage(front, Math.round(front.width * .1), Math.round(front.height * .46), Math.round(front.width * .2), 5, x, y, extent, 5);
    }
  } else if (turn === 0 && id === 'pantry') {
    const y = Math.round(h * .59), height = Math.round(h * .32), left = Math.round(w * .09), leaf = Math.round(w * .38), right = Math.round(w * .53);
    rect(left, y, right + leaf - left, height, '#2a2024');
    c.drawImage(native, left, Math.round(h * .17), right + leaf - left, Math.round(h * .35), left + 2, y + 2, right + leaf - left - 4, height - 4);
    rect(left + 1, y + height / 2, right + leaf - left - 2, 1, '#86613b');
    const folded = Math.max(3, Math.round(leaf * (1 - .82 * amount)));
    c.drawImage(native, left, y, leaf, height, left, y, folded, height);
    c.drawImage(native, right, y, leaf, height, right + leaf - folded, y, folded, height);
  } else if (turn === 0 && (id === 'desk' || id === 'side-table')) {
    const positions = id === 'desk' ? [Math.round(w * .1), Math.round(w * .73)] : [Math.round(w * .22)];
    const width = Math.round(w * (id === 'desk' ? .2 : .57)), y = Math.round(h * .46), height = Math.max(3, Math.round(h * .16)), drop = Math.round(amount * 3);
    for (const x of positions) { rect(x, y, width, height + drop, '#211b23'); c.drawImage(native, x, y, width, height, x, y + drop, width, height); }
  }
  // Rear panels correctly occlude the opening doors/drawers.
}

function foregroundPixel(id: string, turn: ArtTurn, x: number, y: number, w: number, h: number) {
  if (id === 'bed') {
    // Masks are measured in the source view. Reproject their coordinates with the
    // artwork so every pillow opening follows its resident at the corrected scale.
    if (turn % 2) { x *= 48 / w; y *= 87 / h; }
    if (turn === 0) return y >= 27;
    if (turn === 1) return x < 28 || x >= 43 || y >= 68;
    if (turn === 2) return y <= 29 || y >= 49;
    return x >= 20 || x < 5 || y >= 68;
  }
  if (id === 'sofa' || id === 'armchair') {
    if (turn === 0) return y >= h * .77 || y > h * .44 && (x < w * .17 || x >= w * .83);
    if (turn === 2) return y >= h * .29;
    return y >= h * .79;
  }
  return false;
}

/** Approved raster designs with separately generated upright directional extensions. */
export function drawFurniture(context: CanvasRenderingContext2D, id: string, turn: ArtTurn, part: 'full' | 'base' | 'foreground', opening = 0, sources?: FurnitureSources) {
  if (id === 'carpet') { if (part !== 'foreground') drawOriginalCarpet(context, turn); return; }
  if (!sources) throw new Error('Furniture raster sources must be loaded before drawing.');
  const native = nativeFurniture(id, turn, sources);
  if (part === 'full') { openingPose(context, native, id, turn, opening, sources); return; }
  const c = native.getContext('2d')!, data = c.getImageData(0, 0, native.width, native.height);
  for (let y = 0; y < native.height; y++) for (let x = 0; x < native.width; x++) {
    if (foregroundPixel(id, turn, x, y, native.width, native.height) !== (part === 'foreground')) data.data[(y * native.width + x) * 4 + 3] = 0;
  }
  c.putImageData(data, 0, 0); context.drawImage(native, 0, 0);
}

export function buildFurnitureTextures(scene: Phaser.Scene) {
  const sources: FurnitureSources = {
    original: scene.textures.get(ROOM_TEXTURE).getSourceImage() as HTMLImageElement,
    directions: scene.textures.get('furniture-v8-directions').getSourceImage() as HTMLImageElement,
    seats: scene.textures.get('furniture-v8-seats').getSourceImage() as HTMLImageElement,
    beds: scene.textures.get('furniture-v8-beds').getSourceImage() as HTMLImageElement,
    kitchen: scene.textures.get('furniture-v9-kitchen').getSourceImage() as HTMLImageElement,
    overhead: scene.textures.get('furniture-v9-overhead').getSourceImage() as HTMLImageElement,
  };
  for (const id of Object.keys(FURNITURE_ART_SPECS)) for (const turn of [0, 1, 2, 3] as ArtTurn[]) {
    const art = furnitureArt(id, turn)!;
    const texture = scene.textures.createCanvas(art.texture, art.nativeWidth * 6, art.nativeHeight)!;
    texture.context.imageSmoothingEnabled = false;
    for (const [index, name] of ['base', 'foreground', ...art.openFrames].entries()) {
      texture.context.save(); texture.context.translate(index * art.nativeWidth, 0);
      // Translation only places atlas cells; orientation is authored through ground/elevation geometry.
      texture.context.beginPath(); texture.context.rect(0, 0, art.nativeWidth, art.nativeHeight); texture.context.clip();
      drawFurniture(texture.context, id, turn, index < 2 ? name as 'base' | 'foreground' : 'full', Math.max(0, index - 2) / 3, sources);
      texture.context.restore(); texture.add(name, 0, index * art.nativeWidth, 0, art.nativeWidth, art.nativeHeight);
    }
    texture.refresh();
  }
}
