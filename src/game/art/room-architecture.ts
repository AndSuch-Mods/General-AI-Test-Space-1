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

export function drawDoor(context: CanvasRenderingContext2D, source: CanvasImageSource, wall: DoorWall, amount: number) {
  const art = doorArt(wall), frame = Math.max(0, Math.min(3, Math.round(amount * 3))), crop = DOOR_CROPS[wall][frame];
  context.imageSmoothingEnabled = false;
  if (wall === 'south' && frame === 3) {
    // Keep the same left hinge as the preceding overhead opening poses.
    context.save(); context.translate(art.width / 2, 0); context.scale(-1, 1);
    context.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, art.width / 2, art.height / 2);
    context.restore(); return;
  }
  if (wall === 'north' && frame === 2) {
    // Reuse the original walnut leaf and recess. The supplied middle poses were
    // nearly identical; compress the leaf's horizontal projection for 60 degrees.
    const back = DOOR_CROPS.north[3], leaf = DOOR_CROPS.north[1];
    context.drawImage(source, back.x, back.y, back.width, back.height, 0, 0, art.width / 2, art.height / 2);
    context.save(); context.translate(8, 0); context.scale(.57, 1); context.translate(-8, 0);
    context.beginPath(); context.moveTo(8, 12); context.lineTo(29, 17); context.lineTo(29, 67); context.lineTo(8, 60); context.closePath(); context.clip();
    context.drawImage(source, leaf.x, leaf.y, leaf.width, leaf.height, 0, 0, art.width / 2, art.height / 2);
    context.restore(); return;
  }
  context.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, art.width / 2, art.height / 2);
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
