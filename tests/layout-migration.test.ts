import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createPlayer, createWorld, parseWorld, WorldSchema, type World } from '../src/game/model';
import { currentGeometry, layoutGeometryError, migrateProjectedLayout, schema6Geometry } from '../src/game/layout-migration';
import { doorClearance, getRoomObjects, objectColliders, type RoomLayout } from '../src/content/room';
import { GameDatabase, parseBackup } from '../src/persistence/database';
import { layoutError } from '../src/content/furnishing';

function schema6() {
  const host = createPlayer('Returning keeper', 'wine'), guest = createPlayer('Mira', 'cream');
  const world = createWorld(host);
  Object.assign(world, { schemaVersion: 6, revision: 31, guestId: guest.id, guestKey: crypto.randomUUID() });
  world.players[guest.id] = guest;
  guest.look = { body: 'female', hairStyle: 'braid', hairColor: 'silver', skinTone: 'brown', outfit: 'skirt' };
  host.inventory = { 'cacao-bean': 11 }; guest.inventory = { 'cacao-bean': 4 };
  guest.discoveries = ['letter']; guest.quests = { arrival: 'complete' }; host.skills = { cooking: 8 };
  world.story.flags.hearth = true; world.chest = { 'cacao-bean': 15 }; world.clock.totalMinutes = 1559;
  world.lastSequence = { [host.id]: 25, [guest.id]: 7 };
  return { ...world, schemaVersion: 6 as const };
}

describe('schema 6 to 7 projected furniture migration', () => {
  it('validates the frozen old projection independently of current quarter turns', () => {
    const layout: RoomLayout = { desk: { x: 0, y: 40, rotation: 1 } };
    expect(schema6Geometry('castle', layout).find(o => o.id === 'desk')).toMatchObject({ bounds: { x: 358.5, y: 231.5, width: 48, height: 122 } });
    expect(currentGeometry('castle', layout).find(o => o.id === 'desk')).toMatchObject({ bounds: { x: 342.5, y: 252.5, width: 80, height: 80 } });
  });

  it('preserves valid centers, rotations, both profiles and every unrelated field across all rooms', () => {
    const old = schema6(); old.layout = { desk: { x: 0, y: 40, rotation: 1 }, chest: { x: -40, y: 0, rotation: 2 } };
    old.roomLayouts = { living: { sofa: { x: 0, y: 20, rotation: 1 } }, 'bedroom-2': { bed: { x: 0, y: 20, rotation: 3 } },
      landing: { desk: { x: 0, y: 40, rotation: 3 } }, kitchen: { worktop: { x: 0, y: 0, rotation: 1 } } };
    const before = structuredClone(old), upgraded = parseWorld(old);
    expect(upgraded).toEqual({ ...before, schemaVersion: 7 });
    expect(old).toEqual(before);
    expect(parseWorld(JSON.parse(JSON.stringify(upgraded)))).toEqual(upgraded);
  });

  it('makes the exact smallest integer nudge from a wall without changing rotation or other data', () => {
    const old = schema6(); old.layout = { carpet: { x: -350, y: -20, rotation: 1 }, chest: { x: -40, y: 0 } };
    expect(layoutGeometryError(old.layout, schema6Geometry('castle', old.layout))).toBeUndefined();
    expect(() => WorldSchema.parse({ ...old, schemaVersion: 7 })).toThrow('outside');
    const upgraded = parseWorld(old);
    expect(upgraded).toEqual({ ...old, schemaVersion: 7, layout: { ...old.layout, carpet: { x: -307, y: -20, rotation: 1 } } });
    expect(getRoomObjects('castle', upgraded.layout).find(o => o.id === 'carpet')!.bounds.x).toBe(80);
  });

  it('moves only the widened desk and leaves a real path to its letter beside the unchanged bed', () => {
    const old = schema6(); old.layout.desk = { x: -96, y: 0, rotation: 1 };
    expect(layoutGeometryError(old.layout, schema6Geometry('castle', old.layout))).toBeUndefined();
    expect(() => WorldSchema.parse({ ...old, schemaVersion: 7 })).toThrow('overlaps');
    const upgraded = parseWorld(old);
    expect(layoutError({ ...upgraded, layout: old.layout }, 'castle', { desk: { x: -92, y: 0, rotation: 1 } })).toBe('Leave a path to the furnishings.');
    expect(upgraded.layout).toEqual({ desk: { x: -77, y: 5, rotation: 1 } });
    expect(upgraded.players).toEqual(old.players);
    expect(parseWorld(old)).toEqual(upgraded);
    expect(layoutError({ ...upgraded, layout: old.layout }, 'castle', upgraded.layout)).toBeNull();
  });

  it('clears a doorway approached by a widened bed, preserving its saved turn', () => {
    const old = schema6(); old.roomLayouts['bedroom-2'].bed = { x: -78, y: 32, rotation: 1 };
    expect(layoutGeometryError(old.roomLayouts['bedroom-2'], schema6Geometry('bedroom-2', old.roomLayouts['bedroom-2']))).toBeUndefined();
    const upgraded = parseWorld(old), objects = getRoomObjects('bedroom-2', upgraded.roomLayouts['bedroom-2']);
    expect(upgraded.roomLayouts['bedroom-2'].bed).toEqual({ x: -62, y: 32, rotation: 1 });
    const door = doorClearance(objects.find(o => o.door)!);
    expect(Math.min(...objectColliders(objects.find(o => o.id === 'bed')!).map(r => r.x))).toBe(door.x + door.width);
    expect(layoutError({ ...upgraded, roomLayouts: old.roomLayouts }, 'bedroom-2', upgraded.roomLayouts['bedroom-2'])).toBeNull();
  });

  it('retains the original layout if no safe reachable repair can be found', () => {
    const layout: RoomLayout = { desk: { x: -96, y: 0, rotation: 1 }, chest: { x: -40, y: 0 } }, before = structuredClone(layout);
    expect(() => migrateProjectedLayout('castle', layout, () => false)).toThrow('original save has been retained');
    expect(layout).toEqual(before);
  });

  it('rejects legacy corruption even where the new projection would hide the old bounds error', () => {
    const old = schema6(); old.layout.carpet = { x: 0, y: 0, rotation: 1 };
    expect(WorldSchema.safeParse({ ...old, schemaVersion: 7 }).success).toBe(true);
    expect(() => parseWorld(old)).toThrow('outside');
    old.layout = { desk: { x: -180, y: 0 } };
    expect(() => parseWorld(old)).toThrow('overlaps');
    old.layout = {};
    expect(() => parseWorld({ ...old, hostId: crypto.randomUUID() })).toThrow('identities');
    expect(() => parseWorld({ ...old, unexpected: true })).toThrow();
    expect(() => parseWorld({ ...old, layout: { plant: { x: 0, y: 0, rotation: 1 } } })).toThrow('directional');
  });

  it('migrates both stored slots/imports without rewriting the original or losing recovery', async () => {
    const database = new GameDatabase(crypto.randomUUID()), first = schema6(), second = schema6();
    first.layout.carpet = { x: -350, y: -20, rotation: 1 };
    const savedAt = new Date().toISOString();
    try {
      // Simulate records written by the old executable, bypassing current validation.
      await database.saves.bulkPut([{ slot: 1, world: first as unknown as World, savedAt, lastBackupAt: null }, { slot: 2, world: second as unknown as World, savedAt, lastBackupAt: null }]);
      const loaded = (await database.load(1))!.world;
      expect(loaded.schemaVersion).toBe(7);
      expect((await database.saves.get(1))!.world).toEqual(first);
      expect((await database.load(2))!.world).toEqual({ ...second, schemaVersion: 7 });
      loaded.revision++;
      await database.save(1, loaded);
      expect((await database.recovery.get(1))!.world).toEqual(first);
      const imported = parseBackup(JSON.stringify({ format: 'twilight-world-backup', version: 1, exportedAt: savedAt, worlds: [{ slot: 1, world: first }, { slot: 2, world: second }] }));
      expect(imported.worlds.map(w => w.world.schemaVersion)).toEqual([7, 7]);
      expect(imported.worlds[0].world.players).toEqual(first.players);
    } finally { await database.delete(); }
  });
});
