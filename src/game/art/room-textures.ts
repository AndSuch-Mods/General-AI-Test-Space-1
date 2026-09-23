import type Phaser from 'phaser';
import { getRoomObjects } from '../../content/room';
import { ROOM_TEXTURE, ROOM_FRAMES, ROOM_FLAME_FRAMES, ROOM_FIRE_SIZE } from './room-atlas';
import { drawWindowFrame, WINDOW_FRAME_NATIVE } from './room-window-art';
import { buildFurnitureTextures } from './room-furniture';
import { buildDoorTextures, drawRoomFinish } from './room-architecture';
export { inWindowPane } from './room-window-art';

/** All environment art resolves to one native pixel per two world units. */
export const ENV_PIXEL = 2;
export function buildRoomTextures(scene: Phaser.Scene) {
  // Eighty-pixel cells fit the wider two-resident bed without overlapping the desk.
  const props = scene.textures.createCanvas('props-native', 384, 384)!;
  props.context.imageSmoothingEnabled = false;
  const source = scene.textures.get(ROOM_TEXTURE).getSourceImage() as HTMLImageElement;
  ROOM_FRAMES.forEach((frame, index) => {
    const object = getRoomObjects().find(object => object.id === frame.name || frame.name === 'window' && object.id === 'window-west');
    const size = object?.bounds ?? ({ candle: { width: 10, height: 24 }, letter: { width: 22, height: 16 }, parcel: { width: 22, height: 26 } }[frame.name as 'candle' | 'letter' | 'parcel']);
    const width = frame.name === 'window' ? WINDOW_FRAME_NATIVE.width : Math.ceil(size.width / ENV_PIXEL), height = frame.name === 'window' ? WINDOW_FRAME_NATIVE.height : Math.ceil(size.height / ENV_PIXEL);
    const x = index % 4 * 96, y = Math.floor(index / 4) * 96;
    if (frame.name === 'window') drawWindowFrame(props.context, source, x, y);
    else props.context.drawImage(source, frame.x, frame.y, frame.width, frame.height, x, y, width, height);
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
  // A closed forest-green journal with a brass clasp, distinct from the sealed letter.
  const notebook = props.context;
  notebook.fillStyle = '#251e29'; notebook.fillRect(160, 240, 9, 7);
  notebook.fillStyle = '#53715b'; notebook.fillRect(161, 240, 7, 5);
  notebook.fillStyle = '#314b3b'; notebook.fillRect(162, 241, 6, 4);
  notebook.fillStyle = '#baa782'; notebook.fillRect(161, 245, 7, 1);
  notebook.fillStyle = '#bf9a58'; notebook.fillRect(167, 242, 2, 1); notebook.fillRect(161, 241, 1, 3);
  props.add('journal', 0, 160, 240, 9, 7);
  props.refresh();
  const materials = scene.textures.createCanvas('materials-native', 384, 90)!;
  materials.context.imageSmoothingEnabled = false;
  const materialSource = scene.textures.get('room-materials').getSourceImage() as HTMLImageElement;
  materials.context.drawImage(materialSource, 0, 0, 887, 887, 0, 0, 64, 64);
  materials.context.drawImage(materialSource, 887, 0, 887, 812, 64, 0, 64, 90);
  materials.add('floor', 0, 0, 0, 64, 64); materials.add('wall', 0, 64, 0, 64, 90);
  const householdSource = scene.textures.get('household-materials-v8').getSourceImage() as HTMLImageElement;
  for (const [index, name] of (['hall-floor', 'hall-wall', 'kitchen-floor', 'kitchen-wall'] as const).entries()) {
    const x = 128 + index * 64;
    materials.context.save(); materials.context.beginPath(); materials.context.rect(x, 0, 64, 90); materials.context.clip(); drawRoomFinish(materials.context, householdSource, name, x); materials.context.restore();
    materials.add(name, 0, x, 0, 64, name.endsWith('floor') ? 64 : 90);
  }
  materials.refresh();
  const width = ROOM_FIRE_SIZE.width / ENV_PIXEL, height = ROOM_FIRE_SIZE.height / ENV_PIXEL;
  const flames = scene.textures.createCanvas('flames-native', width * 6, height)!;
  flames.context.imageSmoothingEnabled = false;
  const flameSource = scene.textures.get('room-flames').getSourceImage() as HTMLImageElement;
  ROOM_FLAME_FRAMES.forEach((frame, index) => {
    flames.context.drawImage(flameSource, frame.x, frame.y, frame.width, frame.height, index * width, 0, width, height);
    flames.add(frame.name, 0, index * width, 0, width, height);
  });
  flames.refresh();
  // A tiny sleepy huff: stepped cream cloud, plum outline and a brass annoyance mark.
  const huff = scene.textures.createCanvas('resident-reaction', 14, 12)!;
  const h = huff.context;
  h.fillStyle = '#483642'; h.fillRect(3, 1, 7, 8); h.fillRect(1, 3, 11, 4);
  h.fillStyle = '#d5c6a8'; h.fillRect(3, 2, 7, 6); h.fillRect(2, 3, 9, 3);
  h.fillStyle = '#9d7052'; h.fillRect(4, 3, 1, 2); h.fillRect(5, 4, 3, 1); h.fillRect(8, 3, 1, 2);
  h.fillStyle = '#d5c6a8'; h.fillRect(10, 8, 2, 2); h.fillRect(12, 11, 1, 1);
  huff.refresh();
  buildFurnitureTextures(scene);
  buildDoorTextures(scene);
}
