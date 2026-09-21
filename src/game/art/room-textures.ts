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
  // Eighty-pixel cells fit the wider two-resident bed without overlapping the desk.
  const props = scene.textures.createCanvas('props-native', 320, 320)!;
  props.context.imageSmoothingEnabled = false;
  const source = scene.textures.get(ROOM_TEXTURE).getSourceImage() as HTMLImageElement;
  ROOM_FRAMES.forEach((frame, index) => {
    const object = getRoomObjects().find(object => object.id === frame.name || frame.name === 'window' && object.id === 'window-west');
    const size = object?.bounds ?? ({ candle: { width: 10, height: 24 }, letter: { width: 22, height: 16 }, parcel: { width: 22, height: 26 } }[frame.name as 'candle' | 'letter' | 'parcel']);
    const width = Math.ceil(size.width / ENV_PIXEL), height = Math.ceil(size.height / ENV_PIXEL);
    const x = index % 4 * 80, y = Math.floor(index / 4) * 80;
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
  // Original walnut seat frames reuse the room's burgundy quilt weave as upholstery.
  const bedSource = ROOM_FRAMES.find(frame => frame.name === 'bed')!;
  const seat = (name: 'sofa' | 'armchair', x: number, y: number, width: number, height: number) => {
    const c = props.context;
    const rect = (px: number, py: number, w: number, h: number, color: string) => { c.fillStyle = color; c.fillRect(x + px, y + py, w, h); };
    const cloth = (px: number, py: number, w: number, h: number) => c.drawImage(source, bedSource.x + 25, bedSource.y + 170, bedSource.width - 50, 110, x + px, y + py, w, h);
    const arm = name === 'sofa' ? 9 : 7, backBottom = name === 'sofa' ? 25 : 20;
    rect(4, 3, width - 8, height - 7, '#251d29');
    rect(7, 1, width - 14, 4, '#805735'); rect(8, 2, width - 16, 1, '#ad7d4d');
    rect(5, 5, width - 10, backBottom - 2, '#58372f');
    cloth(arm, 6, width - arm * 2, backBottom - 7);
    rect(arm, backBottom - 1, width - arm * 2, 2, '#432634');
    cloth(arm - 1, backBottom + 1, width - arm * 2 + 2, 9);
    rect(arm - 1, backBottom, width - arm * 2 + 2, 1, '#9a626a');
    rect(arm - 1, backBottom + 9, width - arm * 2 + 2, 4, '#49303b');
    for (const side of [0, width - arm]) {
      rect(side, backBottom - 10, arm, 22, '#2d222a');
      rect(side + 1, backBottom - 12, arm - 2, 6, '#8b6140');
      rect(side + 2, backBottom - 11, arm - 3, 2, '#b48654');
      rect(side + 2, backBottom - 5, arm - 4, 16, '#694530');
      rect(side + 2, height - 5, 4, 5, '#30222a');
      rect(side + 2, height - 5, 2, 3, '#815437');
    }
    for (let px = arm + 5; px < width - arm; px += 12) rect(px, backBottom + 11, 1, 1, '#b18b52');
    if (name === 'sofa') for (const divider of [27, 45]) {
      rect(divider, 7, 1, 16, '#55313e'); rect(divider, backBottom + 2, 1, 7, '#56313d');
    }
    props.add(name, 0, x, y, width, height);
  };
  seat('sofa', 0, 240, 73, 44); seat('armchair', 80, 240, 33, 35);
  // A closed forest-green journal with a brass clasp, distinct from the sealed letter.
  const notebook = props.context;
  notebook.fillStyle = '#251e29'; notebook.fillRect(160, 240, 9, 7);
  notebook.fillStyle = '#53715b'; notebook.fillRect(161, 240, 7, 5);
  notebook.fillStyle = '#314b3b'; notebook.fillRect(162, 241, 6, 4);
  notebook.fillStyle = '#baa782'; notebook.fillRect(161, 245, 7, 1);
  notebook.fillStyle = '#bf9a58'; notebook.fillRect(167, 242, 2, 1); notebook.fillRect(161, 241, 1, 3);
  props.add('journal', 0, 160, 240, 9, 7);
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
  // A room-sized walnut frame sits in the wall, with the threshold at the skirting.
  // This native pixel drawing uses the same wood/brass palette as the furnishings.
  const wood = scene.textures.createCanvas('wood-door', 86, 68)!;
  const c = wood.context;
  const rect = (x: number, y: number, w: number, h: number, color: string) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
  for (const [index, name] of ['closed', 'open'].entries()) {
    const x = index * 43;
    rect(x, 0, 43, 68, '#241c25'); rect(x + 1, 1, 41, 67, '#694831');
    rect(x + 3, 3, 37, 64, '#3a292b'); rect(x + 5, 5, 33, 61, '#17151e');
    rect(x + 1, 1, 41, 2, '#9b724b'); rect(x + 2, 3, 2, 63, '#84603f'); rect(x + 39, 3, 2, 63, '#523b2e');
    rect(x + 3, 65, 37, 2, '#ad8759');
    if (name === 'closed') {
      rect(x + 6, 6, 31, 59, '#68452f');
      for (let col = 7; col < 36; col += 5) { rect(x + col, 7, 1, 57, '#785337'); rect(x + col + 3, 8, 1, 56, '#4e342a'); }
      for (const y of [10, 36]) for (const px of [10, 24]) {
        rect(x + px - 1, y - 1, 10, 23, '#9a6c43'); rect(x + px, y, 10, 23, '#3f2c28'); rect(x + px, y + 1, 8, 20, '#63402e'); rect(x + px + 1, y + 2, 1, 18, '#795035');
      }
      rect(x + 32, 32, 2, 5, '#322730'); rect(x + 32, 33, 2, 2, '#c29b58');
    } else {
      rect(x + 5, 6, 9, 58, '#69432d'); rect(x + 6, 7, 2, 56, '#8d613c'); rect(x + 12, 7, 2, 57, '#3a2927');
      rect(x + 10, 31, 2, 3, '#b38b51'); rect(x + 15, 61, 21, 3, '#39303a');
    }
    wood.add(name, 0, x, 0, 43, 68);
  }
  wood.refresh();
  // A tiny sleepy huff: stepped cream cloud, plum outline and a brass annoyance mark.
  const huff = scene.textures.createCanvas('resident-reaction', 14, 12)!;
  const h = huff.context;
  h.fillStyle = '#483642'; h.fillRect(3, 1, 7, 8); h.fillRect(1, 3, 11, 4);
  h.fillStyle = '#d5c6a8'; h.fillRect(3, 2, 7, 6); h.fillRect(2, 3, 9, 3);
  h.fillStyle = '#9d7052'; h.fillRect(4, 3, 1, 2); h.fillRect(5, 4, 3, 1); h.fillRect(8, 3, 1, 2);
  h.fillStyle = '#d5c6a8'; h.fillRect(10, 8, 2, 2); h.fillRect(12, 11, 1, 1);
  huff.refresh();
}
