import type Phaser from 'phaser';
import { getRoomObjects } from '../../content/room';
import { ROOM_TEXTURE, ROOM_FRAMES, ROOM_EXTRA_FRAMES, ROOM_FLAME_FRAMES, ROOM_FIRE_SIZE } from './room-atlas';

/** All environment art resolves to one native pixel per two world units. */
export const ENV_PIXEL = 2;
export function inWindowPane(x: number, y: number) {
  if (y < 8 || y > 34 || x < 9 || x > 18 || x === 13) return false;
  return y >= 14 || Math.abs(x - 13.5) <= y - 7;
}
export function buildRoomTextures(scene: Phaser.Scene) {
  const props = scene.textures.createCanvas('props-native', 256, 240)!;
  props.context.imageSmoothingEnabled = false;
  const source = scene.textures.get(ROOM_TEXTURE).getSourceImage() as HTMLImageElement;
  ROOM_FRAMES.forEach((frame, index) => {
    const object = getRoomObjects().find(object => object.id === frame.name || frame.name === 'window' && object.id === 'window-west');
    const size = object?.bounds ?? ({ candle: { width: 10, height: 24 }, letter: { width: 22, height: 16 }, parcel: { width: 22, height: 26 } }[frame.name as 'candle' | 'letter' | 'parcel']);
    const width = Math.ceil(size.width / ENV_PIXEL), height = Math.ceil(size.height / ENV_PIXEL);
    const x = index % 4 * 64, y = Math.floor(index / 4) * 80;
    props.context.drawImage(source, frame.x, frame.y, frame.width, frame.height, x, y, width, height);
    if (frame.name === 'window') for (let py = 0; py < height; py++) for (let px = 0; px < width; px++) {
      if (inWindowPane(px, py)) props.context.clearRect(x + px, y + py, 1, 1);
    }
    props.add(frame.name, 0, x, y, width, height);
    if (frame.name === 'bed') {
      props.add('bed-back', 0, x, y, width, 27);
      props.add('bed-front', 0, x, y + 27, width, height - 27);
    }
    if (frame.name === 'chest') {
      props.add('chest-lid', 0, x, y, width, 12);
      props.add('chest-base', 0, x, y + 12, width, height - 12);
    }
    if (frame.name === 'pantry') {
      props.add('pantry-left', 0, x + 4, y + 39, 18, 25);
      props.add('pantry-right', 0, x + 25, y + 39, 18, 25);
    }
    if (frame.name === 'desk') {
      props.add('desk-left', 0, x + 5, y + 17, 11, 8);
      props.add('desk-right', 0, x + 39, y + 17, 11, 8);
    }
  });
  props.refresh();
  const materials = scene.textures.createCanvas('materials-native', 128, 68)!;
  materials.context.imageSmoothingEnabled = false;
  const materialSource = scene.textures.get('room-materials').getSourceImage() as HTMLImageElement;
  materials.context.drawImage(materialSource, 0, 0, 887, 887, 0, 0, 64, 64);
  materials.context.drawImage(materialSource, 887, 0, 887, 812, 64, 0, 64, 68);
  materials.add('floor', 0, 0, 0, 64, 64); materials.add('wall', 0, 64, 0, 64, 68); materials.refresh();
  const width = ROOM_FIRE_SIZE.width / ENV_PIXEL, height = ROOM_FIRE_SIZE.height / ENV_PIXEL;
  const flames = scene.textures.createCanvas('flames-native', width * 6, height)!;
  flames.context.imageSmoothingEnabled = false;
  const flameSource = scene.textures.get('room-flames').getSourceImage() as HTMLImageElement;
  ROOM_FLAME_FRAMES.forEach((frame, index) => {
    flames.context.drawImage(flameSource, frame.x, frame.y, frame.width, frame.height, index * width, 0, width, height);
    flames.add(frame.name, 0, index * width, 0, width, height);
  });
  flames.refresh();
  const doors = scene.textures.createCanvas('doors-native', 192, 80)!;
  doors.context.imageSmoothingEnabled = false;
  const doorSource = scene.textures.get('room-doors').getSourceImage() as HTMLImageElement;
  ROOM_EXTRA_FRAMES.forEach((frame, index) => {
    const width = frame.name === 'stairs' ? 60 : 55, height = frame.name === 'stairs' ? 54 : 68;
    doors.context.drawImage(doorSource, frame.x, frame.y, frame.width, frame.height, index * 64, 0, width, height);
    doors.add(frame.name, 0, index * 64, 0, width, height);
  });
  // Drop faint generated matte pixels at the native grid so the cutouts remain crisp.
  const pixels = doors.context.getImageData(0, 0, 192, 80);
  for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = pixels.data[i] < 192 ? 0 : 255;
  doors.context.putImageData(pixels, 0, 0); doors.refresh();
}
