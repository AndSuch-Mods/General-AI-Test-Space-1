import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { Authority } from '../src/game/authority';
import { createPlayer, createWorld, parseWorld } from '../src/game/model';
import { gameMinutes } from '../src/game/time';
import { GameDatabase, parseBackup } from '../src/persistence/database';
import { decodePairing, encodePairing } from '../src/networking/webrtc';
import { QRAssembler } from '../src/ui/pairing';
import { GuestSession, HostSession } from '../src/networking/session';
import type { Transport } from '../src/networking/transport';
import { validateContent } from '../src/content/arrival';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

const databases: GameDatabase[] = [];
function database() { const db = new GameDatabase(crypto.randomUUID()); databases.push(db); return db; }
afterEach(async () => { await Promise.all(databases.splice(0).map(db => db.delete())); });
function world() { return createWorld(createPlayer('Rowan')); }
describe('world persistence and authority', () => {
  it('round-trips both independent slots and both profiles', async () => {
    const db = database(); const first = world(); const second = world();
    await db.save(1, first, { create: true }); await db.save(2, second, { create: true });
    const host = new Authority(first, w => db.save(1, w));
    const guest = crypto.randomUUID(); const key = crypto.randomUUID();
    await host.join({ id: guest, key, name: 'Mira', appearance: 'moss', worldId: first.worldId, epoch: first.epoch, revision: 0 });
    expect((await db.load(1))?.world.players[guest].name).toBe('Mira');
    expect((await db.load(2))?.world).toEqual(second);
    expect(parseWorld(JSON.parse(JSON.stringify(host.world)))).toEqual(host.world);
  });
  it('never rewards duplicated intents or repeated personal discoveries twice', async () => {
    const initial = world(); initial.players[initial.hostId].x = 785; initial.players[initial.hostId].y = 300;
    const host = new Authority(initial, async () => {});
    await Promise.all([host.dispatch(initial.hostId, 1, { kind: 'interact', target: 'pantry' }), host.dispatch(initial.hostId, 1, { kind: 'interact', target: 'pantry' })]);
    await host.dispatch(initial.hostId, 2, { kind: 'interact', target: 'pantry' });
    expect(host.world.players[initial.hostId].inventory['cacao-bean']).toBe(3);
  });
  it('keeps personal progress independent and permits guest shared changes', async () => {
    const host = new Authority(world(), async () => {}); const id = crypto.randomUUID();
    await host.join({ id, key: crypto.randomUUID(), name: 'Guest', appearance: 'violet', worldId: host.world.worldId, epoch: host.world.epoch, revision: 0 });
    let sequence = 0;
    for (let i = 0; i < 6; i++) await host.dispatch(id, ++sequence, { kind: 'move', dx: 0, dy: -1 });
    await host.dispatch(id, ++sequence, { kind: 'interact', target: 'hearth' });
    expect(host.world.story.flags.hearth).toBe(true);
    expect(host.world.events[0].actor).toBe(id);
    expect(host.world.players[host.world.hostId].discoveries).toEqual([]);
    for (let i = 0; i < 16; i++) await host.dispatch(id, ++sequence, { kind: 'move', dx: -1, dy: 0 });
    await host.dispatch(id, sequence + 1, { kind: 'interact', target: 'letter' });
    expect(host.world.players[id].discoveries).toContain('letter');
    expect(host.world.players[host.world.hostId].discoveries).not.toContain('letter');
  });
  it('rejects remote state injection, far interactions and extra players', async () => {
    const host = new Authority(world(), async () => {});
    await expect(host.dispatch(host.world.hostId, 1, { kind: 'interact', target: 'pantry' })).rejects.toThrow('closer');
    expect(() => host.dispatch(host.world.hostId, 1, { kind: 'move', dx: 999, dy: 0 })).toThrow();
    const identity = { id: crypto.randomUUID(), key: crypto.randomUUID(), name: 'Guest', appearance: 'moss' as const, worldId: host.world.worldId, epoch: host.world.epoch, revision: 0 };
    await host.join(identity);
    await expect(host.join({ ...identity, id: crypto.randomUUID() })).rejects.toThrow('second resident');
    await expect(host.join({ ...identity, revision: 999 })).rejects.toThrow('newer');
    await expect(host.join({ ...identity, key: crypto.randomUUID() })).rejects.toThrow();
  });
  it('rolls back failed durable commits and recovers the write queue', async () => {
    let fail = true; const initial = world();
    const host = new Authority(initial, async () => { if (fail) throw Error('Disk full'); });
    await expect(host.dispatch(initial.hostId, 1, { kind: 'move', dx: 1, dy: 0 })).rejects.toThrow('Disk full');
    expect(host.world).toEqual(initial); fail = false;
    await host.dispatch(initial.hostId, 1, { kind: 'move', dx: 1, dy: 0 });
    expect(host.world.players[initial.hostId].x).toBe(494);
  });
  it('rejects conflicting saves and preserves a recoverable import checkpoint', async () => {
    const db = database(); const first = world();
    await db.save(1, first, { create: true });
    await expect(db.save(1, world(), { create: true })).rejects.toThrow('occupied');
    await expect(db.save(1, first)).rejects.toThrow('conflict');
    const backup = await db.backup([1]);
    const host = new Authority(first, w => db.save(1, w));
    await host.dispatch(first.hostId, 1, { kind: 'move', dx: 1, dy: 0 });
    await expect(db.restore(backup, false)).rejects.toThrow('occupied');
    await db.restore(backup, true);
    expect((await db.recovery.get(1))?.world.revision).toBe(1);
    expect((await db.load(1))?.world).toEqual(first);
  });
  it('rejects unsupported schemas, malformed households, corrupt and duplicate-slot imports', async () => {
    const first = world();
    expect(() => parseWorld({ ...first, schemaVersion: 99 })).toThrow();
    expect(() => parseWorld({ ...first, hostId: crypto.randomUUID() })).toThrow();
    expect(() => parseBackup('{broken')).toThrow();
    expect(() => parseBackup(JSON.stringify({ format: 'twilight-world-backup', version: 1, exportedAt: new Date().toISOString(), worlds: [{ slot: 1, world: first }, { slot: 1, world: first }] }))).toThrow();
  });
  it('retains an existing guest after solo host progression and refuses a stale host', async () => {
    const host = new Authority(world(), async () => {});
    const identity = { id: crypto.randomUUID(), key: crypto.randomUUID(), name: 'Guest', appearance: 'moss' as const, worldId: host.world.worldId, epoch: host.world.epoch, revision: 0 };
    await host.join(identity); const db = database();
    const mirror = { worldId: host.world.worldId, playerId: identity.id, key: identity.key, world: structuredClone(host.world), savedAt: new Date().toISOString() };
    await db.mirror(mirror);
    await host.dispatch(host.world.hostId, 1, { kind: 'move', dx: 1, dy: 0 });
    await host.join({ ...identity, name: 'Ignored rename', revision: mirror.world.revision });
    expect(host.world.players[identity.id].name).toBe('Guest');
    await db.mirror({ ...mirror, world: host.world });
    await expect(db.mirror(mirror)).rejects.toThrow('newer');
  });
});
describe('protocol and content', () => {
  it('encodes pairing and rejects truncated, malformed, or incompatible codes', () => {
    const pair = { version: 1 as const, session: crypto.randomUUID(), worldId: crypto.randomUUID(), epoch: crypto.randomUUID(), type: 'offer' as const, sdp: 'v=0\r\n' + 'a'.repeat(100) };
    expect(decodePairing(encodePairing(pair))).toEqual(pair);
    expect(() => decodePairing('wrong')).toThrow();
    expect(() => decodePairing('TW1:!')).toThrow();
  });
  it('assembles out-of-order QR frames, ignores duplicates and resets mixed sessions', () => {
    const qr = new QRAssembler();
    expect(qr.add('TQ1|abcdef12|1|2|world')).toBeUndefined();
    expect(qr.add('TQ1|abcdef12|1|2|world')).toBeUndefined();
    expect(qr.add('TQ1|abcdef12|0|2|hello ')).toBe('hello world');
    expect(qr.add('TQ1|11111111|0|2|new')).toBeUndefined();
    expect(qr.progress).toBe('1/2');
  });
  it('decodes an actual pairing QR image with the local camera decoder', () => {
    const frame = 'TQ1|abcdef12|0|1|TW1:local-pairing-payload';
    const matrix = QRCode.create(frame, { errorCorrectionLevel: 'M' }).modules;
    const scale = 6, margin = 4, size = (matrix.size + margin * 2) * scale;
    const pixels = new Uint8ClampedArray(size * size * 4).fill(255);
    for (let y = 0; y < matrix.size; y++) for (let x = 0; x < matrix.size; x++) if (matrix.get(y, x)) {
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
        const index = (((y + margin) * scale + dy) * size + (x + margin) * scale + dx) * 4;
        pixels[index] = pixels[index + 1] = pixels[index + 2] = 0;
      }
    }
    const decoded = jsQR(pixels, size, size);
    expect(decoded?.data).toBe(frame);
    expect(new QRAssembler().add(decoded!.data)).toBe('TW1:local-pairing-payload');
  });
  it('uses a tunable game clock and validates the authored content', () => {
    expect(gameMinutes(1440)).toBe(1440); expect(gameMinutes(60, 1.2)).toBe(50);
    expect(() => gameMinutes(60, 0)).toThrow(); expect(() => validateContent()).not.toThrow();
  });
  it('commits host actions before mirroring and resumes guest intent sequences', async () => {
    class Local implements Transport {
      ready = true; onMessage: Transport['onMessage'] = () => {}; onState: Transport['onState'] = () => {}; other!: Local;
      send(message: unknown) { queueMicrotask(() => this.other.onMessage(structuredClone(message))); }
      close() { this.ready = false; this.onState('closed'); }
    }
    const a = new Local(), b = new Local(); a.other = b; b.other = a;
    const host = new Authority(world(), async () => {}); const guestId = crypto.randomUUID();
    const identity = { id: guestId, key: crypto.randomUUID(), name: 'Guest', appearance: 'moss' as const };
    const hostSession = new HostSession(a, host, () => {});
    const guest = new GuestSession(b, database(), identity, { version: 1, session: crypto.randomUUID(), worldId: host.world.worldId, epoch: host.world.epoch, type: 'offer', sdp: '' }, undefined, () => {}, () => {});
    b.onState('open');
    await expect.poll(() => guest.connected).toBe(true);
    await guest.dispatch({ kind: 'move', dx: 1, dy: 0 });
    expect(guest.world?.players[guestId].x).toBe(host.world.players[guestId].x);
    expect(guest.world?.lastSequence[guestId]).toBe(1);
    hostSession.close(); guest.close();
  });
});
