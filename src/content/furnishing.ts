import type { World } from '../game/model';
import { canArrangeRoom, canStand, footBounds, getRoomObjects, objectColliders, objectOffset, roomLayout, WALK_AREA, type FurnitureId, type RoomLayout, type RoomMap, type Position, type Rect } from './room';

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
export function placementError(world: World, id: FurnitureId, offset: Position, map: RoomMap = 'castle'): string | null {
  const layout: RoomLayout = { ...roomLayout(world, map), [id]: { x: offset.x, y: offset.y } };
  const objects = getRoomObjects(map, layout), object = objects.find(item => item.id === id);
  if (!object) return 'This piece is not in the room.';
  const b = object.bounds, solids = objectColliders(object);
  if (b.x < 80 || b.x + b.width > 880 || b.y < 74 || b.y + b.height > 476) return 'Keep the piece inside the room.';
  if (id === 'carpet' && b.y < WALK_AREA.y) return 'Place the carpet on the floor.';
  if (solids.some(r => r.y + r.height < 220 || r.y + r.height > 476)) return 'Keep the feet on the floor.';
  if (id.startsWith('candle-') && object.depth <= b.y + b.height && !canStand(object.anchor, map, layout)) return 'Place the candle on a surface or clear floor.';
  if (objects.some(other => other.id !== id && solids.some(a => objectColliders(other).some(b => overlaps(a, b))))) return 'There is another piece in the way.';
  const residents = Object.values(world.players).filter(player => player.map === map);
  if (id === 'bed' && residents.some(player => player.fatigue.sleeping)) return 'Someone is using the bed.';
  if (residents.some(player => player.interaction === id)) return 'Someone is using this piece.';
  if (residents.some(player => !player.fatigue.sleeping && !canStand(player, map, layout))) return 'Leave space for both residents.';
  // Reserve a clear threshold, including its approach, rather than allowing furniture
  // to lock either resident outside their saved home.
  const doors = objects.filter(o => o.id.startsWith('door-'));
  if (solids.some(r => doors.some(door => overlaps(r, { x: door.anchor.x - 28, y: 216, width: 56, height: 84 })))) return 'Keep the doorway clear.';
  if (!solids.length) return null;
  // Flood the walkable floor from the doorway. Check residents and each useful object
  // has an approach, so arranging cannot create a sealed-off pocket or inaccessible bed.
  const seen = new Set<string>(), queue: Position[] = [{ x: doors[0]?.anchor.x ?? 685, y: 258 }];
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i], key = `${p.x},${p.y}`;
    if (seen.has(key) || !canStand(p, map, layout)) continue;
    seen.add(key);
    for (const [dx, dy] of [[14, 0], [-14, 0], [0, 14], [0, -14]]) {
      const n = { x: p.x + dx, y: p.y + dy };
      if (n.x >= 92 && n.x <= 868 && n.y >= 220 && n.y <= 476 && !seen.has(`${n.x},${n.y}`)) queue.push(n);
    }
  }
  const reachable = [...seen].map(key => { const [x, y] = key.split(',').map(Number); return { x, y }; });
  if (residents.some(player => !player.fatigue.sleeping && !reachable.some(p => Math.hypot(p.x - player.x, p.y - player.y) < 24))) return 'That would block a resident in.';
  for (const target of objects.filter(item => item.actions.length || item.id === 'bed')) {
    if (!reachable.some(p => Math.hypot(p.x - target.anchor.x, p.y - target.anchor.y) < 54 && !objectColliders(target).some(r => overlaps(r, footBounds(p))))) return 'Leave a path to the furnishings.';
  }
  return null;
}
export function placeFurniture(world: World, actor: string, id: FurnitureId, offset: Position, expected: Position) {
  const map = world.players[actor].map;
  if (!canArrangeRoom(world, actor, map)) throw Error('Only the owner may rearrange this bedroom.');
  const layout = roomLayout(world, map), current = objectOffset(id, layout);
  if (current.x !== expected.x || current.y !== expected.y) throw Error('The other resident moved this piece. Select it again.');
  const problem = placementError(world, id, offset, map);
  if (problem) throw Error(problem);
  layout[id] = { x: offset.x, y: offset.y };
}
