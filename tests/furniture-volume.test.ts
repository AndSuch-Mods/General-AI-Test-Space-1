import { describe, expect, it } from 'vitest';
import { baseRoomObjects, getRoomObjects, objectColliders, ROOM_MAPS, type FurnitureId, type RoomMap } from '../src/content/room';
import { createPlayer, createWorld, parseWorld } from '../src/game/model';

describe('original furniture volume and saved placement', () => {
  it('retains every original front view, collision and interaction location', () => {
    for (const map of ROOM_MAPS) for (const original of baseRoomObjects(map)) {
      const actual = getRoomObjects(map).find(o => o.id === original.id)!;
      expect(actual.bounds).toEqual(original.bounds);
      expect(objectColliders(actual)).toEqual(objectColliders(original));
      if (!original.id.startsWith('candle-') && original.id !== 'journal') expect(actual.anchor).toEqual(original.anchor);
    }
    expect(getRoomObjects().find(o => o.id === 'bookshelf')).toMatchObject({
      bounds: { x: 82, y: 74, width: 150, height: 156 }, collision: { x: 82, y: 202, width: 150, height: 22 },
    });
    expect(getRoomObjects().find(o => o.id === 'chest')).toMatchObject({
      bounds: { x: 760, y: 355, width: 88, height: 52 }, collision: { x: 760, y: 381, width: 88, height: 26 },
    });
  });

  it.each<[RoomMap, FurnitureId, number, number]>([
    ['castle', 'bookshelf', 110, 180], ['castle', 'pantry', 90, 138.4], ['castle', 'chest', 73 + 1 / 3, 60.8],
    ['castle', 'desk', 80, 80], ['castle', 'side-table', 60, 48],
    ['kitchen', 'stove', 100, 85.6], ['kitchen', 'sink', 93 + 1 / 3, 93.2], ['kitchen', 'worktop', 93 + 1 / 3, 104],
  ])('%s %s has readable side depth and a solid rotated floor', (map, id, width, height) => {
    for (const rotation of [1, 3] as const) {
      const object = getRoomObjects(map, { [id]: { x: 0, y: 0, rotation } }).find(o => o.id === id)!;
      expect(object.bounds.width).toBeCloseTo(width); expect(object.bounds.height).toBeCloseTo(height);
      expect(objectColliders(object)).toEqual([object.floor]);
    }
  });

  it('keeps a published schema-5 world and its moved furnishings in place', () => {
    const world = createWorld(createPlayer('Keeper'));
    world.layout = { bookshelf: { x: 60, y: 20 }, chest: { x: -80, y: 10 } };
    const before = structuredClone(world);
    const migrated = parseWorld({ ...world, schemaVersion: 5 });
    expect(migrated.layout).toEqual(before.layout);
    expect(migrated.players).toEqual(before.players);
    expect(getRoomObjects('castle', migrated.layout).find(o => o.id === 'bookshelf')!.collision)
      .toEqual({ x: 142, y: 222, width: 150, height: 22 });
    expect(getRoomObjects('castle', migrated.layout).find(o => o.id === 'chest')!.bounds)
      .toEqual({ x: 680, y: 365, width: 88, height: 52 });
  });
});
