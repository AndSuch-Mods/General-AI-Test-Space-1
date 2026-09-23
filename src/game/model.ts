import { z } from 'zod';
import { BODY_OPTIONS, DEFAULT_LOOK, HAIR_COLOR_OPTIONS, HAIR_STYLE_OPTIONS, OUTFIT_OPTIONS, SKIN_TONE_OPTIONS, type CharacterLook } from './art/character-look';
import { FURNITURE_IDS, ROTATABLE_FURNITURE, ROOM_MAPS, getRoomObjects, isBedroom, objectColliders, type RoomMap } from '../content/room';
import { currentGeometry, layoutGeometryError, migrateProjectedLayout, schema6Geometry } from './layout-migration';
import { layoutError } from '../content/furnishing';

export const GAME_TITLE = 'Haunted Chocolatier: Twilight';
export const BUILD_VERSION = '0.1.11';
export const PROTOCOL_VERSION = 11;
export const DEFAULT_TIME = { secondsPerGameMinute: 1, daysPerSeason: 24, daysPerWeek: 6 };
const id = z.string().uuid();
const counter = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const flags = z.record(z.string().max(80), z.boolean());
const counters = z.record(z.string().max(80), counter);
const strings = z.array(z.string().max(120)).max(2000);
export const CharacterLookSchema = z.object({ body: z.enum(BODY_OPTIONS), hairStyle: z.enum(HAIR_STYLE_OPTIONS), hairColor: z.enum(HAIR_COLOR_OPTIONS), skinTone: z.enum(SKIN_TONE_OPTIONS), outfit: z.enum(OUTFIT_OPTIONS) }).strict();
export const PlayerSchema = z.object({
  id, name: z.string().trim().min(1).max(24), appearance: z.enum(['amber', 'moss', 'violet', 'navy', 'wine', 'cream']),
  look: CharacterLookSchema.default(() => ({ ...DEFAULT_LOOK })),
  bedDisturbances: counter.default(0), bedDisturbedAt: z.number().nonnegative().nullable().default(null),
  facing: z.enum(['down', 'left', 'up', 'right']).default('down'),
  seated: z.object({ id: z.enum(['sofa', 'armchair']), slot: z.number().int().min(0).max(2) }).strict().nullable().default(null),
  map: z.enum(ROOM_MAPS), x: z.number().min(48).max(912), y: z.number().min(190).max(484),
  health: z.number().min(0).max(100), energy: z.number().min(0).max(100),
  fatigue: z.object({ consecutiveAllNighters: counter, terminalMinutes: z.number().nonnegative(), sleeping: z.boolean(),
    sleepStartedAt: z.number().nonnegative().nullable(), wakeAt: z.number().nonnegative().nullable() }).strict(),
  interaction: z.enum(['chest', 'pantry', 'desk', 'side-table', 'bookshelf', 'worktop']).nullable(),
  drawer: z.enum(['left', 'right']).default('left'),
  inventory: counters, equipment: z.record(z.string(), z.string()), money: counter,
  skills: counters, recipes: strings, discoveries: strings, friendships: counters,
  romance: z.record(z.string(), z.object({ stage: z.enum(['friend', 'dating', 'engaged', 'married']), since: counter }).strict()),
  dialogueHistory: strings, giftHistory: strings, quests: z.record(z.string(), z.string()),
  settings: z.object({ controlSize: z.number().min(0.8).max(1.5), reducedMotion: z.boolean() }).strict(),
}).strict();
export type Player = z.infer<typeof PlayerSchema>;
export const LayoutSchema = z.partialRecord(z.enum(FURNITURE_IDS), z.object({ x: z.number().int().min(-800).max(800), y: z.number().int().min(-400).max(400), rotation: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).optional() }).strict());
const DayReportSchema = z.object({ day: z.number().int().min(-1), morning: z.number().nonnegative(), shared: z.array(z.string().max(120)).max(1000),
  players: z.record(z.string().uuid(), z.object({ name: z.string().max(24), discoveries: counter, recipes: counter, completedQuests: counter, rested: z.boolean() }).strict()),
}).strict();
const WorldBase = z.object({
  schemaVersion: z.literal(7), game: z.literal(GAME_TITLE), worldId: id, epoch: id,
  layout: LayoutSchema,
  roomLayouts: z.object({ living: LayoutSchema, 'bedroom-2': LayoutSchema, landing: LayoutSchema.default({}), kitchen: LayoutSchema.default({}) }).strict(),
  dayReports: z.array(DayReportSchema).max(60),
  revision: counter, seed: counter, rng: counter, createdAt: z.string().datetime(),
  hostId: id, guestId: id.nullable(), guestKey: id.nullable(),
  clock: z.object({ totalMinutes: z.number().nonnegative(), secondsPerGameMinute: z.number().min(0.1).max(10) }).strict(),
  weather: z.enum(['clear', 'rain', 'storm', 'fog', 'snow']),
  story: z.object({ chapter: counter, flags }).strict(), quests: z.record(z.string(), z.string()),
  townChanges: flags, upgrades: flags, unlocks: strings, bosses: flags,
  chest: counters, containers: z.record(z.string().max(100), counters).default({}), economy: counters,
  events: z.array(z.object({ id, kind: z.string().max(80), actor: id, minute: z.number().nonnegative() }).strict()).max(1000),
  players: z.record(z.string().uuid(), PlayerSchema),
  lastSequence: z.record(z.string().uuid(), counter),
}).strict();
function validateWorld(world: Omit<z.infer<typeof WorldBase>, 'schemaVersion'>, ctx: z.RefinementCtx, geometry = currentGeometry) {
  for (const [map, layout] of Object.entries({ castle: world.layout, ...world.roomLayouts })) {
    if (Object.entries(layout).some(([id, p]) => p?.rotation && !ROTATABLE_FURNITURE.includes(id as typeof FURNITURE_IDS[number]))) ctx.addIssue({ code: 'custom', message: 'Furniture has no directional layout' });
    const problem = layoutGeometryError(layout, geometry(map as RoomMap, layout));
    if (problem) ctx.addIssue({ code: 'custom', message: problem });
  }
  const ids = Object.keys(world.players);
  if (ids.length < 1 || ids.length > 2 || !world.players[world.hostId] ||
      ids.some(key => world.players[key].id !== key) ||
      (world.guestId ? !world.players[world.guestId] || world.guestId === world.hostId || !world.guestKey : ids.length !== 1 || world.guestKey !== null)) {
    ctx.addIssue({ code: 'custom', message: 'World household identities are inconsistent' });
  }
  for (const player of Object.values(world.players)) {
    if (player.seated && (player.fatigue.sleeping || player.seated.id === 'armchair' && player.seated.slot !== 0 || !getRoomObjects(player.map).some(o => o.id === player.seated!.id))) ctx.addIssue({ code: 'custom', message: 'Resident seat state is inconsistent' });
    const { sleeping, sleepStartedAt, wakeAt } = player.fatigue;
    if (sleeping ? sleepStartedAt === null || wakeAt === null || wakeAt <= sleepStartedAt || !isBedroom(player.map) : sleepStartedAt !== null || wakeAt !== null) {
      ctx.addIssue({ code: 'custom', message: 'Resident sleep state is inconsistent' });
    }
  }
}
export const WorldSchema = WorldBase.superRefine((world, ctx) => validateWorld(world, ctx));
const Schema6 = WorldBase.extend({ schemaVersion: z.literal(6) }).superRefine((world, ctx) => validateWorld(world, ctx, schema6Geometry));
export type World = z.infer<typeof WorldSchema>;
export type Slot = 1 | 2;
export type Scope = 'personal' | 'shared_world' | 'cooperative';
export function createPlayer(name: string, appearance: Player['appearance'] = 'amber', playerId: string = crypto.randomUUID(), look: CharacterLook = DEFAULT_LOOK): Player {
  return PlayerSchema.parse({ id: playerId, name, appearance, look, map: 'castle', x: 480, y: 364,
    health: 100, energy: 100, fatigue: { consecutiveAllNighters: 0, terminalMinutes: 0, sleeping: false, sleepStartedAt: null, wakeAt: null }, interaction: null,
    inventory: {}, equipment: {}, money: 0, skills: {}, recipes: [], discoveries: [], friendships: {},
    romance: {}, dialogueHistory: [], giftHistory: [], quests: {}, settings: { controlSize: 1, reducedMotion: false } });
}
export function createWorld(player: Player): World {
  return WorldSchema.parse({ schemaVersion: 7, layout: {}, roomLayouts: { living: {}, 'bedroom-2': {}, landing: {}, kitchen: {} }, dayReports: [], game: GAME_TITLE, worldId: crypto.randomUUID(), epoch: crypto.randomUUID(),
    revision: 0, seed: crypto.getRandomValues(new Uint32Array(1))[0], rng: 1, createdAt: new Date().toISOString(),
    hostId: player.id, guestId: null, guestKey: null, clock: { totalMinutes: 18 * 60, secondsPerGameMinute: 1 },
    weather: 'clear', story: { chapter: 1, flags: {} }, quests: {}, townChanges: {}, upgrades: {}, unlocks: [], bosses: {},
    chest: {}, economy: {}, events: [], players: { [player.id]: player }, lastSequence: {} });
}
const LegacyWorldSchema = WorldBase.omit({ layout: true, roomLayouts: true, dayReports: true }).extend({ schemaVersion: z.literal(1), players: z.record(z.string().uuid(), PlayerSchema.omit({ interaction: true }).extend({
  map: z.literal('castle'), fatigue: z.object({ consecutiveAllNighters: counter, terminalMinutes: z.number().nonnegative(), sleeping: z.boolean() }).strict(),
})) });
function migrateLegacy(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || !('schemaVersion' in raw)) return raw;
  if (raw.schemaVersion === 5) return { ...WorldBase.extend({ schemaVersion: z.literal(5) }).parse(raw), schemaVersion: 6 };
  if (raw.schemaVersion === 4) return { ...WorldBase.extend({ schemaVersion: z.literal(4) }).parse(raw), schemaVersion: 6 };
  if (raw.schemaVersion === 3) {
    const old = WorldBase.omit({ roomLayouts: true, dayReports: true }).extend({ schemaVersion: z.literal(3) }).parse(raw);
    return { ...old, schemaVersion: 6, roomLayouts: { living: {}, 'bedroom-2': {}, landing: {}, kitchen: {} }, dayReports: [] };
  }
  if (raw.schemaVersion === 2) {
    const old = WorldBase.omit({ layout: true, roomLayouts: true, dayReports: true }).extend({ schemaVersion: z.literal(2) }).parse(raw);
    return { ...old, schemaVersion: 6, layout: {}, roomLayouts: { living: {}, 'bedroom-2': {}, landing: {}, kitchen: {} }, dayReports: [] };
  }
  if (raw.schemaVersion !== 1) return raw;
  const old = LegacyWorldSchema.parse(raw);
  // Schema 1 reserved a sleep flag but had no runnable sleep system or timer.
  return { ...old, schemaVersion: 6, layout: {}, roomLayouts: { living: {}, 'bedroom-2': {}, landing: {}, kitchen: {} }, dayReports: [], players: Object.fromEntries(Object.entries(old.players).map(([key, player]) => [key, {
    ...player, interaction: null, fatigue: { ...player.fatigue, sleeping: false, sleepStartedAt: null, wakeAt: null },
  }])) };
}
function migrateWorld(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || !('schemaVersion' in raw) || ![1, 2, 3, 4, 5, 6].includes(raw.schemaVersion as number)) return raw;
  const world = migrateLegacy(raw) as z.infer<typeof Schema6>;
  if (raw.schemaVersion !== 6) for (const map of ['castle', 'living', 'bedroom-2'] as const) {
    const layout = map === 'castle' ? world.layout : world.roomLayouts[map];
    if (map === 'bedroom-2') {
      for (const [id, dx] of [['bed', 152], ['desk', 116]] as const) layout[id] = { ...(layout[id] ?? { x: 0, y: 0 }), x: (layout[id]?.x ?? 0) - dx };
      if (layout['candle-desk']) layout['candle-desk'].x -= 116;
    }
    if (layout.plant) layout.plant.y -= 124;
    else {
      const objects = getRoomObjects(map, layout), plant = objects.find(o => o.id === 'plant')!;
      if (objects.some(o => o.id !== 'plant' && objectColliders(o).some(a => objectColliders(plant).some(b => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y)))) layout.plant = { x: 0, y: -124 };
    }
  }
  // Validate the original projection before repairing anything. Parsing also
  // clones the input, preserving the stored record and recovery copies.
  const previous = Schema6.parse(world);
  const projected = (map: RoomMap, layout: z.infer<typeof LayoutSchema>) => migrateProjectedLayout(map, layout, candidate => {
    // Finish geometric repairs before asking the shared walk-grid validator.
    // Resident coordinates are preserved here; prepareRoom reconciles occupied
    // furniture and unsafe feet on resume rather than altering progression.
    if (layoutGeometryError(candidate, currentGeometry(map, candidate))) return true;
    return layoutError({ ...previous, schemaVersion: 7, players: {} }, map, candidate) === null;
  });
  return { ...previous, schemaVersion: 7,
    layout: projected('castle', previous.layout),
    roomLayouts: Object.fromEntries(Object.entries(previous.roomLayouts).map(([map, layout]) => [map, projected(map as RoomMap, layout)])),
  };
}
export const StoredWorldSchema = z.preprocess(migrateWorld, WorldSchema);
export function parseWorld(raw: unknown): World { return StoredWorldSchema.parse(raw); }
