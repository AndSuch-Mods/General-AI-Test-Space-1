import { z } from 'zod';
import { Authority, IntentSchema, type Intent } from '../game/authority';
import { parseWorld, PlayerSchema, PROTOCOL_VERSION, WorldSchema, type World } from '../game/model';
import type { GameDatabase, Mirror } from '../persistence/database';
import type { Pairing } from './webrtc';
import type { Transport } from './transport';

const Hello = z.object({ kind: z.literal('hello'), protocol: z.literal(PROTOCOL_VERSION), worldId: z.string().uuid(), epoch: z.string().uuid(),
  id: z.string().uuid(), key: z.string().uuid(), revision: z.number().int().nonnegative(),
  name: PlayerSchema.shape.name, appearance: PlayerSchema.shape.appearance }).strict();
const Action = z.object({ kind: z.literal('intent'), sequence: z.number().int().positive(), intent: IntentSchema }).strict();
export class HostSession {
  guestId?: string;
  private lastMove = 0;
  private closed = false;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private transport: Transport, private authority: Authority, private status: (text: string) => void) {
    transport.onState = state => {
      if (state !== 'open') { this.releaseGuest(); this.status('Player 2 disconnected. Their progress is saved. You can keep playing.'); }
    };
    transport.onMessage = raw => {
      this.queue = this.queue.then(() => this.receive(raw)).catch(error => {
        if (transport.ready) transport.send({ kind: 'error', message: error instanceof Error ? error.message : 'Session error' });
        this.status(error instanceof Error ? error.message : 'Session error');
      });
    };
  }
  private async receive(raw: unknown) {
    if (this.closed) return;
    if (!this.guestId) {
      const hello = Hello.parse(raw);
      const id = await this.authority.join(hello);
      if (this.closed || !this.transport.ready) return;
      this.guestId = id;
      this.authority.setActivePlayers([this.authority.world.hostId, id]);
      this.publish();
      this.status(`${this.authority.world.players[this.guestId].name} has arrived.`);
    } else {
      const action = Action.parse(raw);
      if (action.intent.kind === 'move') {
        // Space accepted steps instead of silently dropping an intent the guest
        // is awaiting. Browser frame jitter must not leave input unacknowledged.
        const delay = 110 - (performance.now() - this.lastMove);
        if (delay > 0) await new Promise<void>(resolve => setTimeout(resolve, delay));
        if (this.closed) return;
        this.lastMove = performance.now();
      }
      await this.authority.dispatch(this.guestId, action.sequence, action.intent);
      this.publish(action.intent.kind === 'move');
    }
  }
  publish(positionsOnly = false) {
    if (!this.guestId || !this.transport.ready) return;
    const world = this.authority.world;
    if (positionsOnly) this.transport.send({ kind: 'positions', worldId: world.worldId, epoch: world.epoch, revision: world.revision,
      clock: world.clock, weather: world.weather,
      players: Object.values(world.players).map(p => ({ id: p.id, map: p.map, x: p.x, y: p.y, fatigue: p.fatigue, energy: p.energy, interaction: p.interaction })), lastSequence: world.lastSequence });
    else this.transport.send({ kind: 'snapshot', world });
  }
  private releaseGuest() {
    const id = this.guestId; this.guestId = undefined;
    if (id) void this.authority.releasePlayer(id).catch(error => this.status(error instanceof Error ? error.message : 'Could not save session exit.'));
  }
  close() { this.closed = true; this.releaseGuest(); this.transport.close(); }
  async flush() { await this.queue; await this.authority.flush(); }
}

const Positions = z.object({ kind: z.literal('positions'), worldId: z.string().uuid(), epoch: z.string().uuid(), revision: z.number().int().nonnegative(),
  clock: WorldSchema.shape.clock, weather: WorldSchema.shape.weather,
  players: z.array(PlayerSchema.pick({ id: true, map: true, x: true, y: true, fatigue: true, energy: true, interaction: true })).max(2),
  lastSequence: z.record(z.string().uuid(), z.number().int().nonnegative()) });
export class GuestSession {
  world?: World;
  sequence = 0;
  private queue: Promise<unknown> = Promise.resolve();
  private closed = false;
  private inFlight = new Set<Promise<void>>();
  private lastFailure: unknown;
  connected = false;
  private pending = new Map<number, { resolve: () => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  constructor(private transport: Transport, private database: GameDatabase, private identity: { id: string; key: string; name: string; appearance: 'amber' | 'moss' | 'violet' },
    private pairing: Pairing, private mirror: Mirror | undefined, private update: (world: World) => void, private status: (text: string) => void) {
    transport.onState = state => {
      if (state === 'open') transport.send({ kind: 'hello', protocol: PROTOCOL_VERSION, ...identity, worldId: pairing.worldId, epoch: pairing.epoch, revision: mirror?.world.revision ?? 0 });
      else { this.connected = false; this.failPending('The host connection closed.'); this.status('The host connection closed. Your recovery copy is kept. Return to the title and pair again.'); }
    };
    transport.onMessage = raw => {
      this.queue = this.queue.then(() => this.receive(raw)).catch(error => { this.connected = false; this.status(error instanceof Error ? error.message : 'Recovery save failed'); });
    };
  }
  private async receive(raw: unknown) {
    if (this.closed) return;
    const envelope = z.object({ kind: z.string() }).passthrough().parse(raw);
    if (envelope.kind === 'error') { this.failPending(String(envelope.message)); this.status(String(envelope.message)); return; }
    let world: World;
    if (envelope.kind === 'snapshot') {
      world = parseWorld(envelope.world);
      if (world.guestId !== this.identity.id || world.guestKey !== this.identity.key) throw Error('The host sent the wrong household identity.');
    } else if (envelope.kind === 'positions' && this.world) {
      const positions = Positions.parse(raw);
      if (positions.worldId !== this.world.worldId || positions.epoch !== this.world.epoch) throw Error('Wrong world update');
      world = structuredClone(this.world);
      for (const p of positions.players) {
        if (!world.players[p.id]) throw Error('Unknown player update');
        Object.assign(world.players[p.id], p);
      }
      world.revision = positions.revision;
      world.lastSequence = positions.lastSequence;
      world.clock = positions.clock; world.weather = positions.weather;
      world = parseWorld(world);
    } else throw Error('Unknown session update');
    if (world.worldId !== this.pairing.worldId || world.epoch !== this.pairing.epoch) throw Error('Wrong world snapshot');
    if (world.revision < Math.max(this.world?.revision ?? 0, this.mirror?.world.revision ?? 0)) throw Error('An older host snapshot was rejected. Keep both recovery copies.');
    await this.database.mirror({ worldId: world.worldId, playerId: this.identity.id, key: this.identity.key, world, savedAt: new Date().toISOString() });
    this.world = world;
    this.sequence = Math.max(this.sequence, world.lastSequence[this.identity.id] ?? 0);
    this.connected = this.transport.ready;
    this.update(world);
    for (const [sequence, pending] of this.pending) if (sequence <= (world.lastSequence[this.identity.id] ?? 0)) {
      clearTimeout(pending.timer); pending.resolve(); this.pending.delete(sequence);
    }
  }
  dispatch(intent: Intent) {
    if (!this.connected) return Promise.reject(Error('Reconnect to the host before continuing.'));
    const sequence = ++this.sequence;
    const result = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(sequence); reject(Error('The host did not confirm that action. Reconnect before trying again.')); }, 8000);
      this.pending.set(sequence, { resolve, reject, timer });
      try { this.transport.send({ kind: 'intent', sequence, intent }); }
      catch (error) { clearTimeout(timer); this.pending.delete(sequence); reject(error); }
    });
    this.inFlight.add(result);
    void result.then(() => { this.inFlight.delete(result); this.lastFailure = undefined; }, error => { this.inFlight.delete(result); this.lastFailure = error; });
    return result;
  }
  async flush() { await Promise.all(this.inFlight); await this.queue; if (this.lastFailure) throw this.lastFailure; }
  private failPending(message: string) {
    for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(Error(message)); }
    this.pending.clear();
  }
  close() { this.closed = true; this.connected = false; this.failPending('Session closed'); this.transport.close(); }
}
