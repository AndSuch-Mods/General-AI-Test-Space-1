import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { Authority } from '../src/game/authority';
import { createPlayer, createWorld, parseWorld } from '../src/game/model';
import { canStand, getRoomObjects, roomFlag, roomLayout, bedPoint } from '../src/content/room';
import { GameDatabase } from '../src/persistence/database';

async function household() {
  const authority = new Authority(createWorld(createPlayer('Keeper')), async () => {});
  const guest = crypto.randomUUID();
  await authority.join({ id: guest, key: crypto.randomUUID(), name: 'Companion', appearance: 'moss', worldId: authority.world.worldId, epoch: authority.world.epoch, revision: 0 });
  return { authority, host: authority.world.hostId, guest };
}
const carpetLayout = { carpet: { x: 8, y: 0, rotation: 0 as const } };
describe('a shared home with private bedrooms', () => {
  it('enforces ownership on the host, shares living-room edits, and retains independent layouts', async () => {
    const { authority: a, host, guest } = await household();
    await expect(a.dispatch(guest, 1, { kind: 'save-layout', map: 'castle', layout: carpetLayout, expected: {} })).rejects.toThrow('owner');
    await a.dispatch(host, 1, { kind: 'save-layout', map: 'castle', layout: carpetLayout, expected: {} });
    a.world.players[guest].map = 'bedroom-2';
    await a.dispatch(guest, 2, { kind: 'save-layout', map: 'bedroom-2', layout: carpetLayout, expected: {} });
    a.world.players[host].map = 'bedroom-2';
    await expect(a.dispatch(host, 2, { kind: 'save-layout', map: 'bedroom-2', layout: { carpet: { x: 16, y: 0 } }, expected: carpetLayout })).rejects.toThrow('owner');
    for (const id of [host, guest]) Object.assign(a.world.players[id], { map: 'living', y: 464 });
    await a.dispatch(guest, 3, { kind: 'save-layout', map: 'living', layout: carpetLayout, expected: {} });
    await a.dispatch(host, 3, { kind: 'save-layout', map: 'living', layout: { carpet: { x: 16, y: 0 } }, expected: carpetLayout });
    expect(a.world.layout.carpet?.x).toBe(8); expect(a.world.roomLayouts['bedroom-2'].carpet?.x).toBe(8);
    expect(a.world.roomLayouts.living.carpet?.x).toBe(16);
    expect(parseWorld(JSON.parse(JSON.stringify(a.world)))).toEqual(a.world);
  });
  it('allows visitors to use lights, containers and the other bedroom bed without changing its layout', async () => {
    const { authority: a, host } = await household(), p = a.world.players[host];
    const candle = getRoomObjects('bedroom-2').find(o => o.id === 'candle-desk')!;
    Object.assign(p, { map: 'bedroom-2', x: candle.anchor.x, y: candle.anchor.y + 12 });
    await a.dispatch(host, 1, { kind: 'interact', target: 'candle-desk' });
    expect(roomFlag(a.world, 'bedroom-2', 'candle-desk', true)).toBe(false);
    expect(roomFlag(a.world, 'castle', 'candle-desk', true)).toBe(true);
    Object.assign(a.world.players[host], { x: 804, y: 430 });
    await a.dispatch(host, 2, { kind: 'interact', target: 'chest' });
    expect(a.world.players[host].interaction).toBe('chest');
    await a.dispatch(host, 3, { kind: 'close-interaction' });
    Object.assign(a.world.players[host], bedPoint({ x: 242, y: 302 }, 'bedroom-2'));
    await a.dispatch(host, 4, { kind: 'sleep' });
    expect(a.world.players[host].map).toBe('bedroom-2');
    expect(a.world.players[host].fatigue.sleeping).toBe(true);
    expect(a.world.roomLayouts['bedroom-2']).toEqual({});
  });
  it('fits both sleepers in either bed, waits for settling, then saves separate and shared daily records once', async () => {
    const { authority: a, host, guest } = await household();
    a.world.layout.bed = { x: 0, y: 16 };
    a.world.events.push({ id: crypto.randomUUID(), kind: 'hearth', actor: host, minute: 1000 });
    a.world.players[guest].discoveries.push('letter');
    for (const id of [host, guest]) { Object.assign(a.world.players[id], { x: 242, y: 318 }); await a.dispatch(id, 1, { kind: 'sleep' }); }
    expect(a.world.players[host]).toMatchObject({ x: 194, y: 318, bedDisturbances: 1, fatigue: { sleeping: true } });
    expect(a.world.players[guest]).toMatchObject({ x: 242, y: 318, fatigue: { sleeping: true } });
    expect(await a.advanceTime(.5, { activeIds: [host, guest], paused: false })).toBe(false);
    expect(a.world.clock.totalMinutes).toBe(1080);
    await a.advanceTime(1, { activeIds: [host, guest], paused: false });
    expect(a.world.clock.totalMinutes).toBe(1800); expect(a.world.dayReports).toHaveLength(1);
    const report = a.world.dayReports[0];
    expect(report.shared).toEqual(['hearth']); expect(report.players[guest].discoveries).toBe(1);
    expect(report.players[host].discoveries).toBe(0); expect(report.players[guest].rested).toBe(true);
    for (const player of Object.values(a.world.players)) expect(canStand(player, player.map, roomLayout(a.world, player.map))).toBe(true);
    const database = new GameDatabase(crypto.randomUUID());
    try { await database.save(1, a.world, { create: true }); expect((await database.load(1))!.world.dayReports).toEqual(a.world.dayReports); }
    finally { await database.delete(); }
    await a.advanceTime(1, { activeIds: [host, guest], paused: false }); expect(a.world.dayReports).toHaveLength(1);
  });
  it('connects both bedrooms through the living room and migrates a schema 3 layout intact', async () => {
    const { authority: a, host } = await household();
    Object.assign(a.world.players[host], { x: 852, y: 343 });
    await a.dispatch(host, 1, { kind: 'interact', target: 'door-out' }); expect(a.world.players[host].map).toBe('living');
    Object.assign(a.world.players[host], { x: 852, y: 343 });
    await a.dispatch(host, 2, { kind: 'interact', target: 'door-right' }); expect(a.world.players[host].map).toBe('bedroom-2');
    await a.dispatch(host, 3, { kind: 'interact', target: 'door-out' }); expect(a.world.players[host].map).toBe('living');
    Object.assign(a.world.players[host], { x: 480, y: 450 });
    await a.dispatch(host, 4, { kind: 'interact', target: 'door-out' }); expect(a.world.players[host].map).toBe('landing');
    await a.dispatch(host, 5, { kind: 'interact', target: 'door-home' }); expect(a.world.players[host].map).toBe('living');
    const old = createWorld(createPlayer('Old save')); old.layout.carpet = { x: 8, y: 16 };
    const { roomLayouts: _rooms, dayReports: _days, ...schema3 } = old; void _rooms; void _days;
    const upgraded = parseWorld({ ...schema3, schemaVersion: 3 });
    expect(upgraded.layout).toEqual(old.layout); expect(upgraded.players).toEqual(old.players); expect(upgraded.dayReports).toEqual([]);
  });
  it('keeps authored schema 5 furnishing positions and personal progress across new bedroom defaults', () => {
    const world = createWorld(createPlayer('Returning keeper'));
    world.layout.plant = { x: -8, y: -16 };
    world.roomLayouts['bedroom-2'] = { bed: { x: 12, y: 8 }, desk: { x: -8, y: 12 }, 'candle-desk': { x: 4, y: 6 } };
    world.players[world.hostId].inventory = { 'cacao-bean': 7 };
    world.players[world.hostId].discoveries.push('letter');
    const upgraded = parseWorld({ ...world, schemaVersion: 5 });
    const bedroom = getRoomObjects('bedroom-2', upgraded.roomLayouts['bedroom-2']);
    expect(bedroom.find(o => o.id === 'bed')!.bounds).toMatchObject({ x: 122, y: 218 });
    expect(bedroom.find(o => o.id === 'desk')!.bounds).toMatchObject({ x: 322, y: 232 });
    expect(bedroom.find(o => o.id === 'candle-desk')!.bounds).toMatchObject({ x: 409, y: 221 });
    expect(getRoomObjects('castle', upgraded.layout).find(o => o.id === 'plant')!.bounds).toMatchObject({ x: 828, y: 274 });
    expect(upgraded.players[world.hostId]).toEqual(world.players[world.hostId]);
    expect(parseWorld(JSON.parse(JSON.stringify(upgraded)))).toEqual(upgraded);
  });
});
