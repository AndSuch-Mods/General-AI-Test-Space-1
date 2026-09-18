import { z } from 'zod';
import { arrival } from '../content/arrival';
import { createPlayer, parseWorld, type Player, type World } from './model';
import { canInteract, canStand, moveInRoom, objectForAction, safePosition } from '../content/room';

export const IntentSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('move'), dx: z.number().min(-1).max(1), dy: z.number().min(-1).max(1) }).strict(),
  z.object({ kind: z.literal('interact'), target: z.enum(arrival.map(event => event.id)) }).strict(),
  z.object({ kind: z.literal('transfer'), direction: z.enum(['deposit', 'withdraw']), item: z.literal('cacao-bean'), count: z.number().int().positive().max(999) }).strict(),
]);
export type Intent = z.infer<typeof IntentSchema>;
export type CommitWorld = (world: World) => Promise<void>;

/** The only write authority in solo and co-op. Never accept client-owned inventory or world flags. */
export class Authority {
  private queue: Promise<unknown> = Promise.resolve();
  private listeners = new Set<(world: World) => void>();
  private lastFailure: unknown;
  constructor(public world: World, private commit: CommitWorld) { this.world = parseWorld(world); }
  subscribe(fn: (world: World) => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  private transaction<T>(mutate: (draft: World) => T): Promise<T> {
    const result = this.queue.then(async () => {
      const draft = structuredClone(this.world);
      const value = mutate(draft);
      draft.revision += 1;
      parseWorld(draft);
      // A rejected interaction did not change state and must not prevent exit.
      // A storage failure does block a claim that all accepted work was saved.
      try { await this.commit(draft); }
      catch (error) { this.lastFailure = error; throw error; }
      this.lastFailure = undefined;
      this.world = draft;
      for (const listener of this.listeners) listener(this.world);
      return value;
    });
    this.queue = result.catch(() => undefined);
    return result;
  }
  async flush() { await this.queue; if (this.lastFailure) throw this.lastFailure; }
  async prepareRoom() {
    if (Object.values(this.world.players).every(canStand)) return;
    await this.transaction(world => {
      for (const player of Object.values(world.players)) Object.assign(player, safePosition(player));
    });
  }
  async join(identity: { id: string; key: string; name: string; appearance: Player['appearance']; worldId: string; epoch: string; revision: number }) {
    if (identity.worldId !== this.world.worldId || identity.epoch !== this.world.epoch) throw Error('This character belongs to a different world or timeline.');
    if (identity.revision > this.world.revision) throw Error('Your recovery copy is newer than the host. Keep both backups; this join was stopped.');
    if (identity.id === this.world.hostId) throw Error('The host and guest must be different residents.');
    return this.transaction(world => {
      if (world.guestId) {
        if (world.guestId !== identity.id || world.guestKey !== identity.key) throw Error('This world already has a second resident. Rejoin from their device or recovery backup.');
        return world.guestId;
      }
      const player = createPlayer(identity.name, identity.appearance, identity.id);
      player.x = 530;
      world.guestId = player.id;
      world.guestKey = identity.key;
      world.players[player.id] = player;
      return player.id;
    });
  }
  dispatch(actor: string, sequence: number, raw: unknown): Promise<boolean> {
    const intent = IntentSchema.parse(raw);
    if (!Number.isSafeInteger(sequence) || sequence < 1) return Promise.reject(Error('Invalid action sequence'));
    return this.transaction(world => {
      const player = world.players[actor];
      if (!player) throw Error('Unknown resident');
      if (sequence <= (world.lastSequence[actor] ?? 0)) return false;
      if (intent.kind === 'move') {
        // One bounded step per request; the session rate-limits remote movement to 10 Hz.
        Object.assign(player, moveInRoom(player, intent.dx, intent.dy));
      } else if (intent.kind === 'transfer') {
        if (!canInteract(player, objectForAction('chest'))) throw Error('Move closer to the household chest.');
        const from = intent.direction === 'deposit' ? player.inventory : world.chest;
        const to = intent.direction === 'deposit' ? world.chest : player.inventory;
        if ((from[intent.item] ?? 0) < intent.count) throw Error('That stack has changed. Choose an available amount.');
        from[intent.item] -= intent.count;
        if (!from[intent.item]) delete from[intent.item];
        to[intent.item] = (to[intent.item] ?? 0) + intent.count;
      } else {
        const event = arrival.find(entry => entry.id === intent.target)!;
        if (!canInteract(player, objectForAction(event.id))) throw Error('Move closer to interact.');
        if (event.id === 'candle-desk' || event.id === 'candle-table') {
          world.story.flags[event.id] = !(world.story.flags[event.id] ?? true);
        } else if (event.scope === 'personal' && !player.discoveries.includes(event.id)) {
          player.discoveries.push(event.id);
          if (event.id === 'letter' || event.id === 'pantry') player.quests['a-household-begins'] = player.discoveries.includes('letter') && player.discoveries.includes('pantry') ? 'complete' : 'started';
          if (event.id === 'pantry') player.inventory['cacao-bean'] = (player.inventory['cacao-bean'] ?? 0) + 3;
        } else if (event.scope === 'shared_world' && !world.story.flags[event.id]) {
          world.story.flags[event.id] = true;
          world.events.push({ id: crypto.randomUUID(), kind: event.id, actor, minute: world.clock.totalMinutes });
          world.quests['a-light-for-the-house'] = 'complete';
        }
      }
      world.lastSequence[actor] = sequence;
      return true;
    });
  }
}
