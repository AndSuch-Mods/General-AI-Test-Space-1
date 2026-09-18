import { z } from 'zod';
import { arrival } from '../content/arrival';
import { createPlayer, parseWorld, type Player, type World } from './model';

export const IntentSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('move'), dx: z.number().min(-1).max(1), dy: z.number().min(-1).max(1) }).strict(),
  z.object({ kind: z.literal('interact'), target: z.enum(['letter', 'hearth', 'pantry']) }).strict(),
]);
export type Intent = z.infer<typeof IntentSchema>;
export type CommitWorld = (world: World) => Promise<void>;

/** The only write authority in solo and co-op. Never accept client-owned inventory or world flags. */
export class Authority {
  private queue: Promise<unknown> = Promise.resolve();
  private listeners = new Set<(world: World) => void>();
  constructor(public world: World, private commit: CommitWorld) { this.world = parseWorld(world); }
  subscribe(fn: (world: World) => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  private transaction<T>(mutate: (draft: World) => T): Promise<T> {
    const result = this.queue.then(async () => {
      const draft = structuredClone(this.world);
      const value = mutate(draft);
      draft.revision += 1;
      parseWorld(draft);
      await this.commit(draft); // Publish only after durable commit. Failure leaves live state unchanged.
      this.world = draft;
      for (const listener of this.listeners) listener(this.world);
      return value;
    });
    this.queue = result.catch(() => undefined);
    return result;
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
        const length = Math.hypot(intent.dx, intent.dy) || 1;
        // One bounded step per request; the session rate-limits remote movement to 10 Hz.
        player.x = Math.max(48, Math.min(912, player.x + intent.dx / Math.max(1, length) * 14));
        player.y = Math.max(190, Math.min(484, player.y + intent.dy / Math.max(1, length) * 14));
      } else {
        const event = arrival.find(entry => entry.id === intent.target)!;
        if (Math.hypot(player.x - event.x, player.y - event.y) > 105) throw Error('Move closer to interact.');
        if (event.scope === 'personal' && !player.discoveries.includes(event.id)) {
          player.discoveries.push(event.id);
          player.quests['a-household-begins'] = player.discoveries.includes('letter') && player.discoveries.includes('pantry') ? 'complete' : 'started';
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
