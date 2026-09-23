import type { World } from '../game/model';
import { canArrangeRoom, doorClearance, doorEntry, footBounds, getRoomObjects, objectColliders, objectOffset, roomLayout, FURNITURE_IDS, ROTATABLE_FURNITURE, type FurnitureId, type RoomLayout, type RoomMap, type Placement, type Position, type Rect } from './room';

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
export const layoutKey = (layout: RoomLayout) => JSON.stringify(FURNITURE_IDS.map(id => [id, layout[id]?.x ?? 0, layout[id]?.y ?? 0, layout[id]?.rotation ?? 0]));
export function layoutError(world: World, map: RoomMap, layout: RoomLayout): string | null {
  const original = roomLayout(world, map), objects = getRoomObjects(map, layout);
  const residents = Object.values(world.players).filter(player => player.map === map);
  const solids = objects.flatMap(objectColliders);
  const clear = (p: Position) => { const f = footBounds(p); return f.x >= 80 && f.x + f.width <= 880 && f.y >= 210 && f.y + f.height <= 476 && !solids.some(r => overlaps(f, r)); };
  const edited = objects.filter(o => FURNITURE_IDS.includes(o.id as FurnitureId) && JSON.stringify([layout[o.id as FurnitureId]?.x ?? 0, layout[o.id as FurnitureId]?.y ?? 0, layout[o.id as FurnitureId]?.rotation ?? 0]) !== JSON.stringify([original[o.id as FurnitureId]?.x ?? 0, original[o.id as FurnitureId]?.y ?? 0, original[o.id as FurnitureId]?.rotation ?? 0]));
  const doors = objects.filter(o => o.door);
  if (Object.entries(layout).some(([id, placement]) => placement?.rotation && !ROTATABLE_FURNITURE.includes(id as FurnitureId))) return 'This piece has no directional layout.';
  for (const object of edited) {
    const b = object.bounds, footprint = objectColliders(object);
    if (b.x < 80 || b.x + b.width > 880 || b.y < 74 || b.y + b.height > 476 || object.id === 'carpet' && b.y < 210 || footprint.some(r => r.y < 202)) return 'Keep the piece inside the room.';
    if (residents.some(p => p.interaction === object.id || p.seated?.id === object.id || object.id === 'bed' && p.fatigue.sleeping)) return 'Someone is using this piece.';
    if (footprint.some(r => doors.some(door => overlaps(r, doorClearance(door))))) return 'Keep the doorway clear.';
    if (object.id.startsWith('candle-') && object.depth <= b.y + b.height && !clear(object.anchor)) return 'Place the candle on a surface or clear floor.';
    if (objects.some(other => other.id !== object.id && footprint.some(a => objectColliders(other).some(b => overlaps(a, b))))) return 'There is another piece in the way.';
  }
  if (residents.some(p => !p.fatigue.sleeping && !p.seated && !clear(p))) return 'Leave space for both residents.';
  if (!edited.some(o => objectColliders(o).length)) return null;
  // Cache floor geometry during the reachability flood; dragging never writes a save.
  const seen = new Set<string>(), queue: Position[] = [], entry = doors[0] ? doorEntry(doors[0]) : { x: 480, y: 364 };
  for (let y = 220; y <= 476; y += 14) for (let x = 92; x <= 868; x += 14) if (Math.hypot(x - entry.x, y - entry.y) < 34 && clear({ x, y })) queue.push({ x, y });
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i], key = `${p.x},${p.y}`;
    if (seen.has(key) || !clear(p)) continue;
    seen.add(key);
    for (const [dx, dy] of [[14, 0], [-14, 0], [0, 14], [0, -14]]) {
      const n = { x: p.x + dx, y: p.y + dy };
      if (n.x >= 92 && n.x <= 868 && n.y >= 220 && n.y <= 476 && !seen.has(`${n.x},${n.y}`)) queue.push(n);
    }
  }
  const reachable = [...seen].map(key => { const [x, y] = key.split(',').map(Number); return { x, y }; });
  if (residents.some(p => !p.fatigue.sleeping && !p.seated && !reachable.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 24))) return 'That would block a resident in.';
  if (objects.some(o => o.actions.length && !reachable.some(p => Math.hypot(p.x - o.anchor.x, p.y - o.anchor.y) < 58))) return 'Leave a path to the furnishings.';
  return null;
}
export function placementError(world: World, id: FurnitureId, offset: Placement, map: RoomMap = 'castle'): string | null {
  if (!getRoomObjects(map).some(o => o.id === id)) return 'This piece is not in the room.';
  return layoutError(world, map, { ...roomLayout(world, map), [id]: offset });
}
export function saveLayout(world: World, actor: string, map: RoomMap, layout: RoomLayout, expected: RoomLayout) {
  if (world.players[actor].map !== map || !canArrangeRoom(world, actor, map)) throw Error('Only the owner may rearrange this bedroom.');
  if (layoutKey(roomLayout(world, map)) !== layoutKey(expected)) throw Error('The other resident changed this room. Your draft has been kept; reopen the room layout to use their update.');
  if (Object.keys(layout).some(id => !getRoomObjects(map).some(o => o.id === id))) throw Error('This piece is not in the room.');
  const problem = layoutError(world, map, layout);
  if (problem) throw Error(problem);
  if (map === 'castle') world.layout = structuredClone(layout); else world.roomLayouts[map] = structuredClone(layout);
}
export function placeFurniture(world: World, actor: string, id: FurnitureId, offset: Placement, expected: Placement) {
  const map = world.players[actor].map, layout = roomLayout(world, map), current = objectOffset(id, layout);
  if (!canArrangeRoom(world, actor, map)) throw Error('Only the owner may rearrange this bedroom.');
  if (current.x !== expected.x || current.y !== expected.y || (layout[id]?.rotation ?? 0) !== (expected.rotation ?? 0)) throw Error('The other resident moved this piece. Select it again.');
  saveLayout(world, actor, map, { ...layout, [id]: offset }, layout);
}
