import { z } from 'zod';

export const GAME_TITLE = 'Haunted Chocolatier: Twilight';
export const BUILD_VERSION = '0.1.1';
export const PROTOCOL_VERSION = 2;
export const DEFAULT_TIME = { secondsPerGameMinute: 1, daysPerSeason: 24, daysPerWeek: 6 };
const id = z.string().uuid();
const counter = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const flags = z.record(z.string().max(80), z.boolean());
const counters = z.record(z.string().max(80), counter);
const strings = z.array(z.string().max(120)).max(2000);
export const PlayerSchema = z.object({
  id, name: z.string().trim().min(1).max(24), appearance: z.enum(['amber', 'moss', 'violet']),
  map: z.enum(['castle']), x: z.number().min(48).max(912), y: z.number().min(190).max(484),
  health: z.number().min(0).max(100), energy: z.number().min(0).max(100),
  fatigue: z.object({ consecutiveAllNighters: counter, terminalMinutes: z.number().nonnegative(), sleeping: z.boolean() }).strict(),
  inventory: counters, equipment: z.record(z.string(), z.string()), money: counter,
  skills: counters, recipes: strings, discoveries: strings, friendships: counters,
  romance: z.record(z.string(), z.object({ stage: z.enum(['friend', 'dating', 'engaged', 'married']), since: counter }).strict()),
  dialogueHistory: strings, giftHistory: strings, quests: z.record(z.string(), z.string()),
  settings: z.object({ controlSize: z.number().min(0.8).max(1.5), reducedMotion: z.boolean() }).strict(),
}).strict();
export type Player = z.infer<typeof PlayerSchema>;
export const WorldSchema = z.object({
  schemaVersion: z.literal(1), game: z.literal(GAME_TITLE), worldId: id, epoch: id,
  revision: counter, seed: counter, rng: counter, createdAt: z.string().datetime(),
  hostId: id, guestId: id.nullable(), guestKey: id.nullable(),
  clock: z.object({ totalMinutes: z.number().nonnegative(), secondsPerGameMinute: z.number().min(0.1).max(10) }).strict(),
  weather: z.enum(['clear', 'rain', 'storm', 'fog', 'snow']),
  story: z.object({ chapter: counter, flags }).strict(), quests: z.record(z.string(), z.string()),
  townChanges: flags, upgrades: flags, unlocks: strings, bosses: flags,
  chest: counters, economy: counters,
  events: z.array(z.object({ id, kind: z.string().max(80), actor: id, minute: z.number().nonnegative() }).strict()).max(1000),
  players: z.record(z.string().uuid(), PlayerSchema),
  lastSequence: z.record(z.string().uuid(), counter),
}).strict().superRefine((world, ctx) => {
  const ids = Object.keys(world.players);
  if (ids.length < 1 || ids.length > 2 || !world.players[world.hostId] ||
      ids.some(key => world.players[key].id !== key) ||
      (world.guestId ? !world.players[world.guestId] || world.guestId === world.hostId || !world.guestKey : ids.length !== 1 || world.guestKey !== null)) {
    ctx.addIssue({ code: 'custom', message: 'World household identities are inconsistent' });
  }
});
export type World = z.infer<typeof WorldSchema>;
export type Slot = 1 | 2;
export type Scope = 'personal' | 'shared_world' | 'cooperative';
export function createPlayer(name: string, appearance: Player['appearance'] = 'amber', playerId: string = crypto.randomUUID()): Player {
  return PlayerSchema.parse({ id: playerId, name, appearance, map: 'castle', x: 480, y: 364,
    health: 100, energy: 100, fatigue: { consecutiveAllNighters: 0, terminalMinutes: 0, sleeping: false },
    inventory: {}, equipment: {}, money: 0, skills: {}, recipes: [], discoveries: [], friendships: {},
    romance: {}, dialogueHistory: [], giftHistory: [], quests: {}, settings: { controlSize: 1, reducedMotion: false } });
}
export function createWorld(player: Player): World {
  return WorldSchema.parse({ schemaVersion: 1, game: GAME_TITLE, worldId: crypto.randomUUID(), epoch: crypto.randomUUID(),
    revision: 0, seed: crypto.getRandomValues(new Uint32Array(1))[0], rng: 1, createdAt: new Date().toISOString(),
    hostId: player.id, guestId: null, guestKey: null, clock: { totalMinutes: 18 * 60, secondsPerGameMinute: 1 },
    weather: 'clear', story: { chapter: 1, flags: {} }, quests: {}, townChanges: {}, upgrades: {}, unlocks: [], bosses: {},
    chest: {}, economy: {}, events: [], players: { [player.id]: player }, lastSequence: {} });
}
export function parseWorld(raw: unknown): World {
  // Version 1 is the first public schema. Future migrations must be explicit, sequential and fixture-tested.
  return WorldSchema.parse(raw);
}
