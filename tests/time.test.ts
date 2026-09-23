import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { Authority } from '../src/game/authority';
import { createPlayer, createWorld, parseWorld, type World } from '../src/game/model';
import { advanceWorldClock, daylight, dayPhase, energyCap, nextWakeMinute, startSleep, wakePlayer } from '../src/game/time';
import { BED_EXIT, BED_REST, canStand, getRoomObjects, inBedEntry, moveInRoom, objectColliders, FURNITURE_IDS } from '../src/content/room';
import { GameDatabase, parseBackup } from '../src/persistence/database';

function household() { return createWorld(createPlayer('Keeper')); }
async function addGuest(authority: Authority) {
  const id = crypto.randomUUID();
  await authority.join({ id, key: crypto.randomUUID(), name: 'Companion', appearance: 'violet', worldId: authority.world.worldId, epoch: authority.world.epoch, revision: 0 });
  return id;
}
describe('shared clock and personal rest', () => {
  it('uses the saved time scale, pauses without writes, and bounds delayed timer callbacks', async () => {
    const world = household(); world.clock.secondsPerGameMinute = .5;
    const commits: World[] = [];
    const authority = new Authority(world, async draft => { commits.push(draft); });
    const options = { activeIds: [world.hostId], paused: true };
    expect(await authority.advanceTime(2, options)).toBe(false);
    expect(commits).toHaveLength(0);
    await authority.advanceTime(2, { ...options, paused: false });
    expect(authority.world.clock.totalMinutes).toBe(1084);
    await authority.advanceTime(600, { ...options, paused: false });
    expect(authority.world.clock.totalMinutes).toBe(1094);
    await expect(authority.advanceTime(-1, options)).rejects.toThrow('clock');
  });
  it('crosses midnight freely and applies each sunrise once', () => {
    const world = household(), player = world.players[world.hostId];
    world.clock.totalMinutes = 1439;
    advanceWorldClock(world, 2, [player.id]);
    expect(player.fatigue.sleeping).toBe(false);
    expect(player.fatigue.consecutiveAllNighters).toBe(0);
    advanceWorldClock(world, 359, [player.id]);
    expect(player.fatigue.consecutiveAllNighters).toBe(1);
    expect(player.energy).toBe(80);
    advanceWorldClock(world, .5, [player.id]);
    expect(player.fatigue.consecutiveAllNighters).toBe(1);
  });
  it('keeps the 80/60/40/20 caps and gradually collapses only the exhausted resident', () => {
    const world = household(), player = world.players[world.hostId], companion = createPlayer('Guest');
    world.players[companion.id] = companion;
    world.clock.totalMinutes = 359;
    for (let night = 1; night <= 5; night++) {
      advanceWorldClock(world, night === 1 ? 1 : 1440, [player.id]);
      expect(player.fatigue.consecutiveAllNighters).toBe(night);
      expect(energyCap(player)).toBe(Math.max(20, 100 - night * 20));
    }
    advanceWorldClock(world, 360, [player.id]);
    expect(energyCap(player)).toBe(10);
    expect(player.fatigue.sleeping).toBe(false);
    advanceWorldClock(world, 360, [player.id]);
    expect(player.fatigue.sleeping).toBe(true);
    expect(player.energy).toBe(0);
    expect(companion.fatigue.consecutiveAllNighters).toBe(0);
    expect(companion.fatigue.sleeping).toBe(false);
  });
  it('asks before sleep through the lower bed slit, keeps the rest solid, and wakes clear of it', async () => {
    const world = household(), player = world.players[world.hostId];
    Object.assign(player, { x: 242, y: 302 });
    player.fatigue.consecutiveAllNighters = 3; player.energy = 20;
    expect(canStand(player)).toBe(true);
    expect(inBedEntry(moveInRoom(player, -1, 0))).toBe(true);
    expect(canStand({ x: 200, y: 328 })).toBe(false);
    expect(canStand({ x: 200, y: 252 })).toBe(false);
    const authority = new Authority(world, async () => {});
    await authority.dispatch(player.id, 1, { kind: 'move', dx: -1, dy: 0 });
    expect(authority.world.players[player.id].fatigue.sleeping).toBe(false);
    await authority.dispatch(player.id, 2, { kind: 'sleep' });
    expect(authority.world.players[player.id].fatigue.sleeping).toBe(true);
    expect(authority.world.players[player.id].x).toBe(BED_REST.x - 27);
    await authority.advanceTime(2, { activeIds: [player.id], paused: false });
    const rested = authority.world.players[player.id];
    expect(authority.world.clock.totalMinutes).toBe(1800);
    expect(rested.fatigue).toEqual({ sleeping: false, sleepStartedAt: null, wakeAt: null, consecutiveAllNighters: 0, terminalMinutes: 0 });
    expect(rested.energy).toBe(100);
    expect({ x: rested.x, y: rested.y }).toEqual(BED_EXIT);
    expect(canStand(rested)).toBe(true);
  });
  it('never skips time for one co-op sleeper, then advances when both choose sleep', async () => {
    const authority = new Authority(household(), async () => {});
    const host = authority.world.hostId, guest = await addGuest(authority);
    Object.assign(authority.world.players[guest], { x: 242, y: 302 });
    await authority.dispatch(guest, 1, { kind: 'sleep' });
    await authority.advanceTime(1, { activeIds: [host, guest], paused: false });
    expect(authority.world.clock.totalMinutes).toBe(1081);
    expect(authority.world.players[guest].fatigue.sleeping).toBe(true);
    expect(authority.world.players[host].fatigue.sleeping).toBe(false);
    Object.assign(authority.world.players[host], { x: 242, y: 302 });
    await authority.dispatch(host, 1, { kind: 'sleep' });
    await authority.advanceTime(2, { activeIds: [host, guest], paused: false });
    expect(authority.world.clock.totalMinutes).toBe(1800);
    expect(Object.values(authority.world.players).every(player => !player.fatigue.sleeping)).toBe(true);
  });
  it('interrupts sleep without resetting fatigue, and full daytime rest clears it', () => {
    const player = createPlayer('Keeper');
    player.fatigue.consecutiveAllNighters = 4; player.energy = 8;
    startSleep(player, 9 * 60); wakePlayer(player, 10 * 60);
    expect(player.fatigue.consecutiveAllNighters).toBe(4);
    expect(player.energy).toBeLessThanOrEqual(20);
    startSleep(player, 10 * 60); wakePlayer(player, 18 * 60);
    expect(player.fatigue.consecutiveAllNighters).toBe(0);
    expect(player.energy).toBe(100);
    expect(nextWakeMinute(25 * 60)).toBe(30 * 60);
  });
  it('persists an in-progress sleep and keeps failed clock writes out of live state', async () => {
    const db = new GameDatabase(crypto.randomUUID());
    try {
      const world = household(); startSleep(world.players[world.hostId], world.clock.totalMinutes);
      await db.save(1, world, { create: true });
      expect((await db.load(1))?.world).toEqual(world);
      const authority = new Authority(world, async () => { throw Error('Disk full'); });
      await expect(authority.advanceTime(2, { activeIds: [world.hostId], paused: false })).rejects.toThrow('Disk full');
      expect(authority.world).toEqual(world);
    } finally { await db.delete(); }
  });
  it('uses gradual daylight and distinct day/night phases', () => {
    expect(daylight(300)).toBe(0); expect(daylight(360)).toBe(.5); expect(daylight(420)).toBe(1);
    expect(daylight(1140)).toBe(.5); expect(daylight(1200)).toBe(0);
    expect(dayPhase(360)).toBe('dawn'); expect(dayPhase(900)).toBe('day'); expect(dayPhase(1320)).toBe('night');
  });
});

describe('maps, containers and migration', () => {
  it('travels through the real room door without moving the other resident', async () => {
    const authority = new Authority(household(), async () => {});
    const host = authority.world.hostId, guest = await addGuest(authority);
    Object.assign(authority.world.players[guest], { x: 828, y: 343 });
    await authority.dispatch(guest, 1, { kind: 'interact', target: 'door-out' });
    expect(authority.world.players[guest].map).toBe('living');
    expect(authority.world.players[host].map).toBe('castle');
    await expect(authority.dispatch(guest, 2, { kind: 'interact', target: 'chest' })).rejects.toThrow('closer');
    await authority.dispatch(guest, 3, { kind: 'interact', target: 'door-left' });
    expect(authority.world.players[guest].map).toBe('castle');
    expect(canStand(authority.world.players[guest])).toBe(true);
  });
  it('gives both maps valid solids and reachable furnishing interactions', () => {
    for (const map of ['castle', 'bedroom-2', 'living', 'landing', 'kitchen'] as const) for (const object of getRoomObjects(map)) {
      for (const rect of objectColliders(object)) expect(canStand({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, map }), object.id).toBe(false);
      expect(object.actions.length > 0 || object.id.startsWith('window') || FURNITURE_IDS.includes(object.id as typeof FURNITURE_IDS[number]), object.id).toBe(true);
    }
  });
  it('persists opening intent and clears it on explicit close or guest departure', async () => {
    const authority = new Authority(household(), async () => {});
    const guest = await addGuest(authority);
    Object.assign(authority.world.players[guest], { x: 804, y: 430 });
    await authority.dispatch(guest, 1, { kind: 'interact', target: 'chest' });
    expect(authority.world.players[guest].interaction).toBe('chest');
    await authority.dispatch(guest, 2, { kind: 'close-interaction' });
    expect(authority.world.players[guest].interaction).toBeNull();
    await authority.dispatch(guest, 3, { kind: 'interact', target: 'chest' });
    await authority.releasePlayer(guest);
    expect(authority.world.players[guest].interaction).toBeNull();
  });
  it('migrates schema 1 backups without losing either resident or world progress', async () => {
    const authority = new Authority(household(), async () => {});
    const guest = await addGuest(authority);
    authority.world.players[guest].inventory['cacao-bean'] = 9;
    authority.world.players[guest].discoveries = ['letter'];
    authority.world.story.flags.hearth = true;
    const { layout: _layout, roomLayouts: _rooms, dayReports: _days, ...legacyBase } = authority.world; void _layout; void _rooms; void _days;
    const legacy = { ...legacyBase, schemaVersion: 1, players: Object.fromEntries(Object.entries(authority.world.players).map(([id, player]) => {
      const { interaction: _interaction, fatigue, ...rest } = player;
      const { sleepStartedAt: _start, wakeAt: _end, ...oldFatigue } = fatigue;
      void _interaction; void _start; void _end;
      return [id, { ...rest, fatigue: oldFatigue }];
    })) };
    const migrated = parseWorld(legacy);
    expect(migrated.schemaVersion).toBe(7);
    expect(migrated.worldId).toBe(authority.world.worldId);
    expect(migrated.revision).toBe(authority.world.revision);
    expect(migrated.players[guest].inventory).toEqual({ 'cacao-bean': 9 });
    expect(migrated.players[guest].discoveries).toEqual(['letter']);
    expect(migrated.story.flags.hearth).toBe(true);
    expect(parseBackup(JSON.stringify({ format: 'twilight-world-backup', version: 1, exportedAt: new Date().toISOString(), worlds: [{ slot: 1, world: legacy }] })).worlds[0].world).toEqual(migrated);
    expect(() => parseWorld({ ...legacy, hostId: crypto.randomUUID() })).toThrow('identities');
  });
});
