import type { ArrivalId } from './arrival';

export type Rect = { x: number; y: number; width: number; height: number };
export type RoomMap = 'castle' | 'bedroom-2' | 'living' | 'landing';
export type Position = { x: number; y: number; map?: RoomMap };
export const FURNITURE_IDS = ['bed', 'desk', 'side-table', 'bookshelf', 'pantry', 'chest', 'candle-desk', 'candle-table', 'carpet', 'plant', 'sofa', 'armchair'] as const;
export type FurnitureId = typeof FURNITURE_IDS[number];
export type RoomLayout = Partial<Record<FurnitureId, { x: number; y: number }>>;
export type RoomObject = {
  id: string; label: string; bounds: Rect; collision?: Rect; collisions?: readonly Rect[]; anchor: Position;
  depth: number; actions: readonly ArrivalId[];
  door?: { wall: 'north' | 'south' | 'west' | 'east'; to: RoomMap; counterpart: ArrivalId };
};
export const ROOM_SIZE = { width: 960, height: 540 };
export const WALK_AREA: Rect = { x: 80, y: 210, width: 800, height: 266 };
export const INTERACT_RANGE = 58;
export const PLAYER_FOOT = { halfWidth: 12, height: 10 };
export const BED_ENTRY: Rect = { x: 106, y: 288, width: 148, height: 28 };
export const BED_REST = { x: 180, y: 334 };
export const BED_EXIT = { x: 270, y: 300 };

function wallDoor(id: ArrivalId, label: string, wall: NonNullable<RoomObject['door']>['wall'], to: RoomMap, counterpart: ArrivalId): RoomObject {
  const bounds = wall === 'north' ? { x: 437, y: 76, width: 86, height: 136 } : wall === 'south' ? { x: 437, y: 454, width: 86, height: 36 }
    : { x: wall === 'west' ? 64 : 864, y: 356, width: 32, height: 120 };
  const anchor = wall === 'north' ? { x: 480, y: 230 } : wall === 'south' ? { x: 480, y: 450 } : { x: wall === 'west' ? 108 : 852, y: 440 };
  // The threshold is in the boundary wall. Side jambs extend one step into the floor, matching their rendered footprint.
  const collision = wall === 'north' ? { x: 437, y: 210, width: 86, height: 6 } : wall === 'south' ? { x: 437, y: 476, width: 86, height: 14 }
    : { x: wall === 'west' ? 64 : 864, y: 398, width: 32, height: 78 };
  return { id, label, bounds, anchor, collision, depth: wall === 'north' ? 216 : wall === 'south' ? 490 : 476, actions: [id], door: { wall, to, counterpart } };
}
export function doorEntry(door: RoomObject): Position {
  const direction = { north: [0, 28], south: [0, -20], west: [24, 14], east: [-24, 14] }[door.door!.wall];
  return { x: door.anchor.x + direction[0], y: door.anchor.y + direction[1] };
}
export function doorClearance(door: RoomObject): Rect {
  return door.door?.wall === 'west' ? { x: 80, y: 414, width: 110, height: 62 }
    : door.door?.wall === 'east' ? { x: 770, y: 414, width: 110, height: 62 }
    : door.door?.wall === 'south' ? { x: 440, y: 406, width: 80, height: 70 }
    : { x: door.anchor.x - 28, y: 216, width: 56, height: 84 };
}

// Rendering, host collision and interaction reach all share these authored objects.
// The lower footprint is solid; tall backs may correctly occlude a resident behind them.
export const roomObjects: readonly RoomObject[] = [
  { id: 'bed', label: 'Carved double bed', bounds: { x: 110, y: 210, width: 140, height: 130 }, collisions: [{ x: 110, y: 244, width: 140, height: 34 }, { x: 110, y: 316, width: 140, height: 24 }], anchor: { x: 252, y: 302 }, depth: 340, actions: ['bed'] },
  { id: 'desk', label: 'Writing desk', bounds: { x: 330, y: 220, width: 105, height: 65 }, collision: { x: 330, y: 251, width: 105, height: 32 }, anchor: { x: 382, y: 289 }, depth: 283, actions: [] },
  { id: 'letter', label: 'Sealed letter', bounds: { x: 357, y: 226, width: 22, height: 16 }, anchor: { x: 362, y: 290 }, depth: 284, actions: ['letter'] },
  { id: 'journal', label: 'Daily journal', bounds: { x: 382, y: 231, width: 18, height: 14 }, anchor: { x: 386, y: 294 }, depth: 284, actions: ['journal'] },
  { id: 'candle-desk', label: 'Desk candle', bounds: { x: 405, y: 215, width: 10, height: 24 }, anchor: { x: 423, y: 290 }, depth: 284, actions: ['candle-desk'] },
  { id: 'candle-table', label: 'Bedside candle', bounds: { x: 263, y: 382, width: 10, height: 24 }, anchor: { x: 272, y: 446 }, depth: 439, actions: ['candle-table'] },
  { id: 'carpet', label: 'Woven carpet', bounds: { x: 338, y: 316, width: 318, height: 132 }, anchor: { x: 497, y: 448 }, depth: -90, actions: [] },
  { id: 'hearth', label: 'Household hearth', bounds: { x: 500, y: 130, width: 112, height: 112 }, collision: { x: 500, y: 216, width: 112, height: 26 }, anchor: { x: 556, y: 250 }, depth: 242, actions: ['hearth'] },
  { id: 'pantry', label: 'Cacao cupboard', bounds: { x: 750, y: 114, width: 94, height: 136 }, collision: { x: 750, y: 214, width: 100, height: 36 }, anchor: { x: 800, y: 258 }, depth: 250, actions: ['pantry'] },
  { id: 'chest', label: 'Household chest', bounds: { x: 760, y: 355, width: 88, height: 52 }, collision: { x: 760, y: 381, width: 88, height: 26 }, anchor: { x: 804, y: 415 }, depth: 407, actions: ['chest'] },
  { id: 'bookshelf', label: 'Old bookshelf', bounds: { x: 82, y: 120, width: 100, height: 104 }, collision: { x: 82, y: 202, width: 100, height: 22 }, anchor: { x: 132, y: 232 }, depth: 224, actions: ['bookshelf'] },
  { id: 'plant', label: 'Moonfern', bounds: { x: 836, y: 290, width: 40, height: 62 }, collision: { x: 836, y: 328, width: 40, height: 24 }, anchor: { x: 824, y: 347 }, depth: 352, actions: [] },
  { id: 'side-table', label: 'Bedside table', bounds: { x: 240, y: 390, width: 60, height: 48 }, collision: { x: 240, y: 414, width: 60, height: 24 }, anchor: { x: 272, y: 446 }, depth: 438, actions: [] },
  { id: 'window-west', label: 'West window', bounds: { x: 218, y: 42, width: 104, height: 160 }, anchor: { x: 270, y: 218 }, depth: 202, actions: ['window-west'] },
  { id: 'window-east', label: 'East window', bounds: { x: 380, y: 42, width: 104, height: 160 }, anchor: { x: 432, y: 220 }, depth: 202, actions: ['window-east'] },
  wallDoor('door-out', 'Living room', 'east', 'living', 'door-left'),
];
export const livingObjects: readonly RoomObject[] = [
  ...roomObjects.filter(o => ['bookshelf', 'pantry', 'chest', 'plant', 'side-table', 'candle-table', 'carpet', 'hearth'].includes(o.id)),
  { id: 'window-west', label: 'Living room window', bounds: { x: 260, y: 42, width: 104, height: 160 }, anchor: { x: 312, y: 220 }, depth: 202, actions: ['window-west'] },
  { id: 'sofa', label: 'Plum sofa', bounds: { x: 330, y: 270, width: 146, height: 88 }, collision: { x: 330, y: 314, width: 146, height: 44 }, anchor: { x: 403, y: 370 }, depth: 358, actions: [] },
  { id: 'armchair', label: 'Reading chair', bounds: { x: 572, y: 372, width: 66, height: 70 }, collision: { x: 572, y: 408, width: 66, height: 34 }, anchor: { x: 560, y: 444 }, depth: 442, actions: [] },
  wallDoor('door-left', 'Player 1 bedroom', 'west', 'castle', 'door-out'), wallDoor('door-right', 'Player 2 bedroom', 'east', 'bedroom-2', 'door-out'), wallDoor('door-out', 'Castle landing', 'south', 'landing', 'door-home'),
];
export const landingObjects: readonly RoomObject[] = [
  wallDoor('door-home', 'Living room', 'north', 'living', 'door-out'),
  { id: 'window-west', label: 'West window', bounds: { x: 218, y: 42, width: 104, height: 160 }, anchor: { x: 270, y: 220 }, depth: 202, actions: ['window-west'] },
  { id: 'window-east', label: 'East window', bounds: { x: 628, y: 42, width: 104, height: 160 }, anchor: { x: 680, y: 220 }, depth: 202, actions: ['window-east'] },
  { id: 'landing-stairs', label: 'Old west stair', bounds: { x: 740, y: 340, width: 120, height: 108 }, collision: { x: 740, y: 356, width: 120, height: 92 }, anchor: { x: 800, y: 456 }, depth: 448, actions: ['landing-stairs'] },
];
export function objectOffset(id: string, layout: RoomLayout = {}): Position {
  const parent = id === 'letter' || id === 'journal' || id === 'candle-desk' ? 'desk' : id === 'candle-table' ? 'side-table' : undefined;
  return layout[id as FurnitureId] ?? (parent ? layout[parent] : undefined) ?? { x: 0, y: 0 };
}
export function getRoomObjects(map: RoomMap = 'castle', layout: RoomLayout = {}): readonly RoomObject[] {
  if (map === 'landing') return landingObjects;
  const objects = (map === 'living' ? livingObjects : roomObjects).map(original => {
    const object = map === 'bedroom-2' && original.id === 'door-out' ? wallDoor('door-out', 'Living room', 'west', 'living', 'door-right') : original;
    const delta = objectOffset(object.id, layout);
    if (!delta.x && !delta.y) return object;
    const shifted = <T extends Position>(p: T): T => ({ ...p, x: p.x + delta.x, y: p.y + delta.y });
    return { ...object, bounds: shifted(object.bounds), anchor: shifted(object.anchor), depth: object.depth < 0 ? object.depth : object.depth + delta.y,
      collision: object.collision && shifted(object.collision), collisions: object.collisions?.map(shifted) };
  });
  return objects.map(object => {
    if (!object.id.startsWith('candle-')) return object;
    const x = object.bounds.x + 5, bottom = object.bounds.y + object.bounds.height;
    const support = objects.find(other => ['desk', 'side-table', 'pantry', 'bookshelf'].includes(other.id) && x >= other.bounds.x + 3 && x <= other.bounds.x + other.bounds.width - 3 && bottom >= other.bounds.y + 8 && bottom <= other.bounds.y + other.bounds.height * .6);
    return { ...object, depth: support ? support.depth + 1 : bottom, anchor: { x, y: support ? support.depth + 10 : bottom + 10 } };
  });
}
export const objectColliders = (object: RoomObject): readonly Rect[] => object.collisions ?? (object.collision ? [object.collision] : []);
export function inBedEntry(position: Position, layout: RoomLayout = {}) {
  const delta = objectOffset('bed', layout);
  return isBedroom(position.map ?? 'castle') && position.x >= BED_ENTRY.x + delta.x && position.x <= BED_ENTRY.x + delta.x + BED_ENTRY.width && position.y >= BED_ENTRY.y + delta.y && position.y <= BED_ENTRY.y + delta.y + BED_ENTRY.height;
}

type Household = { layout: RoomLayout; roomLayouts?: Partial<Record<RoomMap, RoomLayout>>; hostId: string; guestId: string | null; story: { flags: Record<string, boolean> } };
export const isBedroom = (map: RoomMap) => map === 'castle' || map === 'bedroom-2';
export function roomLayout(world: Pick<Household, 'layout' | 'roomLayouts'>, map: RoomMap): RoomLayout { return map === 'castle' ? world.layout : world.roomLayouts?.[map] ?? {}; }
export function roomOwner(world: Pick<Household, 'hostId' | 'guestId'>, map: RoomMap) { return map === 'castle' ? world.hostId : map === 'bedroom-2' ? world.guestId : null; }
export function canArrangeRoom(world: Pick<Household, 'hostId' | 'guestId'>, actor: string, map: RoomMap) { return map === 'living' || isBedroom(map) && roomOwner(world, map) === actor; }
export function roomFlagKey(map: RoomMap, id: string) { return map === 'castle' ? id : `${map}:${id}`; }
export function roomFlag(world: Pick<Household, 'story'>, map: RoomMap, id: string, fallback = false) { return world.story.flags[roomFlagKey(map, id)] ?? fallback; }

function overlap(a: Rect, b: Rect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
export function footBounds(position: Position): Rect {
  return { x: position.x - PLAYER_FOOT.halfWidth, y: position.y - PLAYER_FOOT.height, width: PLAYER_FOOT.halfWidth * 2, height: PLAYER_FOOT.height };
}
export function canStand(position: Position, map: RoomMap = position.map ?? 'castle', layout: RoomLayout = {}) {
  const foot = footBounds(position);
  return foot.x >= WALK_AREA.x && foot.x + foot.width <= WALK_AREA.x + WALK_AREA.width &&
    foot.y >= WALK_AREA.y && foot.y + foot.height <= WALK_AREA.y + WALK_AREA.height &&
    !getRoomObjects(map, layout).some(object => objectColliders(object).some(rect => overlap(foot, rect)));
}
/** Repair only position when an older save stood where the new furniture now sits. */
export function safePosition(position: Position, map: RoomMap = position.map ?? 'castle', layout: RoomLayout = {}): Position {
  if (canStand(position, map, layout)) return { x: position.x, y: position.y };
  let best: Position = { x: 480, y: 364 }, distance = Infinity;
  for (let y = WALK_AREA.y + PLAYER_FOOT.height; y <= WALK_AREA.y + WALK_AREA.height; y += 4) {
    for (let x = WALK_AREA.x + PLAYER_FOOT.halfWidth; x <= WALK_AREA.x + WALK_AREA.width - PLAYER_FOOT.halfWidth; x += 4) {
      const candidate = { x, y }, d = Math.hypot(x - position.x, y - position.y);
      if (d < distance && canStand(candidate, map, layout)) { best = candidate; distance = d; }
    }
  }
  return best;
}
/** Sweep in small increments, sliding along edges. Diagonal speed stays bounded. */
export function moveInRoom(position: Position, dx: number, dy: number, distance = 14, map: RoomMap = position.map ?? 'castle', layout: RoomLayout = {}): Position {
  const result = safePosition(position, map, layout);
  const divisor = Math.max(1, Math.hypot(dx, dy));
  const steps = Math.max(1, Math.ceil(distance / 2));
  const stepX = dx / divisor * distance / steps, stepY = dy / divisor * distance / steps;
  for (let step = 0; step < steps; step++) {
    if (canStand({ x: result.x + stepX, y: result.y }, map, layout)) result.x += stepX;
    if (canStand({ x: result.x, y: result.y + stepY }, map, layout)) result.y += stepY;
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
export function canInteract(position: Position, object: RoomObject, layout: RoomLayout = {}) {
  if (!canStand(position, position.map, layout) || objectDistance(position, object) > INTERACT_RANGE) return false;
  const end = closestPoint(position, object), length = Math.hypot(end.x - position.x, end.y - position.y);
  for (let step = 1; step < length; step += 2) {
    const x = position.x + (end.x - position.x) * step / length, y = position.y + (end.y - position.y) * step / length;
    if (getRoomObjects(position.map, layout).some(other => other.id !== object.id && objectColliders(other).some(r => x > r.x && x < r.x + r.width && y > r.y && y < r.y + r.height))) return false;
  }
  return true;
}
export function objectForAction(action: ArrivalId, map?: RoomMap, layout: RoomLayout = {}) { return (map ? getRoomObjects(map, layout) : [...getRoomObjects('castle', layout), ...landingObjects]).find(object => object.actions.includes(action))!; }
export function nearestInteractable(position: Position, layout: RoomLayout = {}) {
  return getRoomObjects(position.map, layout).filter(object => object.actions.length && canInteract(position, object, layout)).sort((a, b) => objectDistance(position, a) - objectDistance(position, b))[0];
}

