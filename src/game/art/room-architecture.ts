import type Phaser from 'phaser';

export const ARCHITECTURE_IMAGES = [
  { key: 'door-source-v8', path: 'art/doors-v8.png' },
  { key: 'household-materials-v8', path: 'art/household-materials-v8.png' },
] as const;
export type DoorWall = 'north' | 'west' | 'south' | 'east';
type Crop = { x: number; y: number; width: number; height: number };

// Measured art bounds, not assumed grid cells. All frames in a row share a sill.
const DOOR_CROPS: Record<DoorWall, Crop[]> = {
  north: [72, 386, 687, 994].map((x, i) => ({ x, y: 37, width: [196, 195, 196, 194][i], height: 282 })),
  west: [118, 432, 738, 1052].map(x => ({ x, y: 368, width: 80, height: 318 })),
  south: [59, 375, 677, 993].map((x, i) => ({ x, y: 722, width: [224, 217, 209, 210][i], height: 134 })),
  east: [141, 451, 752, 1061].map(x => ({ x, y: 909, width: 84, height: 310 })),
};

export function doorArt(wall: DoorWall) {
  return { texture: `door-v8-${wall}`, width: wall === 'north' || wall === 'south' ? 86 : 32,
    height: wall === 'north' ? 136 : wall === 'south' ? 36 : 120, closed: 'closed', open: 'open', openFrames: ['open-0', 'open-1', 'open-2', 'open-3'] };
}

type DoorRaster = { width: number; height: number; data: Uint8ClampedArray };
/** Native moving-leaf region. Jambs, lintel and threshold outside it never move. */
export function doorAperture(wall: DoorWall) {
  return wall === 'north' ? { x: 8, y: 13, width: 27, height: 51 }
    : wall === 'south' ? undefined : { x: 4, y: 11, width: 8, height: 43 };
}
export function doorNativePixels(source: DoorRaster, wall: DoorWall, amount: number): DoorRaster {
  const art = doorArt(wall), width = art.width / 2, height = art.height / 2;
  const frame = Math.max(0, Math.min(3, Math.round(amount * 3))), data = new Uint8ClampedArray(width * height * 4);
  const sample = (state: number, x: number, y: number) => {
    const crop = DOOR_CROPS[wall][state], u = (x + .5) / width;
    // Remove the source's isometric diagonal from both side-wall jambs. The
    // same column mapping rectifies every leaf state against a straight wall.
    const skew = wall === 'west' ? 56 * (1 - u) : wall === 'east' ? 56 * u : 0;
    const depth = crop.height - (wall === 'west' || wall === 'east' ? 56 : 0);
    const sx = crop.x + Math.floor(u * crop.width), sy = crop.y + Math.floor(skew + (y + .5) * depth / height);
    return source.data.subarray((sy * source.width + sx) * 4, (sy * source.width + sx) * 4 + 4);
  };
  const aperture = doorAperture(wall);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let color = sample(0, x, y);
    if (wall === 'south') color = sample(frame, frame === 3 ? width - 1 - x : x, y);
    else if (frame && aperture && x >= aperture.x && x < aperture.x + aperture.width && y >= aperture.y && y < aperture.y + aperture.height) {
      if (wall === 'north') {
        const leafWidth = [27, 20, 11, 4][frame], leafX = x - aperture.x;
        color = sample(3, 20 + Math.floor(leafX * 13 / aperture.width), y);
        const leafY = y - Math.round(leafX / leafWidth * [0, 3, 5, 6][frame]);
        if (leafX < leafWidth && leafY >= aperture.y) color = sample(0, aperture.x + Math.floor(leafX * aperture.width / leafWidth), leafY);
      } else color = sample(frame, x, y);
    }
    const at = (y * width + x) * 4;
    if (color[3] >= 192) { data.set(color, at); data[at + 3] = 255; }
  }
  return { width, height, data };
}
const doorSources = new WeakMap<CanvasImageSource, DoorRaster>();
export function drawDoor(context: CanvasRenderingContext2D, source: CanvasImageSource, wall: DoorWall, amount: number) {
  let pixels = doorSources.get(source);
  if (!pixels) {
    const image = source as HTMLImageElement, canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || image.width; canvas.height = image.naturalHeight || image.height;
    const c = canvas.getContext('2d')!; c.drawImage(source, 0, 0);
    pixels = { width: canvas.width, height: canvas.height, data: c.getImageData(0, 0, canvas.width, canvas.height).data };
    doorSources.set(source, pixels);
  }
  const native = doorNativePixels(pixels, wall, amount), canvas = document.createElement('canvas');
  canvas.width = native.width; canvas.height = native.height;
  const c = canvas.getContext('2d')!, image = c.createImageData(native.width, native.height);
  image.data.set(native.data); c.putImageData(image, 0, 0);
  context.imageSmoothingEnabled = false; context.drawImage(canvas, 0, 0);
}

export function buildDoorTextures(scene: Phaser.Scene) {
  const source = scene.textures.get('door-source-v8').getSourceImage() as HTMLImageElement;
  for (const wall of ['north', 'west', 'south', 'east'] as DoorWall[]) {
    const art = doorArt(wall), width = art.width / 2, height = art.height / 2;
    const texture = scene.textures.createCanvas(art.texture, width * 4, height)!;
    for (let i = 0; i < 4; i++) {
      texture.context.save(); texture.context.translate(i * width, 0); drawDoor(texture.context, source, wall, i / 3); texture.context.restore();
      texture.add(`open-${i}`, 0, i * width, 0, width, height);
    }
    const pixels = texture.context.getImageData(0, 0, width * 4, height);
    for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = pixels.data[i] < 192 ? 0 : 255;
    texture.context.putImageData(pixels, 0, 0);
    texture.add('closed', 0, 0, 0, width, height); texture.add('open', 0, width * 3, 0, width, height); texture.refresh();
  }
}

/** New rooms share the original material detail; the approved bedroom materials stay intact. */
export function drawRoomFinish(context: CanvasRenderingContext2D, source: HTMLImageElement, name: 'hall-floor' | 'hall-wall' | 'kitchen-floor' | 'kitchen-wall', ox: number, oy = 0) {
  const right = name.endsWith('wall'), bottom = name.startsWith('kitchen');
  const x = right ? 633 : 0, y = bottom ? 619 : 0;
  const width = right ? source.width - 633 : 633, height = bottom ? source.height - 619 : 619;
  context.imageSmoothingEnabled = false;
  context.drawImage(source, x, y, width, height, ox, oy, 64, right ? 90 : 64);
}
