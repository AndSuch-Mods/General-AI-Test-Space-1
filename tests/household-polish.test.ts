import { describe, expect, it } from 'vitest';
import { HotbarDock } from '../src/ui/hotbar-dock';
import { bedPoint, canInteract, furniturePoint, getRoomObjects, inBedEntry, nearestInteractable } from '../src/content/room';
import { Authority } from '../src/game/authority';
import { createPlayer, createWorld } from '../src/game/model';
import { startSleep } from '../src/game/time';

describe('precise household actions', () => {
  it('keeps a saved sleeper at the chosen position without restarting rest or adding a resume write', async () => {
    const world = createWorld(createPlayer('Sleeper')), id = world.hostId;
    world.layout.bed = { x: 0, y: 0, rotation: 1 };
    const point = bedPoint({ x: 207, y: 314 }, 'castle', world.layout);
    Object.assign(world.players[id], point);
    startSleep(world.players[id], world.clock.totalMinutes, world.layout);
    const fatigue = structuredClone(world.players[id].fatigue);
    let commits = 0;
    const authority = new Authority(world, async () => { commits++; });
    await authority.prepareRoom();
    expect(authority.world.players[id]).toMatchObject(point);
    expect(authority.world.players[id].fatigue).toEqual(fatigue);
    await authority.prepareRoom(); expect(commits).toBe(0);
  });
  it('selects the nearby desk prop without reaching it from a window or neighboring prop', () => {
    const journal = getRoomObjects().find(o => o.id === 'journal')!;
    for (const p of [{ x: 386, y: 220 }, { x: 432, y: 294 }, { x: 386, y: 326 }]) expect(canInteract(p, journal)).toBe(false);
    expect(nearestInteractable({ x: 386, y: 302 })?.id).toBe('journal');
    expect(nearestInteractable({ x: 362, y: 302 })?.id).toBe('letter');
    expect(nearestInteractable({ x: 416, y: 308 })?.id).toBe('candle-desk');
  });
  it('requires stepping into the actual bed opening, for every direction and bedroom', async () => {
    for (const map of ['castle', 'bedroom-2'] as const) for (const rotation of [0, 1, 2, 3] as const) {
      const layout = { bed: { x: 0, y: 0, rotation } };
      const shift = map === 'bedroom-2' ? 152 : 0;
      const inside = { ...furniturePoint('bed', { x: 180 + shift, y: 302 }, map, layout), map };
      const outside = { ...furniturePoint('bed', { x: 270 + shift, y: 302 }, map, layout), map };
      const bed = getRoomObjects(map, layout).find(o => o.id === 'bed')!;
      expect(inBedEntry(inside, layout)).toBe(true); expect(canInteract(inside, bed, layout)).toBe(true);
      expect(canInteract(outside, bed, layout)).toBe(false);
    }
    const world = createWorld(createPlayer('Keeper')), id = world.hostId;
    Object.assign(world.players[id], { x: 270, y: 302 });
    const authority = new Authority(world, async () => {});
    await expect(authority.dispatch(id, 1, { kind: 'sleep' })).rejects.toThrow('Step into');
    await authority.dispatch(id, 1, { kind: 'move', dx: -1, dy: 0 });
    await authority.dispatch(id, 2, { kind: 'move', dx: -1, dy: 0 });
    expect(authority.world.players[id].fatigue.sleeping).toBe(false);
    await authority.dispatch(id, 3, { kind: 'sleep' });
    expect(authority.world.players[id].fatigue.sleeping).toBe(true);
  });
});

describe('hotbar clearance and hysteresis', () => {
  it('waits for the south camera limit, stays put through small reversals and returns after five paces', () => {
    const dock = new HotbarDock();
    expect(dock.update('living', 410, 465, 280)).toBe('bottom');
    expect(dock.update('living', 416, 502, 280)).toBe('top');
    for (const y of [414, 420, 402, 416, 390, 347]) expect(dock.update('living', y, 502, 280)).toBe('top');
    expect(dock.update('living', 346, 478, 280)).toBe('bottom');
    expect(dock.update('living', 410, 502, 280)).toBe('bottom');
    expect(dock.update('living', 420, 502, 280)).toBe('top');
    expect(dock.update('landing', 258, 318, 280)).toBe('bottom');
  });
});
