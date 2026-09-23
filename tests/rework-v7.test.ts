import { clampPlacement, ROOM_MAPS, ROTATABLE_FURNITURE } from '../src/content/room';
import { describe, expect, it, vi } from 'vitest';
import { Authority } from '../src/game/authority';
import { createPlayer, createWorld, parseWorld, type World } from '../src/game/model';
import { canStand, getRoomObjects, objectColliders, roomLayout, type RoomLayout, type RoomMap } from '../src/content/room';
import { layoutError } from '../src/content/furnishing';

function household(map: RoomMap = 'castle') {
  const keeper = createPlayer('Keeper'), companion = createPlayer('Companion', 'moss');
  const world = createWorld(keeper);
  world.guestId = companion.id; world.guestKey = crypto.randomUUID(); world.players[companion.id] = companion;
  for (const [index, player] of Object.values(world.players).entries()) Object.assign(player, { map, x: 480 + index * 50, y: 464 });
  return { world, host: keeper.id, guest: companion.id };
}
const furnitureDraft: RoomLayout = { carpet: { x: 8, y: 0 }, plant: { x: -48, y: -8 } };
const snapshot = (world: World) => structuredClone(world);

describe('resident movement and reciprocal doors', () => {
  it.each([
    { x: 92, y: 430, dx: -1, dy: 0, facing: 'left' },
    { x: 868, y: 420, dx: 1, dy: 0, facing: 'right' },
    { x: 680, y: 220, dx: 0, dy: -1, facing: 'up' },
    { x: 680, y: 476, dx: 0, dy: 1, facing: 'down' },
    { x: 180, y: 350, dx: 0, dy: -1, facing: 'up' },
  ])('faces $facing while blocked at $x,$y and persists that direction', async ({ x, y, dx, dy, facing }) => {
    const world = createWorld(createPlayer('Keeper')); Object.assign(world.players[world.hostId], { x, y, facing: facing === 'down' ? 'up' : 'down' });
    const commit = vi.fn(async (_world: World) => {}), authority = new Authority(world, commit);
    expect(canStand(authority.world.players[world.hostId])).toBe(true);
    await authority.dispatch(world.hostId, 1, { kind: 'move', dx, dy });
    expect(authority.world.players[world.hostId]).toMatchObject({ x, y, facing });
    const saved = parseWorld(commit.mock.calls[0][0]);
    expect(saved.players[world.hostId]).toMatchObject({ x, y, facing });
  });

  // These are the authored room connections, independent of the door helper's output.
  const passages: { from: RoomMap; to: RoomMap; x: number; y: number; dx: number; dy: number; arrival: { x: number; y: number } }[] = [
    { from: 'castle', to: 'living', x: 840, y: 343, dx: 1, dy: 0, arrival: { x: 132, y: 343 } },
    { from: 'living', to: 'castle', x: 120, y: 343, dx: -1, dy: 0, arrival: { x: 828, y: 343 } },
    { from: 'bedroom-2', to: 'living', x: 120, y: 343, dx: -1, dy: 0, arrival: { x: 828, y: 343 } },
    { from: 'living', to: 'bedroom-2', x: 840, y: 343, dx: 1, dy: 0, arrival: { x: 132, y: 343 } },
    { from: 'living', to: 'landing', x: 480, y: 450, dx: 0, dy: 1, arrival: { x: 480, y: 258 } },
    { from: 'landing', to: 'living', x: 480, y: 244, dx: 0, dy: -1, arrival: { x: 480, y: 430 } },
    { from: 'landing', to: 'kitchen', x: 840, y: 343, dx: 1, dy: 0, arrival: { x: 132, y: 343 } },
    { from: 'kitchen', to: 'landing', x: 120, y: 343, dx: -1, dy: 0, arrival: { x: 828, y: 343 } },
  ];
  it.each(passages)('walks $from → $to without A, continues inward, and returns through the same door', async passage => {
    const world = createWorld(createPlayer('Keeper'));
    Object.assign(world.players[world.hostId], { map: passage.from, x: passage.x, y: passage.y });
    const authority = new Authority(world, async () => {}), player = () => authority.world.players[world.hostId];
    await authority.dispatch(world.hostId, 1, { kind: 'move', dx: passage.dx, dy: passage.dy });
    expect(player()).toMatchObject({ map: passage.to, ...passage.arrival, interaction: null, seated: null });
    expect(canStand(player())).toBe(true);
    await authority.dispatch(world.hostId, 2, { kind: 'move', dx: passage.dx, dy: passage.dy });
    expect(player()).toMatchObject({ map: passage.to, x: passage.arrival.x + 14 * passage.dx, y: passage.arrival.y + 14 * passage.dy });
    for (let sequence = 3; sequence < 9 && player().map === passage.to; sequence++) {
      await authority.dispatch(world.hostId, sequence, { kind: 'move', dx: -passage.dx, dy: -passage.dy });
    }
    expect(player().map).toBe(passage.from);
    expect(canStand(player())).toBe(true);
  });
});

describe('whole-room layout transactions', () => {
  it('keeps preview and cancel read-only, then publishes both pieces together after storage completes', async () => {
    const { world, host } = household(), before = snapshot(world);
    let finishSave!: () => void;
    const saved = new Promise<void>(resolve => { finishSave = resolve; });
    const commit = vi.fn(async (_world: World) => saved), authority = new Authority(world, commit), publish = vi.fn();
    authority.subscribe(publish);
    const draft = structuredClone(furnitureDraft);
    expect(layoutError(authority.world, 'castle', draft)).toBeNull();
    expect(layoutError(authority.world, 'castle', { bed: { x: -200, y: 0 } })).toMatch(/inside/);
    draft.carpet!.x = 16; // Dragging and discarding a draft cannot edit the host's saved layout.
    expect(authority.world).toEqual(before); expect(commit).not.toHaveBeenCalled();
    const saving = authority.dispatch(host, 1, { kind: 'save-layout', map: 'castle', layout: furnitureDraft, expected: {} });
    await vi.waitFor(() => expect(commit).toHaveBeenCalledOnce());
    expect(commit.mock.calls[0][0].layout).toEqual(furnitureDraft);
    expect(authority.world).toEqual(before); expect(publish).not.toHaveBeenCalled();
    finishSave(); await saving;
    expect(authority.world.layout).toEqual(furnitureDraft); expect(authority.world.revision).toBe(before.revision + 1);
    expect(publish).toHaveBeenCalledOnce(); expect(publish.mock.calls[0][0].layout).toEqual(furnitureDraft);
    expect(parseWorld(JSON.parse(JSON.stringify(authority.world)))).toEqual(authority.world);
  });

  it('serializes simultaneous drafts, rejects a stale expected layout, and lets the guest retry without losing either edit', async () => {
    const { world, host, guest } = household('living'), commit = vi.fn(async (_world: World) => {}), authority = new Authority(world, commit);
    const first: RoomLayout = { carpet: { x: 8, y: 0 } }, competing: RoomLayout = { plant: { x: -48, y: -8 } };
    const results = await Promise.allSettled([
      authority.dispatch(host, 1, { kind: 'save-layout', map: 'living', layout: first, expected: {} }),
      authority.dispatch(guest, 1, { kind: 'save-layout', map: 'living', layout: competing, expected: {} }),
    ]);
    expect(results[0].status).toBe('fulfilled'); expect(results[1]).toMatchObject({ status: 'rejected', reason: expect.objectContaining({ message: expect.stringContaining('other resident') }) });
    expect(authority.world.roomLayouts.living).toEqual(first); expect(authority.world.lastSequence[guest]).toBeUndefined();
    expect(commit).toHaveBeenCalledOnce(); expect(competing).toEqual({ plant: { x: -48, y: -8 } });
    await authority.dispatch(guest, 1, { kind: 'save-layout', map: 'living', layout: { ...first, ...competing }, expected: first });
    expect(authority.world.roomLayouts.living).toEqual({ ...first, ...competing });
    expect(authority.world.layout).toEqual({}); expect(authority.world.roomLayouts['bedroom-2']).toEqual({});
  });

  it('checks bedroom ownership and current room before accepting a batch', async () => {
    const { world, host, guest } = household(), commit = vi.fn(async (_world: World) => {}), authority = new Authority(world, commit);
    const before = snapshot(authority.world);
    await expect(authority.dispatch(guest, 1, { kind: 'save-layout', map: 'castle', layout: furnitureDraft, expected: {} })).rejects.toThrow('owner');
    expect(authority.world).toEqual(before);
    Object.assign(authority.world.players[host], { map: 'bedroom-2' });
    const visiting = snapshot(authority.world);
    await expect(authority.dispatch(host, 1, { kind: 'save-layout', map: 'bedroom-2', layout: furnitureDraft, expected: {} })).rejects.toThrow('owner');
    await expect(authority.dispatch(guest, 1, { kind: 'save-layout', map: 'living', layout: furnitureDraft, expected: {} })).rejects.toThrow('owner');
    expect(authority.world).toEqual(visiting); expect(commit).not.toHaveBeenCalled();
    Object.assign(authority.world.players[guest], { map: 'bedroom-2' });
    await authority.dispatch(guest, 1, { kind: 'save-layout', map: 'bedroom-2', layout: { carpet: { x: 8, y: 0 } }, expected: {} });
    expect(authority.world.roomLayouts['bedroom-2'].carpet?.x).toBe(8);
  });

  it('rolls back the entire batch and action sequence on disk failure, then permits the same action to retry', async () => {
    const { world, host } = household(), commit = vi.fn<(world: World) => Promise<void>>()
      .mockRejectedValueOnce(Error('Disk full')).mockResolvedValue(undefined);
    const authority = new Authority(world, commit), publish = vi.fn(), before = snapshot(authority.world);
    authority.subscribe(publish);
    const intent = { kind: 'save-layout', map: 'castle', layout: furnitureDraft, expected: {} };
    await expect(authority.dispatch(host, 1, intent)).rejects.toThrow('Disk full');
    expect(authority.world).toEqual(before); expect(publish).not.toHaveBeenCalled();
    await expect(authority.flush()).rejects.toThrow('Disk full');
    await expect(authority.dispatch(host, 1, intent)).resolves.toBe(true);
    expect(authority.world.layout).toEqual(furnitureDraft); expect(authority.world.lastSequence[host]).toBe(1);
    expect(authority.world.revision).toBe(before.revision + 1); expect(publish).toHaveBeenCalledOnce();
    await expect(authority.flush()).resolves.toBeUndefined();
  });
});

describe('rotated furnishings and shared seats', () => {
  it('rotates the sofa footprint and collision while choosing the nearest free of three seats', async () => {
    const { world, host, guest } = household('living'), authority = new Authority(world, async () => {});
    const layout: RoomLayout = { sofa: { x: 0, y: 0, rotation: 1 } };
    await authority.dispatch(host, 1, { kind: 'save-layout', map: 'living', layout, expected: {} });
    const sofa = getRoomObjects('living', authority.world.roomLayouts.living).find(object => object.id === 'sofa')!;
    expect(sofa.floor!.x).toBeCloseTo(366 + 1 / 3); expect(sofa.floor!.y).toBeCloseTo(292.2);
    expect(sofa.floor!.width).toBeCloseTo(73 + 1 / 3); expect(sofa.floor!.height).toBeCloseTo(87.6);
    expect(objectColliders(sofa)).toEqual([sofa.floor]);
    const contactX = sofa.floor!.x - 12;
    Object.assign(authority.world.players[host], { x: contactX, y: 336 });
    await authority.dispatch(host, 2, { kind: 'move', dx: 1, dy: 0 });
    expect(authority.world.players[host]).toMatchObject({ x: contactX, y: 336, facing: 'right' });
    await authority.dispatch(host, 3, { kind: 'interact', target: 'sofa' });
    Object.assign(authority.world.players[guest], { x: contactX - 8, y: 336 });
    await authority.dispatch(guest, 1, { kind: 'interact', target: 'sofa' });
    expect(authority.world.players[host]).toMatchObject({ x: 403, y: 336, facing: 'left', seated: { id: 'sofa', slot: 1 } });
    expect(authority.world.players[guest]).toMatchObject({ x: 403, y: 310.8, facing: 'left', seated: { id: 'sofa', slot: 0 } });
    const occupied = snapshot(authority.world);
    await expect(authority.dispatch(host, 4, { kind: 'save-layout', map: 'living', layout: {}, expected: layout })).rejects.toThrow('using this piece');
    expect(authority.world).toEqual(occupied);
    await authority.dispatch(host, 4, { kind: 'stand' });
    expect(authority.world.players[host]).toMatchObject({ y: 336, seated: null });
    expect(authority.world.players[host].x).toBeCloseTo(342 + 1 / 3);
    expect(canStand(authority.world.players[host], 'living', layout)).toBe(true);
    const guestLook = structuredClone(authority.world.players[guest].look);
    authority.world.players[guest].inventory['cacao-bean'] = 7;
    await authority.releasePlayer(guest);
    expect(authority.world.players[guest]).toMatchObject({ seated: null, look: guestLook, inventory: { 'cacao-bean': 7 } });
    expect(canStand(authority.world.players[guest], 'living', layout)).toBe(true);
    await authority.dispatch(host, 5, { kind: 'interact', target: 'sofa' });
    expect(authority.world.players[host].seated).toEqual({ id: 'sofa', slot: 1 });
    expect(parseWorld(JSON.parse(JSON.stringify(authority.world)))).toEqual(authority.world);
  });

  it('keeps an idle seated resident anchored until a nonzero move explicitly stands them up', async () => {
    const { world, host } = household('living'); Object.assign(world.players[host], { x: 403, y: 380 });
    const authority = new Authority(world, async () => {});
    await authority.dispatch(host, 1, { kind: 'interact', target: 'sofa' });
    const seated = structuredClone(authority.world.players[host]);
    await authority.dispatch(host, 2, { kind: 'move', dx: 0, dy: 0 });
    expect(authority.world.players[host]).toEqual(seated);
    await authority.dispatch(host, 3, { kind: 'move', dx: 0, dy: 1 });
    expect(authority.world.players[host].seated).toBeNull();
    expect(canStand(authority.world.players[host], 'living')).toBe(true);
    expect(authority.world.players[host].y).toBeGreaterThan(358);
  });

  it('prevents sharing or moving a one-person chair and releases it after dropout', async () => {
    const { world, host, guest } = household('living');
    for (const player of Object.values(world.players)) Object.assign(player, { x: 560, y: 444 });
    const authority = new Authority(world, async () => {});
    await authority.dispatch(host, 1, { kind: 'interact', target: 'armchair' });
    const occupied = snapshot(authority.world);
    await expect(authority.dispatch(guest, 1, { kind: 'interact', target: 'armchair' })).rejects.toThrow('occupied');
    await expect(authority.dispatch(guest, 1, { kind: 'save-layout', map: 'living', layout: { armchair: { x: 0, y: 0, rotation: 1 } }, expected: {} })).rejects.toThrow('using this piece');
    expect(authority.world).toEqual(occupied);
    await authority.releasePlayer(host);
    await authority.dispatch(guest, 1, { kind: 'interact', target: 'armchair' });
    expect(authority.world.players[host].seated).toBeNull();
    expect(authority.world.players[guest].seated).toEqual({ id: 'armchair', slot: 0 });
  });

  it('uses the rotated bed for both sleepers, forbids edits while occupied and wakes onto clear floor', async () => {
    const { world, host, guest } = household(), authority = new Authority(world, async () => {});
    const layout: RoomLayout = { bed: { x: 0, y: 16, rotation: 1 } };
    await authority.dispatch(host, 1, { kind: 'save-layout', map: 'castle', layout, expected: {} });
    for (const id of [host, guest]) Object.assign(authority.world.players[id], { x: 174, y: 300 });
    expect(canStand(authority.world.players[host], 'castle', layout)).toBe(true);
    await authority.dispatch(host, 2, { kind: 'sleep' }); await authority.dispatch(guest, 1, { kind: 'sleep' });
    expect(authority.world.players[host]).toMatchObject({ bedDisturbances: 1, fatigue: { sleeping: true } });
    expect(authority.world.players[host].x).toBeCloseTo(174);
    expect(authority.world.players[host].y).toBeCloseTo(328.8);
    expect(authority.world.players[guest]).toMatchObject({ x: 174, y: 300, fatigue: { sleeping: true } });
    const asleep = snapshot(authority.world);
    await expect(authority.dispatch(host, 3, { kind: 'save-layout', map: 'castle', layout: {}, expected: layout })).rejects.toThrow('using this piece');
    expect(authority.world).toEqual(asleep);
    await authority.advanceTime(1.5, { activeIds: [host, guest], paused: false });
    expect(authority.world.clock.totalMinutes).toBe(1800);
    for (const player of Object.values(authority.world.players)) {
      expect(player.fatigue.sleeping).toBe(false); expect(player.seated).toBeNull();
      expect(canStand(player, 'castle', layout)).toBe(true); expect(player.energy).toBe(100);
    }
    expect(authority.world.dayReports).toHaveLength(1);
  });
});

describe('schema 5 household migration', () => {
  it('adds facing/seating and new rooms once, preserving personal progress and old absolute furniture positions', () => {
    const { world, host, guest } = household();
    world.players[host].inventory['cacao-bean'] = 11; world.players[guest].discoveries = ['letter'];
    world.players[guest].look = { body: 'female', hairStyle: 'braid', hairColor: 'silver', skinTone: 'brown', outfit: 'skirt' };
    world.story.flags.hearth = true; world.chest['cacao-bean'] = 4; world.clock.totalMinutes = 1512;
    const oldPlayer = (id: string) => { const { facing: _facing, seated: _seated, ...old } = world.players[id]; void _facing; void _seated; return old; };
    const customPlant = { x: -100, y: 80 };
    const legacy = { ...world, schemaVersion: 5, layout: { plant: customPlant },
      roomLayouts: { living: { plant: { ...customPlant } }, 'bedroom-2': { plant: { ...customPlant }, bed: { x: 16, y: 0 }, desk: { x: 16, y: 0 }, 'candle-desk': { x: 16, y: 0 } } },
      players: { [host]: oldPlayer(host), [guest]: oldPlayer(guest) } };
    const original = structuredClone(legacy), migrated = parseWorld(legacy);
    expect(legacy).toEqual(original); expect(migrated.schemaVersion).toBe(7);
    expect(migrated.roomLayouts.landing).toEqual({}); expect(migrated.roomLayouts.kitchen).toEqual({});
    for (const id of [host, guest]) expect(migrated.players[id]).toEqual({ ...original.players[id], facing: 'down', seated: null });
    for (const map of ['castle', 'living', 'bedroom-2'] as const) {
      // Schema 5 plant base was 836,290; its saved offset must retain that absolute location.
      expect(getRoomObjects(map, roomLayout(migrated, map)).find(object => object.id === 'plant')!.bounds).toEqual({ x: 736, y: 370, width: 40, height: 62 });
    }
    const bedroom = getRoomObjects('bedroom-2', migrated.roomLayouts['bedroom-2']);
    expect(bedroom.find(object => object.id === 'bed')!.bounds).toEqual({ x: 126, y: 210, width: 140, height: 130 });
    expect(bedroom.find(object => object.id === 'desk')!.bounds).toEqual({ x: 346, y: 220, width: 105, height: 65 });
    expect(bedroom.find(object => object.id === 'candle-desk')!.bounds).toEqual({ x: 421, y: 215, width: 10, height: 24 });
    expect(migrated.chest).toEqual(world.chest); expect(migrated.story).toEqual(world.story); expect(migrated.clock).toEqual(world.clock);
    expect(migrated.worldId).toBe(world.worldId); expect(migrated.guestKey).toBe(world.guestKey);
    expect(parseWorld(JSON.parse(JSON.stringify(migrated)))).toEqual(migrated);
  });
});


it('clamps every rotated furnishing inside the wall even with half-pixel ground bounds', () => {
  for (const map of ROOM_MAPS) for (const id of ROTATABLE_FURNITURE) {
    if (!getRoomObjects(map).some(o => o.id === id)) continue;
    for (const rotation of [0, 1, 2, 3] as const) for (const x of [-900, 900]) for (const y of [-600, 600]) {
      const placement = clampPlacement(map, id, { x, y, rotation }, {}), object = getRoomObjects(map, { [id]: placement }).find(o => o.id === id)!;
      expect(Number.isInteger(placement.x) && Number.isInteger(placement.y)).toBe(true);
      expect(object.bounds.x).toBeGreaterThanOrEqual(80); expect(object.bounds.x + object.bounds.width).toBeLessThanOrEqual(880);
      expect(object.bounds.y).toBeGreaterThanOrEqual(74); expect(object.bounds.y + object.bounds.height).toBeLessThanOrEqual(476);
    }
  }
});
