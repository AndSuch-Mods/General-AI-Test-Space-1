import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { Authority } from '../src/game/authority';
import { createPlayer, createWorld } from '../src/game/model';
import { canStand, canInteract, moveInRoom, objectForAction, roomObjects, safePosition } from '../src/content/room';
import { arrival } from '../src/content/arrival';

describe('room geometry', () => {
  it('blocks furniture from every direction, including a fast swept move', () => {
    for (const object of roomObjects.filter(object => object.collision)) {
      const r = object.collision!;
      const approaches = [
        { x: r.x - 12, y: r.y + r.height / 2, dx: 1, dy: 0 },
        { x: r.x + r.width + 12, y: r.y + r.height / 2, dx: -1, dy: 0 },
        { x: r.x + r.width / 2, y: r.y - 2, dx: 0, dy: 1 },
        { x: r.x + r.width / 2, y: r.y + r.height + 10, dx: 0, dy: -1 },
      ];
      for (const point of approaches.filter(point => canStand(point))) {
        const moved = moveInRoom(point, point.dx, point.dy, 180);
        expect(canStand(moved), object.id).toBe(true);
        expect(Math.hypot(moved.x - point.x, moved.y - point.y), object.id).toBeLessThan(4.1);
      }
    }
  });
  it('slides alongside the bed and keeps diagonal speed at the same limit', () => {
    const besideBed = { x: 262, y: 300 };
    const result = moveInRoom(besideBed, -1, 1);
    expect(result.x).toBeGreaterThanOrEqual(260);
    expect(result.y).toBeGreaterThan(besideBed.y);
    expect(canStand(result)).toBe(true);
    const diagonal = moveInRoom({ x: 480, y: 364 }, 1, 1);
    expect(Math.hypot(diagonal.x - 480, diagonal.y - 364)).toBeCloseTo(14);
  });
  it('gives every visible prop reachable actions without reaching through the bed', () => {
    for (const object of roomObjects) {
      expect(object.actions.length).toBeGreaterThan(0);
      for (const action of object.actions) expect(arrival.some(event => event.id === action)).toBe(true);
      let reachable = false;
      for (let y = 218; y <= 476 && !reachable; y += 4) for (let x = 90; x <= 870 && !reachable; x += 4) {
        if (canInteract({ x, y }, object)) reachable = true;
      }
      expect(reachable, object.id).toBe(true);
    }
    expect(canInteract({ x: 205, y: 300 }, objectForAction('bed'))).toBe(false);
    expect(canInteract({ x: 480, y: 364 }, objectForAction('pantry'))).toBe(false);
  });
});

describe('room persistence and shared interaction', () => {
  it('repairs old positions durably without changing either profile progression', async () => {
    const initial = createWorld(createPlayer('Keeper'));
    Object.assign(initial.players[initial.hostId], { x: 190, y: 290, inventory: { 'cacao-bean': 3 }, discoveries: ['letter'] });
    const original = structuredClone(initial);
    let saved = initial;
    const authority = new Authority(initial, async state => { saved = state; });
    await authority.prepareRoom();
    const player = authority.world.players[initial.hostId];
    expect(canStand(player)).toBe(true);
    expect(player.inventory).toEqual(original.players[initial.hostId].inventory);
    expect(player.discoveries).toEqual(['letter']);
    expect(saved.revision).toBe(original.revision + 1);
    expect(safePosition(player)).toEqual({ x: player.x, y: player.y });
    await authority.prepareRoom();
    expect(authority.world.revision).toBe(saved.revision);
  });
  it('does not publish a position repair when saving fails, and exit waits for durable state', async () => {
    const initial = createWorld(createPlayer('Keeper'));
    initial.players[initial.hostId].x = 190; initial.players[initial.hostId].y = 290;
    const authority = new Authority(initial, async () => { throw Error('Disk full'); });
    await expect(authority.prepareRoom()).rejects.toThrow('Disk full');
    await expect(authority.flush()).rejects.toThrow('Disk full');
    expect(authority.world).toEqual(initial);
  });
  it('toggles candles once per intent without confusing them with story completion', async () => {
    const initial = createWorld(createPlayer('Keeper'));
    Object.assign(initial.players[initial.hostId], { x: 382, y: 300 });
    const authority = new Authority(initial, async () => {});
    await authority.dispatch(initial.hostId, 1, { kind: 'interact', target: 'candle-desk' });
    await authority.dispatch(initial.hostId, 1, { kind: 'interact', target: 'candle-desk' });
    expect(authority.world.story.flags['candle-desk']).toBe(false);
    expect(authority.world.quests['a-light-for-the-house']).toBeUndefined();
    await authority.dispatch(initial.hostId, 2, { kind: 'interact', target: 'candle-desk' });
    expect(authority.world.story.flags['candle-desk']).toBe(true);
  });
  it('allows exit after a rejected interaction without claiming it changed the save', async () => {
    const initial = createWorld(createPlayer('Keeper'));
    const authority = new Authority(initial, async () => {});
    await expect(authority.dispatch(initial.hostId, 1, { kind: 'interact', target: 'chest' })).rejects.toThrow('closer');
    await expect(authority.flush()).resolves.toBeUndefined();
    expect(authority.world).toEqual(initial);
  });
  it('serializes simultaneous chest withdrawals and never duplicates a stack on retries', async () => {
    const initial = createWorld(createPlayer('Keeper'));
    Object.assign(initial.players[initial.hostId], { x: 804, y: 430, inventory: { 'cacao-bean': 3 } });
    const authority = new Authority(initial, async () => {});
    const guest = crypto.randomUUID();
    await authority.join({ id: guest, key: crypto.randomUUID(), name: 'Guest', appearance: 'moss', worldId: initial.worldId, epoch: initial.epoch, revision: 0 });
    Object.assign(authority.world.players[guest], { x: 804, y: 430 });
    await authority.dispatch(initial.hostId, 1, { kind: 'transfer', direction: 'deposit', item: 'cacao-bean', count: 3 });
    await authority.dispatch(initial.hostId, 1, { kind: 'transfer', direction: 'deposit', item: 'cacao-bean', count: 3 });
    expect(authority.world.chest['cacao-bean']).toBe(3);
    const outcomes = await Promise.allSettled([
      authority.dispatch(initial.hostId, 2, { kind: 'transfer', direction: 'withdraw', item: 'cacao-bean', count: 3 }),
      authority.dispatch(guest, 1, { kind: 'transfer', direction: 'withdraw', item: 'cacao-bean', count: 3 }),
    ]);
    expect(outcomes.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(Object.values(authority.world.players).reduce((sum, player) => sum + (player.inventory['cacao-bean'] ?? 0), authority.world.chest['cacao-bean'] ?? 0)).toBe(3);
    expect(authority.world.chest['cacao-bean']).toBeUndefined();
  });
});
