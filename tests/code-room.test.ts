import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CodeRoomTransport, createRoomCode, normalizeRoomCode } from '../src/networking/code-room';
import { PROTOCOL_VERSION } from '../src/game/model';

const service = vi.hoisted(() => {
  type Handler = (...args: unknown[]) => void;
  class Events {
    handlers = new Map<string, Handler[]>();
    on(event: string, callback: Handler) { this.handlers.set(event, [...this.handlers.get(event) ?? [], callback]); return this; }
    emit(event: string, ...args: unknown[]) { for (const callback of this.handlers.get(event) ?? []) callback(...args); }
  }
  class Connection extends Events {
    open = false; bufferSize = 0; dataChannel = { bufferedAmount: 0 }; other?: Connection; sent: unknown[] = [];
    constructor(readonly peer: string, readonly label: string) { super(); }
    send(data: unknown) {
      if (!this.open) throw Error('Closed channel');
      this.sent.push(data); queueMicrotask(() => { if (this.other?.open) this.other.emit('data', data); });
    }
    close() {
      if (!this.open) return;
      this.open = false; this.emit('close');
      if (this.other?.open) { this.other.open = false; this.other.emit('close'); }
    }
  }
  const peers = new Map<string, MockPeer>(), instances: MockPeer[] = [];
  const state = { collisions: 0, silent: false };
  class MockPeer extends Events {
    connections: Connection[] = []; destroyed = false; connectOptions?: { label: string; serialization: string };
    constructor(readonly id: string, readonly options: Record<string, unknown>) {
      super(); instances.push(this);
      if (state.collisions > 0) { state.collisions--; queueMicrotask(() => { this.emit('error', { type: 'unavailable-id' }); this.emit('disconnected'); this.destroy(); }); }
      else { peers.set(id, this); if (!state.silent) queueMicrotask(() => this.emit('open', id)); }
    }
    connect(id: string, options: { label: string; serialization: string }) {
      // Match PeerJS's serializer lookup: unknown names throw before dialing.
      if (!['raw', 'json', 'binary', 'binary-utf8', 'default'].includes(options.serialization)) throw TypeError('Unknown PeerJS serializer');
      this.connectOptions = options;
      const outgoing = new Connection(id, options.label); this.connections.push(outgoing);
      const host = peers.get(id);
      if (!host) { queueMicrotask(() => this.emit('error', { type: 'peer-unavailable' })); return outgoing; }
      const incoming = new Connection(this.id, options.label); host.connections.push(incoming);
      outgoing.other = incoming; incoming.other = outgoing;
      queueMicrotask(() => {
        host.emit('connection', incoming); incoming.open = true; outgoing.open = true;
        incoming.emit('open'); outgoing.emit('open');
      });
      return outgoing;
    }
    destroy() {
      if (this.destroyed) return; this.destroyed = true;
      if (peers.get(this.id) === this) peers.delete(this.id);
      for (const connection of this.connections) connection.close(); this.emit('close');
    }
  }
  return { MockPeer, Connection, peers, instances, state };
});
vi.mock('peerjs', () => ({ Peer: service.MockPeer }));

const active: CodeRoomTransport[] = [];
const transport = () => { const value = new CodeRoomTransport(); active.push(value); return value; };
const worldId = 'd440c704-3c13-46d2-8c2a-f001788714bd', epoch = '53e0feba-b735-4a59-8848-93ce1083ac15';
const tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
beforeEach(() => { vi.stubGlobal('RTCPeerConnection', class { close() {} }); });
afterEach(() => {
  active.splice(0).forEach(connection => connection.close()); service.peers.clear(); service.instances.length = 0;
  service.state.collisions = 0; service.state.silent = false; vi.useRealTimers(); vi.unstubAllGlobals();
});

describe('short-code direct room transport', () => {
  it('creates unpredictable eight-character codes and only accepts that alphabet', () => {
    const codes = new Set(Array.from({ length: 100 }, createRoomCode));
    expect(codes.size).toBe(100);
    for (const code of codes) expect(code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    expect(normalizeRoomCode(' abcd-2345 ')).toBe('ABCD2345');
    expect(() => normalizeRoomCode('password')).toThrow(/eight-letter/);
    expect(() => normalizeRoomCode('TW1:abcdef')).toThrow(/eight-letter/);
  });

  it('sends no game identity to signaling and gates gameplay until the validated room identity is bound', async () => {
    const host = transport(), guest = transport(), received: unknown[] = [], states: string[] = [];
    host.onMessage = message => received.push(message); host.onState = state => states.push(state);
    const room = await host.host(worldId, epoch);
    const identity = await guest.join(room.code);
    const { SerializationType } = await vi.importActual<typeof import('peerjs')>('peerjs');
    expect(service.instances[1].connectOptions?.serialization).toBe(SerializationType.None);
    expect(identity).toEqual(room.pairing); expect(identity.version).toBe(PROTOCOL_VERSION);
    expect(host.ready).toBe(false); expect(guest.ready).toBe(false); expect(received).toEqual([]);
    expect(() => guest.send({ kind: 'hello', secret: 'profile-key' })).toThrow(/disconnected/);
    for (const peer of service.instances) {
      expect(peer.options).toMatchObject({ secure: true, config: { iceServers: [], iceCandidatePoolSize: 0 } });
      expect(JSON.stringify(peer.options)).not.toContain(worldId);
    }
    guest.onState = state => { if (state === 'open') guest.send({ kind: 'hello', id: 'guest-id' }); };
    guest.activate(); await tick();
    expect(host.ready).toBe(true); expect(guest.ready).toBe(true); expect(states).toEqual(['open']);
    expect(received).toEqual([{ kind: 'hello', id: 'guest-id' }]);
    host.send({ kind: 'snapshot', world: { revision: 7 } });
    const peer = service.instances[0];
    expect(peer.connections[0].sent.map(data => JSON.parse(String(data)).kind)).toEqual(['room-offer', 'snapshot']);
  });

  it('retries colliding rendezvous IDs without reusing a dead peer', async () => {
    service.state.collisions = 2;
    const result = await transport().host(worldId, epoch);
    expect(result.code).toHaveLength(8); expect(service.instances).toHaveLength(3);
    expect(service.instances.slice(0, 2).every(peer => peer.destroyed)).toBe(true);
    expect(new Set(service.instances.map(peer => peer.id)).size).toBe(3);
  });

  it('rejects a second guest both during admission and after the first guest connects', async () => {
    const host = transport(), first = transport(), room = await host.host(worldId, epoch);
    await first.join(room.code);
    await expect(transport().join(room.code)).rejects.toMatchObject({ code: 'busy' });
    first.activate(); await tick();
    await expect(transport().join(room.code)).rejects.toMatchObject({ code: 'busy' });
    expect(host.ready).toBe(true); expect(first.ready).toBe(true);
  });

  it('rejects a stale expected timeline before the guest can send an identity', async () => {
    const host = transport(), guest = transport(), room = await host.host(worldId, epoch);
    await expect(guest.join(room.code, { expected: { epoch: crypto.randomUUID() } })).rejects.toMatchObject({ code: 'stale' });
    expect(guest.ready).toBe(false); expect(host.ready).toBe(false);
    const next = transport(); await next.join(room.code); next.activate(); await tick(); expect(host.ready).toBe(true);
  });

  it('rejects protocol mismatch and replayed room acknowledgements without occupying the host', async () => {
    const host = transport(); await host.host(worldId, epoch);
    const peer = service.instances[0];
    const candidate = new service.Connection('older-guest', 'twilight-room-v1');
    peer.emit('connection', candidate); candidate.open = true; candidate.emit('open');
    candidate.emit('data', JSON.stringify({ kind: 'room-request', version: PROTOCOL_VERSION - 1, nonce: crypto.randomUUID() }));
    expect(JSON.parse(String(candidate.sent[0]))).toEqual({ kind: 'room-rejected', code: 'version' });
    const other = new service.Connection('stale-guest', 'twilight-room-v1');
    peer.emit('connection', other); other.open = true; other.emit('open');
    other.emit('data', JSON.stringify({ kind: 'room-request', version: PROTOCOL_VERSION, nonce: crypto.randomUUID() }));
    other.emit('data', JSON.stringify({ kind: 'room-ready', version: PROTOCOL_VERSION, nonce: crypto.randomUUID(), session: crypto.randomUUID() }));
    expect(JSON.parse(String(other.sent.at(-1)))).toEqual({ kind: 'room-rejected', code: 'stale' }); expect(host.ready).toBe(false);
  });

  it('keeps established gameplay alive if signaling disconnects, then notifies the session on guest dropout', async () => {
    const host = transport(), guest = transport(), states: string[] = [], received: unknown[] = [];
    const room = await host.host(worldId, epoch); await guest.join(room.code); guest.activate(); await tick();
    host.onState = state => states.push(state); host.onMessage = value => received.push(value);
    service.instances[0].emit('disconnected'); service.instances[1].emit('error', { type: 'socket-closed' });
    guest.send({ kind: 'intent', sequence: 1 }); await tick();
    expect(received).toEqual([{ kind: 'intent', sequence: 1 }]); expect(host.ready).toBe(true);
    guest.close(); expect(host.ready).toBe(false); expect(states).toEqual(['closed']);
    expect(service.instances.every(peer => peer.destroyed)).toBe(true);
  });

  it('cancels registration, clears its timeout and destroys the peer', async () => {
    vi.useFakeTimers(); service.state.silent = true;
    const abort = new AbortController(), host = transport();
    const pending = host.host(worldId, epoch, { signal: abort.signal });
    const rejected = expect(pending).rejects.toMatchObject({ code: 'cancelled' });
    await vi.waitFor(() => expect(service.instances).toHaveLength(1)); abort.abort(); await rejected;
    expect(service.instances[0].destroyed).toBe(true); expect(vi.getTimerCount()).toBe(0);
  });

  it('times out unreachable signaling and reports expired codes without hanging', async () => {
    vi.useFakeTimers(); service.state.silent = true;
    const pending = transport().host(worldId, epoch, { timeoutMs: 500 });
    const rejected = expect(pending).rejects.toMatchObject({ code: 'timeout' });
    await vi.advanceTimersByTimeAsync(500); await rejected;
    expect(service.instances.every(peer => peer.destroyed)).toBe(true);
    vi.useRealTimers(); service.state.silent = false;
    await expect(transport().join('ABCD2345')).rejects.toMatchObject({ code: 'unavailable' });
  });

  it('bounds payloads and closes malformed input without delivering it to gameplay', async () => {
    const host = transport(), guest = transport(), room = await host.host(worldId, epoch);
    await guest.join(room.code); guest.activate(); await tick();
    const received = vi.fn(); host.onMessage = received;
    expect(() => guest.send({ text: 'a'.repeat(250001) })).toThrow(/busy/);
    const incoming = service.instances[0].connections[0]; incoming.emit('data', 'not-json');
    expect(received).not.toHaveBeenCalled(); expect(host.ready).toBe(false);
  });
});
