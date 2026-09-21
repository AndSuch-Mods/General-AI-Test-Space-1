import { z } from 'zod';
import { FURNITURE_IDS, getRoomObjects, isBedroom, objectColliders, type RoomMap } from '../content/room';

export const GAME_TITLE = 'Haunted Chocolatier: Twilight';
export const BUILD_VERSION = '0.1.4';
export const PROTOCOL_VERSION = 5;
export const DEFAULT_TIME = { secondsPerGameMinute: 1, daysPerSeason: 24, daysPerWeek: 6 };
const id = z.string().uuid();
const counter = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const flags = z.record(z.string().max(80), z.boolean());
const counters = z.record(z.string().max(80), counter);
const strings = z.array(z.string().max(120)).max(2000);
export const PlayerSchema = z.object({
  id, name: z.string().trim().min(1).max(24), appearance: z.enum(['amber', 'moss', 'violet']),
  map: z.enum(['castle', 'bedroom-2', 'living', 'landing']), x: z.number().min(48).max(912), y: z.number().min(190).max(484),
  health: z.number().min(0).max(100), energy: z.number().min(0).max(100),
  fatigue: z.object({ consecutiveAllNighters: counter, terminalMinutes: z.number().nonnegative(), sleeping: z.boolean(),
    sleepStartedAt: z.number().nonnegative().nullable(), wakeAt: z.number().nonnegative().nullable() }).strict(),
  interaction: z.enum(['chest', 'pantry', 'desk']).nullable(),
  inventory: counters, equipment: z.record(z.string(), z.string()), money: counter,
  skills: counters, recipes: strings, discoveries: strings, friendships: counters,
  romance: z.record(z.string(), z.object({ stage: z.enum(['friend', 'dating', 'engaged', 'married']), since: counter }).strict()),
  dialogueHistory: strings, giftHistory: strings, quests: z.record(z.string(), z.string()),
  settings: z.object({ controlSize: z.number().min(0.8).max(1.5), reducedMotion: z.boolean() }).strict(),
}).strict();
export type Player = z.infer<typeof PlayerSchema>;
const LayoutSchema = z.partialRecord(z.enum(FURNITURE_IDS), z.object({ x: z.number().int().min(-800).max(800), y: z.number().int().min(-400).max(400) }).strict());
const DayReportSchema = z.object({ day: z.number().int().min(-1), morning: z.number().nonnegative(), shared: z.array(z.string().max(120)).max(1000),
  players: z.record(z.string().uuid(), z.object({ name: z.string().max(24), discoveries: counter, recipes: counter, completedQuests: counter, rested: z.boolean() }).strict()),
}).strict();
const WorldBase = z.object({
  schemaVersion: z.literal(4), game: z.literal(GAME_TITLE), worldId: id, epoch: id,
  layout: LayoutSchema,
  roomLayouts: z.object({ living: LayoutSchema, 'bedroom-2': LayoutSchema }).strict(),
  dayReports: z.array(DayReportSchema).max(60),
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
}).strict();
export const WorldSchema = WorldBase.superRefine((world, ctx) => {
  for (const [map, layout] of Object.entries({ castle: world.layout, ...world.roomLayouts })) {
    const objects = getRoomObjects(map as RoomMap, layout);
    if (Object.keys(layout).some(id => !objects.some(o => o.id === id))) ctx.addIssue({ code: 'custom', message: 'Furniture is not in this room' });
    for (const object of objects.filter(o => o.id in layout)) {
      const b = object.bounds;
      if (b.x < 80 || b.x + b.width > 880 || b.y < 74 || b.y + b.height > 476) ctx.addIssue({ code: 'custom', message: 'Furniture is outside the room' });
      for (const r of objectColliders(object)) for (const other of objects.filter(o => o.id !== object.id)) {
        if (objectColliders(other).some(q => r.x < q.x + q.width && r.x + r.width > q.x && r.y < q.y + q.height && r.y + r.height > q.y)) ctx.addIssue({ code: 'custom', message: 'Furniture overlaps another solid' });
      }
    }
  }
  const ids = Object.keys(world.players);
  if (ids.length < 1 || ids.length > 2 || !world.players[world.hostId] ||
      ids.some(key => world.players[key].id !== key) ||
      (world.guestId ? !world.players[world.guestId] || world.guestId === world.hostId || !world.guestKey : ids.length !== 1 || world.guestKey !== null)) {
    ctx.addIssue({ code: 'custom', message: 'World household identities are inconsistent' });
  }
  for (const player of Object.values(world.players)) {
    const { sleeping, sleepStartedAt, wakeAt } = player.fatigue;
    if (sleeping ? sleepStartedAt === null || wakeAt === null || wakeAt <= sleepStartedAt || !isBedroom(player.map) : sleepStartedAt !== null || wakeAt !== null) {
      ctx.addIssue({ code: 'custom', message: 'Resident sleep state is inconsistent' });
    }
  }
});
export type World = z.infer<typeof WorldSchema>;
export type Slot = 1 | 2;
export type Scope = 'personal' | 'shared_world' | 'cooperative';
export function createPlayer(name: string, appearance: Player['appearance'] = 'amber', playerId: string = crypto.randomUUID()): Player {
  return PlayerSchema.parse({ id: playerId, name, appearance, map: 'castle', x: 480, y: 364,
    health: 100, energy: 100, fatigue: { consecutiveAllNighters: 0, terminalMinutes: 0, sleeping: false, sleepStartedAt: null, wakeAt: null }, interaction: null,
    inventory: {}, equipment: {}, money: 0, skills: {}, recipes: [], discoveries: [], friendships: {},
    romance: {}, dialogueHistory: [], giftHistory: [], quests: {}, settings: { controlSize: 1, reducedMotion: false } });
}
export function createWorld(player: Player): World {
  return WorldSchema.parse({ schemaVersion: 4, layout: {}, roomLayouts: { living: {}, 'bedroom-2': {} }, dayReports: [], game: GAME_TITLE, worldId: crypto.randomUUID(), epoch: crypto.randomUUID(),
    revision: 0, seed: crypto.getRandomValues(new Uint32Array(1))[0], rng: 1, createdAt: new Date().toISOString(),
    hostId: player.id, guestId: null, guestKey: null, clock: { totalMinutes: 18 * 60, secondsPerGameMinute: 1 },
    weather: 'clear', story: { chapter: 1, flags: {} }, quests: {}, townChanges: {}, upgrades: {}, unlocks: [], bosses: {},
    chest: {}, economy: {}, events: [], players: { [player.id]: player }, lastSequence: {} });
}
const LegacyWorldSchema = WorldBase.omit({ layout: true, roomLayouts: true, dayReports: true }).extend({ schemaVersion: z.literal(1), players: z.record(z.string().uuid(), PlayerSchema.omit({ interaction: true }).extend({
  map: z.literal('castle'), fatigue: z.object({ consecutiveAllNighters: counter, terminalMinutes: z.number().nonnegative(), sleeping: z.boolean() }).strict(),
})) });
function migrateWorld(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || !('schemaVersion' in raw)) return raw;
  if (raw.schemaVersion === 3) {
    const old = WorldBase.omit({ roomLayouts: true, dayReports: true }).extend({ schemaVersion: z.literal(3) }).parse(raw);
    return { ...old, schemaVersion: 4, roomLayouts: { living: {}, 'bedroom-2': {} }, dayReports: [] };
  }
  if (raw.schemaVersion === 2) {
    const old = WorldBase.omit({ layout: true, roomLayouts: true, dayReports: true }).extend({ schemaVersion: z.literal(2) }).parse(raw);
    return { ...old, schemaVersion: 4, layout: {}, roomLayouts: { living: {}, 'bedroom-2': {} }, dayReports: [] };
  }
  if (raw.schemaVersion !== 1) return raw;
  const old = LegacyWorldSchema.parse(raw);
  // Schema 1 reserved a sleep flag but had no runnable sleep system or timer.
  return { ...old, schemaVersion: 4, layout: {}, roomLayouts: { living: {}, 'bedroom-2': {} }, dayReports: [], players: Object.fromEntries(Object.entries(old.players).map(([key, player]) => [key, {
    ...player, interaction: null, fatigue: { ...player.fatigue, sleeping: false, sleepStartedAt: null, wakeAt: null },
  }])) };
}
export const StoredWorldSchema = z.preprocess(migrateWorld, WorldSchema);
export function parseWorld(raw: unknown): World { return StoredWorldSchema.parse(raw); }
