import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { Authority } from '../src/game/authority';
import { createPlayer, createWorld, parseWorld } from '../src/game/model';
import { FURNITURE_IDS, getRoomObjects, objectOffset, roomLayout } from '../src/content/room';
import { placementError } from '../src/content/furnishing';
import { GameDatabase } from '../src/persistence/database';
import { nextWakeMinute, startSleep, wakePlayer } from '../src/game/time';

describe('shared room arrangement', () => {
  it('can relocate every requested furnishing with its action and collision geometry', async () => {
    for (const id of FURNITURE_IDS) {
      const world = createWorld(createPlayer('Keeper'));
      const map = id === 'sofa' || id === 'armchair' ? 'living' : 'castle';
      world.players[world.hostId].map = map;
      if (map === 'living') world.players[world.hostId].y = 464;
      const offset = [{ x: -16, y: 0 }, { x: 16, y: 0 }, { x: 0, y: 16 }, { x: 0, y: -16 }].find(p => !placementError(world, id, p, map));
      expect(offset, id).toBeDefined();
      const host = new Authority(world, async () => {});
      await host.dispatch(world.hostId, 1, { kind: 'place', target: id, ...offset!, expected: { x: 0, y: 0 } });
      const before = getRoomObjects(map).find(o => o.id === id)!, after = getRoomObjects(map, roomLayout(host.world, map)).find(o => o.id === id)!;
      expect(after.bounds.x).toBe(before.bounds.x + offset!.x);
      expect(after.bounds.y).toBe(before.bounds.y + offset!.y);
    }
  });
  it('rejects occupied floor, the doorway, out-of-room placements and stale competing moves', async () => {
    const world = createWorld(createPlayer('Keeper')), host = new Authority(world, async () => {});
    expect(placementError(world, 'chest', { x: -324, y: -40 })).toMatch(/residents|way/);
    expect(placementError(world, 'chest', { x: 0, y: 40 })).toMatch(/doorway|way/);
    expect(placementError(world, 'bed', { x: -200, y: 0 })).toMatch(/inside/);
    await host.dispatch(world.hostId, 1, { kind: 'place', target: 'carpet', x: 8, y: 0, expected: { x: 0, y: 0 } });
    const once = host.world.layout;
    expect(await host.dispatch(world.hostId, 1, { kind: 'place', target: 'carpet', x: 8, y: 0, expected: { x: 0, y: 0 } })).toBe(false);
    expect(host.world.layout).toEqual(once);
    await expect(host.dispatch(world.hostId, 2, { kind: 'place', target: 'carpet', x: 16, y: 0, expected: { x: 0, y: 0 } })).rejects.toThrow('other resident');
  });
  it('persists layouts atomically and preserves schema 2 profiles on migration', async () => {
    const database = new GameDatabase(crypto.randomUUID());
    try {
      const world = createWorld(createPlayer('Keeper')); await database.save(1, world, { create: true });
      const host = new Authority(world, draft => database.save(1, draft));
      await host.dispatch(world.hostId, 1, { kind: 'place', target: 'carpet', x: 8, y: 8, expected: { x: 0, y: 0 } });
      expect((await database.load(1))!.world.layout).toEqual({ carpet: { x: 8, y: 8 } });
      const failing = new Authority(host.world, async () => { throw Error('Disk full'); });
      await expect(failing.dispatch(world.hostId, 2, { kind: 'place', target: 'carpet', x: 16, y: 8, expected: { x: 8, y: 8 } })).rejects.toThrow('Disk full');
      expect(failing.world).toEqual(host.world);
      const { layout: _layout, roomLayouts: _rooms, dayReports: _days, ...old } = world; void _layout; void _rooms; void _days;
      const migrated = parseWorld({ ...old, schemaVersion: 2 });
      expect(migrated.players).toEqual(world.players); expect(migrated.layout).toEqual({});
    } finally { await database.delete(); }
  });
  it('moves the letter and attached candle with a desk, and keeps a separately placed candle independent', () => {
    const layout = { desk: { x: 16, y: 16 } };
    expect(objectOffset('letter', layout)).toEqual(layout.desk);
    expect(objectOffset('candle-desk', layout)).toEqual(layout.desk);
    expect(objectOffset('candle-desk', { ...layout, 'candle-desk': { x: 0, y: 0 } })).toEqual({ x: 0, y: 0 });
  });
  it('blocks moving an occupied bed and always wakes at the next six oclock', () => {
    for (const now of [0, 60, 359, 360, 720, 1080, 1439, 1500]) {
      const wake = nextWakeMinute(now); expect(wake).toBeGreaterThan(now); expect(wake % 1440).toBe(360);
    }
    const world = createWorld(createPlayer('Keeper')), player = world.players[world.hostId];
    startSleep(player, 350); expect(placementError(world, 'bed', { x: -16, y: 0 })).toContain('bed');
    player.fatigue.consecutiveAllNighters = 3; wakePlayer(player, 360);
    expect(player.energy).toBe(100); expect(player.fatigue.consecutiveAllNighters).toBe(0);
  });
  it('toggles the hearth without undoing its story event or repeating it', async () => {
    const world = createWorld(createPlayer('Keeper')); Object.assign(world.players[world.hostId], { x: 550, y: 280 });
    const host = new Authority(world, async () => {});
    for (let i = 1; i <= 3; i++) await host.dispatch(world.hostId, i, { kind: 'interact', target: 'hearth' });
    expect(host.world.story.flags.hearth).toBe(true); expect(host.world.events).toHaveLength(1);
    await host.dispatch(world.hostId, 4, { kind: 'interact', target: 'hearth' });
    expect(host.world.story.flags.hearth).toBe(false); expect(host.world.quests['a-light-for-the-house']).toBe('complete');
  });
});
