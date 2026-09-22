import { describe, expect, it } from 'vitest';
import { Authority } from '../src/game/authority';
import { createPlayer, createWorld, parseWorld } from '../src/game/model';
import { canInteract, canStand, doorEntry, getRoomObjects, nearestInteractable, roomLayout, ROOM_MAPS } from '../src/content/room';
import { placementError } from '../src/content/furnishing';

describe('wall-aligned household routes', () => {
  it.each(ROOM_MAPS)('returns through the opposite wall for every doorway in %s', async map => {
    const opposite = { west: 'east', east: 'west', north: 'south', south: 'north' };
    for (const door of getRoomObjects(map).filter(o => o.door)) {
      const a = new Authority(createWorld(createPlayer('Keeper')), async () => {}), id = a.world.hostId;
      Object.assign(a.world.players[id], doorEntry(door), { map });
      expect(canStand(a.world.players[id]), `${map}/${door.id} entry`).toBe(true);
      expect(canInteract(a.world.players[id], door)).toBe(true);
      await a.dispatch(id, 1, { kind: 'interact', target: door.actions[0] });
      const destination = door.door!.to, counterpart = getRoomObjects(destination).find(o => o.id === door.door!.counterpart)!;
      expect(counterpart.door!.wall).toBe(opposite[door.door!.wall]);
      expect(a.world.players[id]).toMatchObject({ ...doorEntry(counterpart), map: destination });
      expect(canStand(a.world.players[id])).toBe(true);
      expect(nearestInteractable(a.world.players[id])?.id).toBe(counterpart.id);
      await a.dispatch(id, 2, { kind: 'interact', target: counterpart.actions[0] });
      expect(a.world.players[id]).toMatchObject({ ...doorEntry(door), map });
    }
  });
  it('repairs an obstructed legacy arrival without moving furniture or losing saved progress', async () => {
    const world = createWorld(createPlayer('Keeper'));
    world.roomLayouts.living.chest = { x: -656, y: -56 };
    world.players[world.hostId].discoveries.push('letter');
    const a = new Authority(parseWorld(JSON.parse(JSON.stringify(world))), async () => {});
    Object.assign(a.world.players[world.hostId], { x: 852, y: 343 });
    await a.dispatch(world.hostId, 1, { kind: 'interact', target: 'door-out' });
    const p = a.world.players[world.hostId];
    expect(p.map).toBe('living'); expect(canStand(p, p.map, roomLayout(a.world, p.map))).toBe(true);
    expect({ x: p.x, y: p.y }).not.toEqual({ x: 132, y: 343 }); expect(a.world.roomLayouts).toEqual(world.roomLayouts);
    expect(p.discoveries).toEqual(['letter']);
  });
  it('reserves the left, right and lower living-room approaches during arrangement', () => {
    const world = createWorld(createPlayer('Keeper'));
    for (const offset of [{ x: -656, y: -56 }, { x: 0, y: -56 }, { x: -312, y: 42 }]) {
      expect(placementError(world, 'chest', offset, 'living')).toMatch(/doorway/);
    }
  });
  it('doubles every window while keeping it above the floor and clear of doors', () => {
    for (const map of ROOM_MAPS) {
      const objects = getRoomObjects(map);
      for (const window of objects.filter(o => o.id.startsWith('window'))) {
        expect(window.bounds).toMatchObject({ width: 104, height: 160 });
        expect(window.actions).toEqual([]);
        expect(window.bounds.y + window.bounds.height).toBeLessThanOrEqual(210);
        for (const door of objects.filter(o => o.door)) {
          const a = window.bounds, b = door.bounds;
          expect(a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y).toBe(false);
        }
      }
      const centers = objects.filter(o => o.id.startsWith('window')).map(o => o.bounds.x + o.bounds.width / 2).sort((a, b) => a - b);
      expect(centers).toEqual([280, 680]);
    }
  });
});
