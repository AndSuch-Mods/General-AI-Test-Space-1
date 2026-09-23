import { doorClearance, FURNITURE_IDS, getRoomObjects, objectColliders, type FurnitureId, type Placement, type Rect, type RoomLayout, type RoomMap } from '../content/room';

type Geometry = { id: string; bounds: Rect; solids: readonly Rect[] };
type LegacyPiece = { id: string; bounds: Rect; solids: Rect[]; floorDepth?: number };
const rect = ([x, y, width, height]: number[]): Rect => ({ x, y, width, height });
const piece = (id: string, bounds: number[], solids: number[][] = [], floorDepth?: number): LegacyPiece => ({ id, bounds: rect(bounds), solids: solids.map(rect), floorDepth });
// Frozen schema-6 geometry from fe9750d. Import validation must not depend on
// future changes to room defaults or the current floor projection.
const bedroom: LegacyPiece[] = [
  piece('bed', [110, 210, 140, 130], [[110, 244, 140, 34], [110, 316, 140, 24]]),
  piece('desk', [330, 220, 105, 65], [[330, 251, 105, 32]], 48),
  piece('candle-desk', [405, 215, 10, 24]), piece('candle-table', [263, 382, 10, 24]),
  piece('carpet', [384, 316, 226, 132]),
  piece('hearth', [500, 130, 112, 112], [[500, 216, 112, 26]]),
  piece('pantry', [750, 114, 94, 136], [[750, 214, 94, 36]], 54),
  piece('chest', [760, 355, 88, 52], [[760, 381, 88, 26]], 44),
  piece('bookshelf', [82, 120, 100, 104], [[82, 202, 100, 22]], 44),
  piece('plant', [836, 414, 40, 62], [[836, 452, 40, 24]]),
  piece('side-table', [240, 390, 60, 48], [[240, 414, 60, 24]], 36),
];
const select = (...ids: string[]) => bedroom.filter(p => ids.includes(p.id));
const legacyRooms: Record<RoomMap, LegacyPiece[]> = {
  castle: bedroom,
  'bedroom-2': bedroom.map(p => {
    const dx = p.id === 'bed' ? 152 : ['desk', 'candle-desk'].includes(p.id) ? 116 : 0;
    return { ...p, bounds: { ...p.bounds, x: p.bounds.x + dx }, solids: p.solids.map(r => ({ ...r, x: r.x + dx })) };
  }),
  living: [...select('bookshelf', 'pantry', 'chest', 'plant', 'side-table', 'candle-table', 'carpet', 'hearth'),
    piece('sofa', [330, 270, 146, 88], [[330, 314, 146, 44]]), piece('armchair', [572, 372, 66, 70], [[572, 408, 66, 34]])],
  landing: [...select('plant', 'carpet'), piece('desk', [200, 240, 105, 65], [[200, 271, 105, 32]], 48), piece('armchair', [650, 376, 66, 70], [[650, 412, 66, 34]])],
  kitchen: [...select('pantry', 'plant'), piece('stove', [600, 220, 96, 88], [[600, 270, 96, 38]], 60),
    piece('sink', [220, 220, 112, 82], [[220, 264, 112, 38]], 56), piece('worktop', [430, 350, 140, 76], [[430, 388, 140, 38]], 56)],
};
export const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

export function schema6Geometry(map: RoomMap, layout: RoomLayout): Geometry[] {
  return legacyRooms[map].map(p => {
    if (p.id === 'hearth') return { id: p.id, bounds: p.bounds, solids: p.solids };
    const offset = layout[p.id as FurnitureId] ?? { x: 0, y: 0 }, turn = offset.rotation ?? 0;
    const height = p.solids.length ? p.floorDepth ?? Math.max(...p.solids.map(r => r.y + r.height)) - Math.min(...p.solids.map(r => r.y)) : p.bounds.height;
    const floor = { ...p.bounds, y: p.bounds.y + p.bounds.height - height, height };
    const cx = floor.x + floor.width / 2, cy = floor.y + floor.height / 2;
    const rotate = (r: Rect): Rect => {
      const points = [[r.x, r.y], [r.x + r.width, r.y + r.height]].map(([px, py]) => {
        let x = px - cx, y = py - cy;
        for (let i = 0; i < turn; i++) [x, y] = [-y, x];
        return { x: cx + x + offset.x, y: cy + y + offset.y };
      });
      return { x: Math.min(points[0].x, points[1].x), y: Math.min(points[0].y, points[1].y), width: Math.abs(points[0].x - points[1].x), height: Math.abs(points[0].y - points[1].y) };
    };
    const next = rotate(floor), elevation = floor.y - p.bounds.y;
    return { id: p.id, bounds: { ...next, y: next.y - elevation, height: next.height + elevation }, solids: p.solids.map(r => rotate(turn && p.floorDepth ? floor : r)) };
  });
}

/** The published schema validated saved pieces, not every authored decoration. */
export function layoutGeometryError(layout: RoomLayout, objects: readonly Geometry[]): string | undefined {
  if (Object.keys(layout).some(id => !objects.some(o => o.id === id))) return 'Furniture is not in this room';
  for (const object of objects.filter(o => o.id in layout)) {
    const b = object.bounds;
    if (b.x < 80 || b.x + b.width > 880 || b.y < 74 || b.y + b.height > 476) return 'Furniture is outside the room';
    if (object.solids.some(r => objects.some(other => other.id !== object.id && other.solids.some(q => overlaps(r, q))))) return 'Furniture overlaps another solid';
  }
}

export function currentGeometry(map: RoomMap, layout: RoomLayout): Geometry[] {
  return getRoomObjects(map, layout).map(o => ({ id: o.id, bounds: o.bounds, solids: objectColliders(o) }));
}

/** Keep every valid center. Repair only quarter-turn pieces resized by schema 7. */
export function migrateProjectedLayout(map: RoomMap, saved: RoomLayout, reachable?: (layout: RoomLayout) => boolean): RoomLayout {
  const layout = structuredClone(saved);
  for (const id of FURNITURE_IDS) {
    const placement = layout[id];
    if (!placement || (placement.rotation ?? 0) % 2 !== 1) continue;
    const objects = getRoomObjects(map, layout), object = objects.find(o => o.id === id)!;
    const b = object.bounds, solids = objectColliders(object);
    const obstacles = objects.filter(o => o.id !== id).flatMap(o => o.door ? [doorClearance(o)] : objectColliders(o));
    const minY = id === 'carpet' ? 210 : solids.length ? 202 : 74;
    const floorY = solids.length ? Math.min(...solids.map(r => r.y)) : b.y;
    const xmin = Math.max(-800, Math.ceil(placement.x + 80 - b.x));
    const xmax = Math.min(800, Math.floor(placement.x + 880 - b.x - b.width));
    const ymin = Math.max(-400, Math.ceil(placement.y + Math.max(74 - b.y, minY - floorY)));
    const ymax = Math.min(400, Math.floor(placement.y + 476 - b.y - b.height));
    const valid = (x: number, y: number) => x >= xmin && x <= xmax && y >= ymin && y <= ymax && !solids.some(r => obstacles.some(q => overlaps({ ...r, x: r.x + x - placement.x, y: r.y + y - placement.y }, q)));
    if (valid(placement.x, placement.y)) continue;
    // Obstacles exclude open axis-aligned rectangles of integer offsets. The
    // closest valid point lies at the saved coordinate, a room edge or an
    // obstacle edge on each axis; their Cartesian product is exhaustive.
    const xs = new Set([Math.max(xmin, Math.min(xmax, placement.x)), xmin, xmax]);
    const ys = new Set([Math.max(ymin, Math.min(ymax, placement.y)), ymin, ymax]);
    for (const r of solids) for (const q of obstacles) {
      xs.add(Math.floor(placement.x + q.x - r.x - r.width));
      xs.add(Math.ceil(placement.x + q.x + q.width - r.x));
      ys.add(Math.floor(placement.y + q.y - r.y - r.height));
      ys.add(Math.ceil(placement.y + q.y + q.height - r.y));
    }
    // A collision-free gap may still be too narrow for the resident. Include
    // the placement thresholds of the same 14px walk grid used by layoutError.
    // This bounds the search while retaining every floor-path topology change.
    if (reachable) for (const r of solids) {
      for (let x = 92; x <= 868; x += 14) {
        xs.add(Math.floor(placement.x + x - 12 - r.x - r.width));
        xs.add(Math.ceil(placement.x + x + 12 - r.x));
      }
      for (let y = 220; y <= 476; y += 14) {
        ys.add(Math.floor(placement.y + y - 10 - r.y - r.height));
        ys.add(Math.ceil(placement.y + y - r.y));
      }
    }
    const candidates = [...ys].flatMap(y => [...xs].map(x => ({ x, y, d: (x - placement.x) ** 2 + (y - placement.y) ** 2 })))
      .filter(p => valid(p.x, p.y)).sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x);
    let best: Placement | undefined;
    for (const p of candidates) {
      const proposed = { ...placement, x: p.x, y: p.y };
      if (!reachable || reachable({ ...layout, [id]: proposed })) { best = proposed; break; }
    }
    if (!best) throw Error(`Cannot safely migrate ${id} in ${map}; the original save has been retained.`);
    layout[id] = best;
  }
  return layout;
}
