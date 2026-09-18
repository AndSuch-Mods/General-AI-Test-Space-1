/** Measured regions in original generated sheets. Furniture remains separate from the room. */
export const ROOM_TEXTURE = 'room-v2-props';
export const ROOM_IMAGE = './art/room-v2-props.png';
export const ROOM_MATERIAL_IMAGE = './art/room-v2-materials.png';
export const ROOM_FLAME_IMAGE = './art/room-v2-flames.png';
export const ROOM_FIRE_SIZE = { width: 48, height: 46 };
export const ROOM_FRAMES = [
  { name: 'bed', x: 76, y: 12, width: 287, height: 401 },
  { name: 'desk', x: 411, y: 141, width: 316, height: 225 },
  { name: 'hearth', x: 764, y: 79, width: 310, height: 303 },
  { name: 'pantry', x: 1124, y: 45, width: 246, height: 356 },
  { name: 'bookshelf', x: 96, y: 420, width: 243, height: 340 },
  { name: 'chest', x: 455, y: 530, width: 262, height: 173 },
  { name: 'plant', x: 823, y: 500, width: 203, height: 225 },
  { name: 'side-table', x: 1155, y: 526, width: 183, height: 183 },
  { name: 'window', x: 75, y: 764, width: 288, height: 302 },
  { name: 'candle', x: 546, y: 813, width: 84, height: 222 },
  { name: 'letter', x: 846, y: 889, width: 145, height: 102 },
  { name: 'parcel', x: 1179, y: 852, width: 174, height: 187 },
] as const;

// Common frame bottoms keep fire rooted in the grate while the tongues change shape.
export const ROOM_FLAME_FRAMES = Array.from({ length: 6 }, (_, index) => ({
  name: `fire-${index}`, x: 96 + index % 3 * 512, y: index < 3 ? 80 : 562, width: 352, height: 384,
}));

export const CANDLES = [
  { flag: 'candle-desk', x: 410, y: 215, depth: 284 },
  { flag: 'candle-table', x: 268, y: 382, depth: 439 },
] as const;

