import type { ArrivalId } from './arrival';

export type Rect = { x: number; y: number; width: number; height: number };
export const ROOM_MAPS = ['castle', 'bedroom-2', 'living', 'landing', 'kitchen'] as const;
export type RoomMap = typeof ROOM_MAPS[number];
export type Turn = 0 | 1 | 2 | 3;
export type Facing = 'down' | 'left' | 'up' | 'right';
export type Placement = { x: number; y: number; rotation?: Turn };
export type Position = { x: number; y: number; map?: RoomMap };
export const FURNITURE_IDS = ['bed', 'desk', 'side-table', 'bookshelf', 'pantry', 'chest', 'candle-desk', 'candle-table', 'carpet', 'plant', 'sofa', 'armchair', 'stove', 'sink', 'worktop'] as const;
export type FurnitureId = typeof FURNITURE_IDS[number];
export const ROTATABLE_FURNITURE: readonly FurnitureId[] = ['bed', 'desk', 'side-table', 'bookshelf', 'pantry', 'chest', 'carpet', 'sofa', 'armchair', 'stove', 'sink', 'worktop'];
export type RoomLayout = Partial<Record<FurnitureId, Placement>>;
export type RoomObject = {
  id: string; label: string; bounds: Rect; collision?: Rect; collisions?: readonly Rect[]; anchor: Position;
  rotation?: Turn; floor?: Rect; elevation?: number; depth: number; actions: readonly ArrivalId[];
  door?: { wall: 'north' | 'south' | 'west' | 'east'; to: RoomMap; counterpart: ArrivalId };
};
export const ROOM_SIZE = { width: 960, height: 540 };
export const WALK_AREA: Rect = { x: 80, y: 210, width: 800, height: 266 };
export const INTERACT_RANGE = 28;
export const FLOOR_Y_SCALE = .6;
export const PLAYER_FOOT = { halfWidth: 12, height: 10 };
export const BED_ENTRY: Rect = { x: 106, y: 288, width: 148, height: 28 };
export const BED_REST = { x: 180, y: 334 };
export const BED_EXIT = { x: 270, y: 300 };

function wallDoor(id: ArrivalId, label: string, wall: NonNullable<RoomObject['door']>['wall'], to: RoomMap, counterpart: ArrivalId): RoomObject {
  const bounds = wall === 'north' ? { x: 437, y: 76, width: 86, height: 136 } : wall === 'south' ? { x: 437, y: 454, width: 86, height: 36 }
    : { x: wall === 'west' ? 64 : 864, y: 259, width: 32, height: 120 };
  const anchor = wall === 'north' ? { x: 480, y: 230 } : wall === 'south' ? { x: 480, y: 450 } : { x: wall === 'west' ? 108 : 852, y: 343 };
  return { id, label, bounds, anchor, depth: wall === 'north' ? 216 : wall === 'south' ? 490 : 379, actions: [id], door: { wall, to, counterpart } };
}
export function doorEntry(door: RoomObject): Position {
  const direction = { north: [0, 28], south: [0, -20], west: [24, 0], east: [-24, 0] }[door.door!.wall];
  return { x: door.anchor.x + direction[0], y: door.anchor.y + direction[1] };
}
export function doorClearance(door: RoomObject): Rect {
  return door.door?.wall === 'west' ? { x: 80, y: 299, width: 110, height: 88 }
    : door.door?.wall === 'east' ? { x: 770, y: 299, width: 110, height: 88 }
    : door.door?.wall === 'south' ? { x: 440, y: 406, width: 80, height: 70 }
    : { x: door.anchor.x - 28, y: 216, width: 56, height: 84 };
}

// Rendering, host collision and interaction reach all share these authored objects.
// The lower footprint is solid; tall backs may correctly occlude a resident behind them.
export const roomObjects: readonly RoomObject[] = [
  { id: 'bed', label: 'Carved double bed', bounds: { x: 110, y: 210, width: 140, height: 130 }, collisions: [{ x: 110, y: 244, width: 140, height: 34 }, { x: 110, y: 316, width: 140, height: 24 }], anchor: { x: 252, y: 302 }, depth: 340, actions: ['bed'] },
  { id: 'desk', label: 'Writing desk', bounds: { x: 330, y: 220, width: 105, height: 65 }, collision: { x: 330, y: 251, width: 105, height: 32 }, anchor: { x: 382, y: 289 }, depth: 283, actions: ['desk'] },
  { id: 'letter', label: 'Sealed letter', bounds: { x: 357, y: 226, width: 22, height: 16 }, anchor: { x: 362, y: 290 }, depth: 284, actions: ['letter'] },
  { id: 'journal', label: 'Daily journal', bounds: { x: 382, y: 231, width: 18, height: 14 }, anchor: { x: 386, y: 294 }, depth: 284, actions: ['journal'] },
  { id: 'candle-desk', label: 'Desk candle', bounds: { x: 405, y: 215, width: 10, height: 24 }, anchor: { x: 423, y: 290 }, depth: 284, actions: ['candle-desk'] },
  { id: 'candle-table', label: 'Bedside candle', bounds: { x: 263, y: 382, width: 10, height: 24 }, anchor: { x: 272, y: 446 }, depth: 439, actions: ['candle-table'] },
  { id: 'carpet', label: 'Woven carpet', bounds: { x: 384, y: 316, width: 226, height: 132 }, anchor: { x: 497, y: 448 }, depth: -90, actions: [] },
  { id: 'hearth', label: 'Household hearth', bounds: { x: 500, y: 130, width: 112, height: 112 }, collision: { x: 500, y: 216, width: 112, height: 26 }, anchor: { x: 556, y: 250 }, depth: 242, actions: ['hearth'] },
  { id: 'pantry', label: 'Cacao cupboard', bounds: { x: 750, y: 114, width: 94, height: 136 }, collision: { x: 750, y: 214, width: 94, height: 36 }, anchor: { x: 800, y: 258 }, depth: 250, actions: ['pantry'] },
  { id: 'chest', label: 'Household chest', bounds: { x: 760, y: 355, width: 88, height: 52 }, collision: { x: 760, y: 381, width: 88, height: 26 }, anchor: { x: 804, y: 415 }, depth: 407, actions: ['chest'] },
  { id: 'bookshelf', label: 'Old bookshelf', bounds: { x: 82, y: 120, width: 100, height: 104 }, collision: { x: 82, y: 202, width: 100, height: 22 }, anchor: { x: 132, y: 232 }, depth: 224, actions: ['bookshelf'] },
  { id: 'plant', label: 'Moonfern', bounds: { x: 836, y: 414, width: 40, height: 62 }, collision: { x: 836, y: 452, width: 40, height: 24 }, anchor: { x: 824, y: 471 }, depth: 476, actions: [] },
  { id: 'side-table', label: 'Bedside table', bounds: { x: 240, y: 390, width: 60, height: 48 }, collision: { x: 240, y: 414, width: 60, height: 24 }, anchor: { x: 272, y: 446 }, depth: 438, actions: [] },
  { id: 'window-west', label: 'West window', bounds: { x: 228, y: 42, width: 104, height: 160 }, anchor: { x: 280, y: 220 }, depth: 202, actions: [] },
  { id: 'window-east', label: 'East window', bounds: { x: 628, y: 42, width: 104, height: 160 }, anchor: { x: 680, y: 220 }, depth: 202, actions: [] },
  wallDoor('door-out', 'Living room', 'east', 'living', 'door-left'),
];
export const livingObjects: readonly RoomObject[] = [
  ...roomObjects.filter(o => ['window-east', 'bookshelf', 'pantry', 'chest', 'plant', 'side-table', 'candle-table', 'carpet', 'hearth'].includes(o.id)),
  { id: 'window-west', label: 'Living room window', bounds: { x: 228, y: 42, width: 104, height: 160 }, anchor: { x: 280, y: 220 }, depth: 202, actions: [] },
  { id: 'sofa', label: 'Plum sofa', bounds: { x: 330, y: 270, width: 146, height: 88 }, collision: { x: 330, y: 314, width: 146, height: 44 }, anchor: { x: 403, y: 370 }, depth: 358, actions: ['sofa'] },
  { id: 'armchair', label: 'Reading chair', bounds: { x: 572, y: 372, width: 66, height: 70 }, collision: { x: 572, y: 408, width: 66, height: 34 }, anchor: { x: 560, y: 444 }, depth: 442, actions: ['armchair'] },
  wallDoor('door-left', 'Player 1 bedroom', 'west', 'castle', 'door-out'), wallDoor('door-right', 'Player 2 bedroom', 'east', 'bedroom-2', 'door-out'), wallDoor('door-out', 'Castle landing', 'south', 'landing', 'door-home'),
];
export const landingObjects: readonly RoomObject[] = [
  wallDoor('door-home', 'Living room', 'north', 'living', 'door-out'),
  wallDoor('door-right', 'Kitchen', 'east', 'kitchen', 'door-home'),
  ...roomObjects.filter(o => ['window-west', 'window-east', 'plant', 'carpet'].includes(o.id)),
  { id: 'desk', label: 'Entry console', bounds: { x: 200, y: 240, width: 105, height: 65 }, collision: { x: 200, y: 271, width: 105, height: 32 }, anchor: { x: 252, y: 319 }, depth: 303, actions: ['desk'] },
  { id: 'armchair', label: 'Hall chair', bounds: { x: 650, y: 376, width: 66, height: 70 }, collision: { x: 650, y: 412, width: 66, height: 34 }, anchor: { x: 638, y: 448 }, depth: 446, actions: ['armchair'] },
];
export const kitchenObjects: readonly RoomObject[] = [
  wallDoor('door-home', 'Entry hall', 'west', 'landing', 'door-right'),
  ...roomObjects.filter(o => ['window-west', 'window-east', 'pantry', 'plant'].includes(o.id)),
  { id: 'stove', label: 'Cast-iron stove', bounds: { x: 600, y: 220, width: 96, height: 88 }, collision: { x: 600, y: 270, width: 96, height: 38 }, anchor: { x: 648, y: 322 }, depth: 308, actions: ['stove'] },
  { id: 'sink', label: 'Ceramic sink', bounds: { x: 220, y: 220, width: 112, height: 82 }, collision: { x: 220, y: 264, width: 112, height: 38 }, anchor: { x: 276, y: 316 }, depth: 302, actions: ['sink'] },
  { id: 'worktop', label: 'Kitchen worktable', bounds: { x: 430, y: 350, width: 140, height: 76 }, collision: { x: 430, y: 388, width: 140, height: 38 }, anchor: { x: 500, y: 440 }, depth: 426, actions: ['worktop'] },
];
export const baseRoomObjects = (map: RoomMap = 'castle'): readonly RoomObject[] => {
  if (map === 'living') return livingObjects;
  if (map === 'landing') return landingObjects;
  if (map === 'kitchen') return kitchenObjects;
  if (map === 'castle') return roomObjects;
  return roomObjects.map(o => {
    if (o.id === 'door-out') return wallDoor('door-out', 'Living room', 'west', 'living', 'door-right');
    const dx = o.id === 'bed' ? 152 : ['desk', 'letter', 'journal', 'candle-desk'].includes(o.id) ? 116 : 0;
    if (!dx) return o;
    const rect = (r: Rect) => ({ ...r, x: r.x + dx });
    return { ...o, bounds: rect(o.bounds), anchor: { ...o.anchor, x: o.anchor.x + dx }, collision: o.collision && rect(o.collision), collisions: o.collisions?.map(rect) };
  });
};
export function bedPoint(point: Position, map: RoomMap, layout: RoomLayout = {}) {
  const original = baseRoomObjects(map).find(o => o.id === 'bed')!, baseline = roomObjects.find(o => o.id === 'bed')!;
  return furniturePoint('bed', { x: point.x + original.bounds.x - baseline.bounds.x, y: point.y + original.bounds.y - baseline.bounds.y }, map, layout);
}
export function objectOffset(id: string, layout: RoomLayout = {}): Position {
  const parent = id === 'letter' || id === 'journal' || id === 'candle-desk' ? 'desk' : id === 'candle-table' ? 'side-table' : undefined;
  return layout[id as FurnitureId] ?? (parent ? layout[parent] : undefined) ?? { x: 0, y: 0 };
}
export function turnPoint(point: Position, center: Position, rotation: number): Position {
  let x = point.x - center.x, y = (point.y - center.y) / FLOOR_Y_SCALE;
  for (let i = 0; i < (rotation % 4 + 4) % 4; i++) [x, y] = [-y, x];
  return { x: center.x + x, y: center.y + y * FLOOR_Y_SCALE };
}
export function turnRect(rect: Rect, center: Position, rotation: number): Rect {
  const points = [turnPoint(rect, center, rotation), turnPoint({ x: rect.x + rect.width, y: rect.y + rect.height }, center, rotation)];
  return { x: Math.min(...points.map(p => p.x)), y: Math.min(...points.map(p => p.y)), width: Math.abs(points[1].x - points[0].x), height: Math.abs(points[1].y - points[0].y) };
}
export function groundBox(object: RoomObject): Rect {
  const solids = object.collisions ?? (object.collision ? [object.collision] : []);
  if (!solids.length) return object.bounds;
  // A front-view collision strip is not the object's full projected floor depth.
  // Author depth separately so side views keep their volume when turned upright.
  const height = FURNITURE_FLOOR_DEPTHS[object.id as FurnitureId]
    ?? Math.max(...solids.map(r => r.y + r.height)) - Math.min(...solids.map(r => r.y));
  return { x: object.bounds.x, y: object.bounds.y + object.bounds.height - height, width: object.bounds.width, height };
}
export const FURNITURE_FLOOR_DEPTHS: Partial<Record<FurnitureId, number>> = {
  bookshelf: 44, pantry: 54, chest: 44, desk: 48, 'side-table': 36,
  stove: 60, sink: 56, worktop: 56,
};
export const groundCenter = (object: RoomObject) => { const r = object.floor ?? groundBox(object); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
export function furniturePoint(id: FurnitureId, point: Position, map: RoomMap, layout: RoomLayout = {}) {
  const original = baseRoomObjects(map).find(o => o.id === id)!;
  const delta = objectOffset(id, layout), rotated = turnPoint(point, groundCenter(original), layout[id]?.rotation ?? 0);
  return { x: rotated.x + delta.x, y: rotated.y + delta.y };
}
export function getRoomObjects(map: RoomMap = 'castle', layout: RoomLayout = {}): readonly RoomObject[] {
  const originals = baseRoomObjects(map);
  const objects = originals.map(original => {
    const delta = objectOffset(original.id, layout), rotation = layout[original.id as FurnitureId]?.rotation ?? 0;
    const floor = groundBox(original), center = groundCenter(original), elevation = floor.y - original.bounds.y;
    const shifted = (p: Position) => ({ x: p.x + delta.x, y: p.y + delta.y });
    const rect = (r: Rect) => ({ ...turnRect(r, center, rotation), ...shifted(turnRect(r, center, rotation)) });
    if (!FURNITURE_IDS.includes(original.id as FurnitureId)) return original;
    const nextFloor = rect(floor);
    const bounds = { x: nextFloor.x, y: nextFloor.y - elevation, width: nextFloor.width, height: nextFloor.height + elevation };
    return { ...original, rotation, floor: nextFloor, elevation, bounds, anchor: shifted(turnPoint(original.anchor, center, rotation)), depth: original.depth < 0 ? original.depth : nextFloor.y + nextFloor.height,
      // Preserve every existing front-facing save's collision and appearance.
      // Other views occupy the authored floor rather than a rotated thin facade.
      collision: original.collision && rect(rotation && FURNITURE_FLOOR_DEPTHS[original.id as FurnitureId] ? floor : original.collision), collisions: original.collisions?.map(rect) };
  });
  return objects.map(object => {
    const parentId = ['letter', 'journal', 'candle-desk'].includes(object.id) ? 'desk' : object.id === 'candle-table' ? 'side-table' : undefined;
    if (parentId && !layout[object.id as FurnitureId]) {
      const original = originals.find(o => o.id === object.id)!, parent = originals.find(o => o.id === parentId);
      if (parent) {
        const elevation = groundBox(parent).y - parent.bounds.y;
        const point = furniturePoint(parentId as FurnitureId, { x: original.bounds.x + original.bounds.width / 2, y: original.bounds.y + original.bounds.height + elevation }, map, layout);
        const support = objects.find(o => o.id === parentId)!;
        object = { ...object, bounds: { ...object.bounds, x: point.x - object.bounds.width / 2, y: point.y - elevation - object.bounds.height }, anchor: furniturePoint(parentId as FurnitureId, original.anchor, map, layout), depth: support.depth + 1 };
      }
    }
    if (!object.id.startsWith('candle-')) return object;
    const x = object.bounds.x + 5, bottom = object.bounds.y + object.bounds.height;
    const support = objects.find(other => ['desk', 'side-table', 'pantry', 'bookshelf', 'worktop'].includes(other.id) && x >= other.bounds.x + 3 && x <= other.bounds.x + other.bounds.width - 3 && bottom >= other.bounds.y + 8 && bottom <= other.bounds.y + other.bounds.height * .75);
    const anchor = support ? (support.rotation ?? 0) % 2 ? { x: support.anchor.x, y: bottom + (support.elevation ?? 0) } : { x, y: support.anchor.y } : { x, y: bottom + 10 };
    return { ...object, depth: support ? support.depth + 1 : bottom, anchor };
  });
}
export const objectColliders = (object: RoomObject): readonly Rect[] => object.collisions ?? (object.collision ? [object.collision] : []);
export function inBedEntry(position: Position, layout: RoomLayout = {}) {
  const map = position.map ?? 'castle';
  if (!isBedroom(map)) return false;
  const delta = objectOffset('bed', layout), original = baseRoomObjects(map).find(o => o.id === 'bed')!;
  const p = turnPoint({ x: position.x - delta.x, y: position.y - delta.y }, groundCenter(original), 4 - (layout.bed?.rotation ?? 0));
  const base = roomObjects.find(o => o.id === 'bed')!, x = BED_ENTRY.x + original.bounds.x - base.bounds.x, y = BED_ENTRY.y + original.bounds.y - base.bounds.y;
  return p.x >= x && p.x <= x + BED_ENTRY.width && p.y >= y && p.y <= y + BED_ENTRY.height;
}

type Household = { layout: RoomLayout; roomLayouts?: Partial<Record<RoomMap, RoomLayout>>; hostId: string; guestId: string | null; story: { flags: Record<string, boolean> } };
export const isBedroom = (map: RoomMap) => map === 'castle' || map === 'bedroom-2';
export function roomLayout(world: Pick<Household, 'layout' | 'roomLayouts'>, map: RoomMap): RoomLayout { return map === 'castle' ? world.layout : world.roomLayouts?.[map] ?? {}; }
export function roomOwner(world: Pick<Household, 'hostId' | 'guestId'>, map: RoomMap) { return map === 'castle' ? world.hostId : map === 'bedroom-2' ? world.guestId : null; }
export function canArrangeRoom(world: Pick<Household, 'hostId' | 'guestId'>, actor: string, map: RoomMap) { return ['living', 'landing', 'kitchen'].includes(map) || isBedroom(map) && roomOwner(world, map) === actor; }
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
  if (!canStand(position, position.map, layout)) return false;
  if (object.id === 'bed') return inBedEntry(position, layout);
  const smallProp = ['letter', 'journal', 'candle-desk', 'candle-table'].includes(object.id);
  if (objectDistance(position, object) > (smallProp ? 24 : INTERACT_RANGE)) return false;
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


export const facingForTurn = (rotation: Turn = 0): Facing => (['down', 'left', 'up', 'right'] as const)[rotation];
export function doorCrossed(position: Position, dx: number, dy: number, layout: RoomLayout) {
  return getRoomObjects(position.map, layout).find(o => o.door && (
    o.door.wall === 'west' && dx < 0 && position.x <= 110 && Math.abs(position.y - 343) < 36 ||
    o.door.wall === 'east' && dx > 0 && position.x >= 850 && Math.abs(position.y - 343) < 36 ||
    o.door.wall === 'north' && dy < 0 && position.y <= 234 && Math.abs(position.x - 480) < 32 ||
    o.door.wall === 'south' && dy > 0 && position.y >= 460 && Math.abs(position.x - 480) < 32));
}
export function seatPosition(object: RoomObject, index = 0): Position {
  const center = groundCenter(object), vector = turnPoint({ x: center.x + (object.id === 'sofa' ? index ? 32 : -32 : 0), y: center.y }, center, object.rotation ?? 0);
  return vector;
}
export function clampPlacement(map: RoomMap, id: FurnitureId, value: Placement, layout: RoomLayout): Placement {
  const object = getRoomObjects(map, { ...layout, [id]: value }).find(o => o.id === id)!;
  const b = object.bounds, solids = objectColliders(object), floorY = solids.length ? Math.min(...solids.map(r => r.y)) : (object.floor ?? b).y;
  const minimumY = id === 'carpet' ? 210 : id.startsWith('candle-') ? 74 : 202;
  // Quarter turns can produce half-pixel bounds for odd-width pieces. Clamp the
  // integer offset inward, so rounding never pushes a preview outside the wall.
  const minX = Math.ceil(value.x + 80 - b.x), maxX = Math.floor(value.x + 880 - b.x - b.width);
  const minY = Math.ceil(value.y + Math.max(minimumY - floorY, 74 - b.y)), maxY = Math.floor(value.y + 476 - b.y - b.height);
  return { ...value, x: Math.max(minX, Math.min(maxX, Math.round(value.x))), y: Math.max(minY, Math.min(maxY, Math.round(value.y))) };
}
