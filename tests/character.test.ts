import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { Authority } from '../src/game/authority';
import { createPlayer, createWorld, parseWorld } from '../src/game/model';
import { DEFAULT_LOOK, type CharacterLook } from '../src/game/art/character-look';
import { GameDatabase, parseBackup } from '../src/persistence/database';

const look: CharacterLook = { body: 'female', hairStyle: 'braid', hairColor: 'copper', skinTone: 'deep', outfit: 'dress' };
describe('persistent resident choices and occupied beds', () => {
  it('keeps every creation choice through a save, backup and returning guest join', async () => {
    const a = new Authority(createWorld(createPlayer('Keeper', 'wine', undefined, look)), async () => {});
    const guest = { id: crypto.randomUUID(), key: crypto.randomUUID(), name: 'Companion', appearance: 'cream' as const, look, worldId: a.world.worldId, epoch: a.world.epoch, revision: 0 };
    await a.join(guest);
    await a.join({ ...guest, look: { ...DEFAULT_LOOK }, appearance: 'amber' });
    expect(a.world.players[guest.id].look).toEqual(look); expect(a.world.players[guest.id].appearance).toBe('cream');
    const db = new GameDatabase(crypto.randomUUID());
    try {
      await db.save(1, a.world, { create: true });
      expect((await db.load(1))!.world.players[a.world.hostId].look).toEqual(look);
      expect(parseBackup(await db.backup([1])).worlds[0].world).toEqual(a.world);
    } finally { await db.delete(); }
    expect(() => parseWorld({ ...a.world, players: { ...a.world.players, [guest.id]: { ...a.world.players[guest.id], look: { ...look, hairStyle: 'invalid' } } } })).toThrow();
  });
  it('migrates the previous household format without changing appearance or progress', () => {
    const old = createWorld(createPlayer('Original', 'violet')); old.layout.carpet = { x: 8, y: 0 };
    old.players[old.hostId].discoveries = ['letter'];
    const raw = JSON.parse(JSON.stringify(old)); raw.schemaVersion = 4;
    for (const p of Object.values(raw.players) as Record<string, unknown>[]) { delete p.look; delete p.bedDisturbances; delete p.bedDisturbedAt; }
    const upgraded = parseWorld(raw);
    expect(upgraded.schemaVersion).toBe(7); expect(upgraded.players[old.hostId].look).toEqual(DEFAULT_LOOK);
    expect(upgraded.players).toEqual(old.players); expect(upgraded.layout).toEqual(old.layout); expect(upgraded.chest).toEqual(old.chest);
  });
  it.each(['castle', 'bedroom-2'] as const)('reacts to crossing a moved bed in %s once without waking, and rolls back failed saves', async map => {
    let fail = false;
    const a = new Authority(createWorld(createPlayer('Keeper')), async () => { if (fail) throw Error('Disk full'); });
    const host = a.world.hostId, guest = crypto.randomUUID();
    await a.join({ id: guest, key: crypto.randomUUID(), name: 'Companion', appearance: 'moss', worldId: a.world.worldId, epoch: a.world.epoch, revision: 0 });
    a.setActivePlayers([host, guest]);
    const layout = map === 'castle' ? a.world.layout : a.world.roomLayouts[map]; layout.bed = { x: 16, y: 16 };
    const shift = map === 'bedroom-2' ? 152 : 0;
    Object.assign(a.world.players[host], { map, x: 169 + shift, y: 318 }); await a.dispatch(host, 1, { kind: 'sleep' });
    Object.assign(a.world.players[guest], { map, x: 176 + shift, y: 318 });
    const resting = structuredClone(a.world.players[host].fatigue);
    fail = true; await expect(a.dispatch(guest, 1, { kind: 'move', dx: -1, dy: 0 })).rejects.toThrow('Disk full');
    expect(a.world.players[host].bedDisturbances).toBe(0);
    fail = false; await a.dispatch(guest, 1, { kind: 'move', dx: -1, dy: 0 });
    expect(a.world.players[host].bedDisturbances).toBe(1); expect(a.world.players[host].fatigue).toEqual(resting);
    await a.dispatch(guest, 1, { kind: 'move', dx: -1, dy: 0 });
    await a.dispatch(guest, 2, { kind: 'move', dx: 1, dy: 0 });
    expect(a.world.players[host].bedDisturbances).toBe(1);
    a.world.clock.totalMinutes += 3;
    await a.dispatch(guest, 3, { kind: 'move', dx: -1, dy: 0 });
    expect(a.world.players[host].bedDisturbances).toBe(2);
    Object.assign(a.world.players[guest], { x: 176 + shift, y: 376 });
    await a.dispatch(guest, 4, { kind: 'move', dx: -1, dy: 0 }); expect(a.world.players[host].bedDisturbances).toBe(2);
    Object.assign(a.world.players[guest], { map: 'living', x: 176, y: 318 });
    await a.dispatch(guest, 5, { kind: 'move', dx: -1, dy: 0 }); expect(a.world.players[host].bedDisturbances).toBe(2);
  });
});
