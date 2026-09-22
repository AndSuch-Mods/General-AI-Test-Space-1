import { z } from 'zod';
import { placeFurniture, saveLayout } from '../content/furnishing';
import { arrival } from '../content/arrival';
import { LayoutSchema, createPlayer, parseWorld, type Player, type World } from './model';
import { canInteract, canStand, doorEntry, doorCrossed, facingForTurn, groundCenter, seatPosition, getRoomObjects, turnPoint, baseRoomObjects, objectOffset, ROOM_MAPS, inBedEntry, moveInRoom, objectForAction, roomFlag, roomFlagKey, roomLayout, safePosition, FURNITURE_IDS } from '../content/room';
import { advanceWorldClock, gameMinutes, startSleep, wakePlayer } from './time';

export const IntentSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('move'), dx: z.number().min(-1).max(1), dy: z.number().min(-1).max(1) }).strict(),
  z.object({ kind: z.literal('interact'), target: z.enum(arrival.map(event => event.id)) }).strict(),
  z.object({ kind: z.literal('transfer'), direction: z.enum(['deposit', 'withdraw']), item: z.literal('cacao-bean'), count: z.number().int().positive().max(999) }).strict(),
  z.object({ kind: z.literal('wake') }).strict(),
  z.object({ kind: z.literal('stand') }).strict(),
  z.object({ kind: z.literal('save-layout'), map: z.enum(ROOM_MAPS), layout: LayoutSchema, expected: LayoutSchema }).strict(),
  z.object({ kind: z.literal('sleep') }).strict(),
  z.object({ kind: z.literal('place'), target: z.enum(FURNITURE_IDS), x: z.number().int().min(-800).max(800), y: z.number().int().min(-400).max(400), rotation: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).optional(), expected: z.object({ x: z.number().int(), y: z.number().int(), rotation: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).optional() }).strict() }).strict(),
  z.object({ kind: z.literal('close-interaction') }).strict(),
]);
export type Intent = z.infer<typeof IntentSchema>;
export type CommitWorld = (world: World) => Promise<void>;

function standUp(world: World, player: Player) {
  if (!player.seated) return;
  const layout = roomLayout(world, player.map), seat = getRoomObjects(player.map, layout).find(o => o.id === player.seated!.id)!;
  const center = groundCenter(seat), front = turnPoint({ x: center.x, y: center.y + ((seat.rotation ?? 0) % 2 ? seat.floor!.width : seat.floor!.height) / 2 + 24 }, center, seat.rotation ?? 0);
  Object.assign(player, safePosition(front, player.map, layout), { seated: null });
}
function passDoor(world: World, player: Player, door: ReturnType<typeof doorCrossed>) {
  if (!door?.door) return false;
  const destination = door.door.to, layout = roomLayout(world, destination), counterpart = objectForAction(door.door.counterpart, destination, layout);
  Object.assign(player, safePosition(doorEntry(counterpart), destination, layout), { map: destination, interaction: null, seated: null });
  return true;
}
function bedLocalX(player: { x: number; y: number; map: Player['map'] }, world: World) {
  const layout = roomLayout(world, player.map), delta = objectOffset('bed', layout), bed = baseRoomObjects(player.map).find(o => o.id === 'bed')!;
  return turnPoint({ x: player.x - delta.x, y: player.y - delta.y }, groundCenter(bed), 4 - (layout.bed?.rotation ?? 0)).x;
}

/** The only write authority in solo and co-op. Never accept client-owned inventory or world flags. */
export class Authority {
  private queue: Promise<unknown> = Promise.resolve();
  private listeners = new Set<(world: World) => void>();
  private lastFailure: unknown;
  private activeIds: string[];
  private settlingSeconds = 0;
  private settlingKey = '';
  constructor(public world: World, private commit: CommitWorld) { this.world = parseWorld(world); this.activeIds = [this.world.hostId]; }
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
  setActivePlayers(ids: readonly string[]) { this.activeIds = [...new Set([this.world.hostId, ...ids])].filter(id => !!this.world.players[id]); }
  async releasePlayer(id: string) {
    this.setActivePlayers(this.activeIds.filter(active => active !== id));
    if (this.world.players[id]) await this.transaction(world => { world.players[id].interaction = null; standUp(world, world.players[id]); });
  }
  async advanceTime(realSeconds: number, options: { activeIds: string[]; paused: boolean }): Promise<boolean> {
    if (!Number.isFinite(realSeconds) || realSeconds < 0) throw Error('Invalid clock input');
    this.setActivePlayers(options.activeIds);
    if (options.paused || realSeconds === 0) return false;
    const sleepers = this.activeIds.map(id => this.world.players[id]);
    const sleepKey = sleepers.every(p => p.fatigue.sleeping) ? sleepers.map(p => `${p.id}:${p.fatigue.sleepStartedAt}`).join('|') : '';
    if (sleepKey !== this.settlingKey) { this.settlingKey = sleepKey; this.settlingSeconds = 0; }
    if (sleepKey) {
      this.settlingSeconds += Math.min(realSeconds, 5);
      if (this.settlingSeconds < 1.4) return false;
    }
    return this.transaction(world => {
      const residents = this.activeIds.map(id => world.players[id]);
      const allSleeping = residents.every(player => player.fatigue.sleeping);
      const minutes = allSleeping ? Math.max(0, Math.min(...residents.map(player => player.fatigue.wakeAt!)) - world.clock.totalMinutes)
        : gameMinutes(Math.min(realSeconds, 5), world.clock.secondsPerGameMinute);
      advanceWorldClock(world, minutes, this.activeIds);
      // A returning sleeper may have finished resting while their device was absent.
      for (const player of residents) if (player.fatigue.sleeping && player.fatigue.wakeAt! <= world.clock.totalMinutes) wakePlayer(player, player.fatigue.wakeAt!, roomLayout(world, player.map));
      return true;
    });
  }
  async prepareRoom() {
    if (Object.values(this.world.players).every(player => !player.interaction && (player.fatigue.sleeping || player.seated && this.activeIds.includes(player.id) || canStand(player, player.map, roomLayout(this.world, player.map))))) return;
    await this.transaction(world => {
      for (const player of Object.values(world.players)) {
        player.interaction = null;
        if (player.seated && !this.activeIds.includes(player.id)) standUp(world, player);
        if (!player.fatigue.sleeping && !player.seated) Object.assign(player, safePosition(player, player.map, roomLayout(world, player.map)));
      }
    });
  }
  async join(identity: { id: string; key: string; name: string; appearance: Player['appearance']; look?: Player['look']; worldId: string; epoch: string; revision: number }) {
    if (identity.worldId !== this.world.worldId || identity.epoch !== this.world.epoch) throw Error('This character belongs to a different world or timeline.');
    if (identity.revision > this.world.revision) throw Error('Your recovery copy is newer than the host. Keep both backups; this join was stopped.');
    if (identity.id === this.world.hostId) throw Error('The host and guest must be different residents.');
    return this.transaction(world => {
      if (world.guestId) {
        if (world.guestId !== identity.id || world.guestKey !== identity.key) throw Error('This world already has a second resident. Rejoin from their device or recovery backup.');
        world.players[world.guestId].interaction = null; standUp(world, world.players[world.guestId]);
        return world.guestId;
      }
      const player = createPlayer(identity.name, identity.appearance, identity.id, identity.look);
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
      const layout = roomLayout(world, player.map);
      if (sequence <= (world.lastSequence[actor] ?? 0)) return false;
      if (intent.kind === 'wake') {
        wakePlayer(player, world.clock.totalMinutes, layout);
      } else if (intent.kind === 'stand') {
        standUp(world, player);
      } else if (intent.kind === 'save-layout') {
        saveLayout(world, actor, intent.map, intent.layout, intent.expected);
      } else if (intent.kind === 'close-interaction') {
        player.interaction = null;
      } else if (player.fatigue.sleeping) {
        // Held movement cannot wake a resident or retrigger bed entry after a jump.
      } else if (intent.kind === 'sleep') {
        const bed = objectForAction('bed', player.map, layout);
        if (!bed || !(inBedEntry(player, layout) || canInteract(player, bed, layout))) throw Error('Move closer to the bed.');
        startSleep(player, world.clock.totalMinutes, layout, actor === world.hostId ? 'left' : 'right');
      } else if (intent.kind === 'place') {
        placeFurniture(world, actor, intent.target, { x: intent.x, y: intent.y, rotation: intent.rotation }, intent.expected);
      } else if (intent.kind === 'move') {
        if (!intent.dx && !intent.dy) { world.lastSequence[actor] = sequence; return true; }
        // One bounded step per request; the session rate-limits remote movement to 10 Hz.
        if (intent.dx || intent.dy) standUp(world, player);
        if (Math.abs(intent.dx) > Math.abs(intent.dy)) player.facing = intent.dx > 0 ? 'right' : 'left';
        else if (intent.dy) player.facing = intent.dy > 0 ? 'down' : 'up';
        const before = { x: player.x, y: player.y, map: player.map };
        Object.assign(player, moveInRoom(player, intent.dx, intent.dy, 14, player.map, layout));
        const crossedDoor = doorCrossed(player, intent.dx, intent.dy, layout);
        if (crossedDoor) passDoor(world, player, crossedDoor);
        if (before.map === player.map && inBedEntry(before, layout) && inBedEntry(player, layout)) {
          for (const sleeper of Object.values(world.players)) {
            if (sleeper.id === actor || !this.activeIds.includes(sleeper.id) || sleeper.map !== player.map || !sleeper.fatigue.sleeping) continue;
            const a = bedLocalX(before, world), b = bedLocalX(player, world), x = bedLocalX(sleeper, world);
            const crossed = a < x && b >= x || a > x && b <= x;
            if (crossed && (sleeper.bedDisturbedAt === null || world.clock.totalMinutes - sleeper.bedDisturbedAt >= 3)) {
              sleeper.bedDisturbances += 1; sleeper.bedDisturbedAt = world.clock.totalMinutes;
            }
          }
        }
        player.interaction = null;
      } else if (intent.kind === 'transfer') {
        const chest = objectForAction(player.interaction === 'pantry' ? 'pantry' : 'chest', player.map, layout);
        if (!chest || !canInteract(player, chest, layout)) throw Error('Move closer to the household chest.');
        const from = intent.direction === 'deposit' ? player.inventory : world.chest;
        const to = intent.direction === 'deposit' ? world.chest : player.inventory;
        if ((from[intent.item] ?? 0) < intent.count) throw Error('That stack has changed. Choose an available amount.');
        from[intent.item] -= intent.count;
        if (!from[intent.item]) delete from[intent.item];
        to[intent.item] = (to[intent.item] ?? 0) + intent.count;
      } else {
        const event = arrival.find(entry => entry.id === intent.target)!;
        const object = objectForAction(event.id, player.map, layout);
        if (!object || !canInteract(player, object, layout)) throw Error('Move closer to interact.');
        if (object.door) passDoor(world, player, object);
        else if (event.id === 'sofa' || event.id === 'armchair') {
          if (player.seated) standUp(world, player);
          const occupied = new Set(Object.values(world.players).filter(p => p.map === player.map && p.seated?.id === event.id).map(p => p.seated!.slot));
          const slot = (event.id === 'sofa' ? [0, 1] : [0]).find(n => !occupied.has(n));
          if (slot === undefined) throw Error('This seat is occupied.');
          Object.assign(player, seatPosition(object, slot), { seated: { id: event.id, slot }, facing: facingForTurn(object.rotation), interaction: null });
        }
        else if (event.id === 'stove' || event.id === 'sink') world.story.flags[roomFlagKey(player.map, event.id)] = !roomFlag(world, player.map, event.id);
        else if (event.id === 'journal') { /* Reading the saved day report grants no reward. */ }
        else if (event.id === 'candle-desk' || event.id === 'candle-table') {
          world.story.flags[roomFlagKey(player.map, event.id)] = !roomFlag(world, player.map, event.id, true);
        } else if (event.id === 'hearth') {
          world.story.flags[roomFlagKey(player.map, 'hearth')] = !roomFlag(world, player.map, 'hearth');
          if (roomFlag(world, player.map, 'hearth') && world.quests['a-light-for-the-house'] !== 'complete') {
            world.events.push({ id: crypto.randomUUID(), kind: 'hearth', actor, minute: world.clock.totalMinutes });
            world.quests['a-light-for-the-house'] = 'complete';
          }
        } else if ((event.id === 'letter' || event.id === 'pantry') && !player.discoveries.includes(event.id)) {
          player.discoveries.push(event.id);
          if (event.id === 'letter' || event.id === 'pantry') player.quests['a-household-begins'] = player.discoveries.includes('letter') && player.discoveries.includes('pantry') ? 'complete' : 'started';
          if (event.id === 'pantry') player.inventory['cacao-bean'] = (player.inventory['cacao-bean'] ?? 0) + 3;
        } else if (event.scope === 'shared_world' && !world.story.flags[event.id]) {
          world.story.flags[event.id] = true;
          world.events.push({ id: crypto.randomUUID(), kind: event.id, actor, minute: world.clock.totalMinutes });
          world.quests['a-light-for-the-house'] = 'complete';
        }
        if (event.id === 'chest' || event.id === 'pantry' || event.id === 'desk') player.interaction = event.id;
      }
      world.lastSequence[actor] = sequence;
      return true;
    });
  }
}
