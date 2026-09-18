import type { ArrivalId } from './arrival';

export type Rect = { x: number; y: number; width: number; height: number };
export type RoomMap = 'castle' | 'landing';
export type Position = { x: number; y: number; map?: RoomMap };
export type RoomObject = {
  id: string; label: string; bounds: Rect; collision?: Rect; collisions?: readonly Rect[]; anchor: Position;
  depth: number; actions: readonly ArrivalId[];
};
export const ROOM_SIZE = { width: 960, height: 540 };
export const WALK_AREA: Rect = { x: 80, y: 210, width: 800, height: 266 };
export const INTERACT_RANGE = 58;
export const PLAYER_FOOT = { halfWidth: 12, height: 10 };
export const BED_ENTRY: Rect = { x: 166, y: 266, width: 68, height: 18 };
export const BED_REST = { x: 200, y: 334 };
export const BED_EXIT = { x: 270, y: 300 };

// Rendering, host collision and interaction reach all share these authored objects.
// The lower footprint is solid; tall backs may correctly occlude a resident behind them.
export const roomObjects: readonly RoomObject[] = [
  { id: 'bed', label: 'Carved bed', bounds: { x: 150, y: 210, width: 100, height: 130 }, collisions: [{ x: 150, y: 244, width: 100, height: 12 }, { x: 150, y: 284, width: 100, height: 56 }], anchor: { x: 252, y: 272 }, depth: 340, actions: ['bed'] },
  { id: 'desk', label: 'Writing desk', bounds: { x: 330, y: 220, width: 105, height: 65 }, collision: { x: 330, y: 251, width: 105, height: 32 }, anchor: { x: 382, y: 289 }, depth: 283, actions: ['letter', 'candle-desk', 'desk'] },
  { id: 'hearth', label: 'Household hearth', bounds: { x: 500, y: 130, width: 112, height: 112 }, collision: { x: 500, y: 216, width: 112, height: 26 }, anchor: { x: 556, y: 250 }, depth: 242, actions: ['hearth'] },
  { id: 'pantry', label: 'Cacao cupboard', bounds: { x: 750, y: 114, width: 94, height: 136 }, collision: { x: 750, y: 214, width: 100, height: 36 }, anchor: { x: 800, y: 258 }, depth: 250, actions: ['pantry'] },
  { id: 'chest', label: 'Household chest', bounds: { x: 760, y: 355, width: 88, height: 52 }, collision: { x: 760, y: 381, width: 88, height: 26 }, anchor: { x: 804, y: 415 }, depth: 407, actions: ['chest'] },
  { id: 'bookshelf', label: 'Old bookshelf', bounds: { x: 82, y: 120, width: 100, height: 104 }, collision: { x: 82, y: 202, width: 100, height: 22 }, anchor: { x: 132, y: 232 }, depth: 224, actions: ['bookshelf'] },
  { id: 'plant', label: 'Moonfern', bounds: { x: 850, y: 290, width: 40, height: 62 }, collision: { x: 850, y: 328, width: 40, height: 24 }, anchor: { x: 842, y: 347 }, depth: 352, actions: ['plant'] },
  { id: 'side-table', label: 'Bedside table', bounds: { x: 240, y: 390, width: 60, height: 48 }, collision: { x: 240, y: 414, width: 60, height: 24 }, anchor: { x: 272, y: 446 }, depth: 438, actions: ['candle-table', 'side-table'] },
  { id: 'window-west', label: 'West window', bounds: { x: 244, y: 122, width: 52, height: 80 }, anchor: { x: 270, y: 218 }, depth: 202, actions: ['window-west'] },
  { id: 'window-east', label: 'East window', bounds: { x: 430, y: 122, width: 52, height: 80 }, anchor: { x: 456, y: 220 }, depth: 202, actions: ['window-east'] },
  { id: 'door-out', label: 'Castle landing', bounds: { x: 630, y: 114, width: 110, height: 136 }, collision: { x: 630, y: 216, width: 110, height: 34 }, anchor: { x: 685, y: 258 }, depth: 250, actions: ['door-out'] },
];
export const landingObjects: readonly RoomObject[] = [
  { id: 'door-home', label: 'Your room', bounds: { x: 420, y: 114, width: 120, height: 136 }, collision: { x: 420, y: 216, width: 120, height: 34 }, anchor: { x: 480, y: 258 }, depth: 250, actions: ['door-home'] },
  { id: 'window-west', label: 'West window', bounds: { x: 244, y: 122, width: 52, height: 80 }, anchor: { x: 270, y: 220 }, depth: 202, actions: ['window-west'] },
  { id: 'window-east', label: 'East window', bounds: { x: 654, y: 122, width: 52, height: 80 }, anchor: { x: 680, y: 220 }, depth: 202, actions: ['window-east'] },
  { id: 'landing-stairs', label: 'Old west stair', bounds: { x: 740, y: 340, width: 120, height: 108 }, collision: { x: 740, y: 356, width: 120, height: 92 }, anchor: { x: 800, y: 456 }, depth: 448, actions: ['landing-stairs'] },
];
export const getRoomObjects = (map: RoomMap = 'castle') => map === 'landing' ? landingObjects : roomObjects;
export const objectColliders = (object: RoomObject): readonly Rect[] => object.collisions ?? (object.collision ? [object.collision] : []);
export function inBedEntry(position: Position) {
  return (position.map ?? 'castle') === 'castle' && position.x >= BED_ENTRY.x && position.x <= BED_ENTRY.x + BED_ENTRY.width && position.y >= BED_ENTRY.y && position.y <= BED_ENTRY.y + BED_ENTRY.height;
}

function overlap(a: Rect, b: Rect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
export function footBounds(position: Position): Rect {
  return { x: position.x - PLAYER_FOOT.halfWidth, y: position.y - PLAYER_FOOT.height, width: PLAYER_FOOT.halfWidth * 2, height: PLAYER_FOOT.height };
}
export function canStand(position: Position, map: RoomMap = position.map ?? 'castle') {
  const foot = footBounds(position);
  return foot.x >= WALK_AREA.x && foot.x + foot.width <= WALK_AREA.x + WALK_AREA.width &&
    foot.y >= WALK_AREA.y && foot.y + foot.height <= WALK_AREA.y + WALK_AREA.height &&
    !getRoomObjects(map).some(object => objectColliders(object).some(rect => overlap(foot, rect)));
}
/** Repair only position when an older save stood where the new furniture now sits. */
export function safePosition(position: Position, map: RoomMap = position.map ?? 'castle'): Position {
  if (canStand(position, map)) return { x: position.x, y: position.y };
  let best: Position = { x: 480, y: 364 }, distance = Infinity;
  for (let y = WALK_AREA.y + PLAYER_FOOT.height; y <= WALK_AREA.y + WALK_AREA.height; y += 4) {
    for (let x = WALK_AREA.x + PLAYER_FOOT.halfWidth; x <= WALK_AREA.x + WALK_AREA.width - PLAYER_FOOT.halfWidth; x += 4) {
      const candidate = { x, y }, d = Math.hypot(x - position.x, y - position.y);
      if (d < distance && canStand(candidate, map)) { best = candidate; distance = d; }
    }
  }
  return best;
}
/** Sweep in small increments, sliding along edges. Diagonal speed stays bounded. */
export function moveInRoom(position: Position, dx: number, dy: number, distance = 14, map: RoomMap = position.map ?? 'castle'): Position {
  const result = safePosition(position, map);
  const divisor = Math.max(1, Math.hypot(dx, dy));
  const steps = Math.max(1, Math.ceil(distance / 2));
  const stepX = dx / divisor * distance / steps, stepY = dy / divisor * distance / steps;
  for (let step = 0; step < steps; step++) {
    if (canStand({ x: result.x + stepX, y: result.y }, map)) result.x += stepX;
    if (canStand({ x: result.x, y: result.y + stepY }, map)) result.y += stepY;
  }
  return result;
}
function closestPoint(position: Position, object: RoomObject): Position {
  const colliders = objectColliders(object);
  if (!colliders.length) return object.anchor;
  return colliders.map(r => ({ x: Math.max(r.x, Math.min(r.x + r.width, position.x)), y: Math.max(r.y, Math.min(r.y + r.height, position.y)) }))
    .sort((a, b) => Math.hypot(a.x - position.x, a.y - position.y) - Math.hypot(b.x - position.x, b.y - position.y))[0];
}
export function objectDistance(position: Position, object: RoomObject) {
  const point = closestPoint(position, object);
  return Math.hypot(point.x - position.x, point.y - position.y);
}
export function canInteract(position: Position, object: RoomObject) {
  if (!canStand(position) || objectDistance(position, object) > INTERACT_RANGE) return false;
  const end = closestPoint(position, object), length = Math.hypot(end.x - position.x, end.y - position.y);
  for (let step = 1; step < length; step += 2) {
    const x = position.x + (end.x - position.x) * step / length, y = position.y + (end.y - position.y) * step / length;
    if (getRoomObjects(position.map).some(other => other !== object && objectColliders(other).some(r => x > r.x && x < r.x + r.width && y > r.y && y < r.y + r.height))) return false;
  }
  return true;
}
export function objectForAction(action: ArrivalId, map?: RoomMap) { return (map ? getRoomObjects(map) : [...roomObjects, ...landingObjects]).find(object => object.actions.includes(action))!; }
export function nearestInteractable(position: Position) {
  return getRoomObjects(position.map).filter(object => canInteract(position, object)).sort((a, b) => objectDistance(position, a) - objectDistance(position, b))[0];
}

