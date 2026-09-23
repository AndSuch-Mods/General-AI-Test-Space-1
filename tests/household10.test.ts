import { describe, expect, it, vi } from 'vitest';
import { Authority } from '../src/game/authority';
import { createPlayer, createWorld, parseWorld, type World } from '../src/game/model';
import { startSleep } from '../src/game/time';
import { storageCapacity, storedItems } from '../src/game/storage';
import { bedLocal, bedPoint, canInteract, canStand, getRoomObjects, inBedEntry, moveInRoom, roomLayout, type RoomLayout, type RoomMap, type Turn } from '../src/content/room';

function household() {
  const host = createPlayer('Keeper'), guest = createPlayer('Companion', 'moss'), world = createWorld(host);
  world.guestId = guest.id; world.guestKey = crypto.randomUUID(); world.players[guest.id] = guest;
  const commit = vi.fn(async (_world: World) => {}), authority = new Authority(world, commit);
  authority.setActivePlayers([host.id, guest.id]);
  const act = (id: string, intent: unknown) => authority.dispatch(id, (authority.world.lastSequence[id] ?? 0) + 1, intent);
  const at = (id: string, map: RoomMap, x: number, y: number) => {
    Object.assign(authority.world.players[id], { map, x, y, interaction: null });
    expect(canStand({ map, x, y }, map, roomLayout(authority.world, map))).toBe(true);
  };
  return { authority, commit, act, at, host: host.id, guest: guest.id };
}

describe('nearest sofa seats', () => {
  it.each([{ x: 361, slot: 0 }, { x: 403, slot: 1 }, { x: 445, slot: 2 }])('chooses slot $slot when approaching at x=$x', async ({ x, slot }) => {
    const { authority, at, act, host } = household(); at(host, 'living', x, 376);
    await act(host, { kind: 'interact', target: 'sofa' });
    expect(authority.world.players[host]).toMatchObject({ x, y: 336, seated: { id: 'sofa', slot }, facing: 'down' });
  });

  it('chooses the next nearest free cushion without moving the other resident', async () => {
    const { authority, at, act, host, guest } = household();
    at(host, 'living', 445, 376); await act(host, { kind: 'interact', target: 'sofa' });
    const first = structuredClone(authority.world.players[host]);
    at(guest, 'living', 445, 376); await act(guest, { kind: 'interact', target: 'sofa' });
    expect(authority.world.players[guest]).toMatchObject({ x: 403, y: 336, seated: { id: 'sofa', slot: 1 } });
    expect(authority.world.players[host]).toEqual(first);
  });
});

describe('separate household containers and the filed letter', () => {
  it('keeps left/right drawers separate in both bedrooms and persists the selected drawer', async () => {
    const { authority, at, act, host, guest } = household();
    authority.world.players[host].inventory['cacao-bean'] = 8;
    authority.world.players[guest].inventory['cacao-bean'] = 8;
    for (const [id, map, offset] of [[host, 'castle', 0], [guest, 'bedroom-2', 116]] as const) {
      at(id, map, 350 + offset, 296); await act(id, { kind: 'interact', target: 'desk' });
      expect(authority.world.players[id].drawer).toBe('left');
      await act(id, { kind: 'transfer', direction: 'deposit', item: 'cacao-bean', count: 3 });
      at(id, map, 420 + offset, 296); await act(id, { kind: 'interact', target: 'desk' });
      expect(authority.world.players[id].drawer).toBe('right');
      await act(id, { kind: 'transfer', direction: 'deposit', item: 'cacao-bean', count: 5 });
    }
    expect(authority.world.containers).toEqual({
      'castle:desk:left': { 'cacao-bean': 3 }, 'castle:desk:right': { 'cacao-bean': 5 },
      'bedroom-2:desk:left': { 'cacao-bean': 3 }, 'bedroom-2:desk:right': { 'cacao-bean': 5 },
    });
    const restored = parseWorld(JSON.parse(JSON.stringify(authority.world)));
    expect(restored.containers).toEqual(authority.world.containers);
    expect(restored.players[host].drawer).toBe('right'); expect(restored.players[guest].drawer).toBe('right');
  });

  it('does not alias another room chest to the original bedroom chest', async () => {
    const { authority, at, act, host } = household(); authority.world.players[host].inventory['cacao-bean'] = 7;
    at(host, 'castle', 804, 420); await act(host, { kind: 'interact', target: 'chest' });
    await act(host, { kind: 'transfer', direction: 'deposit', item: 'cacao-bean', count: 3 });
    at(host, 'living', 804, 420); await act(host, { kind: 'interact', target: 'chest' });
    await act(host, { kind: 'transfer', direction: 'deposit', item: 'cacao-bean', count: 4 });
    expect(authority.world.chest).toEqual({ 'cacao-bean': 3 });
    expect(authority.world.containers['living:chest']).toEqual({ 'cacao-bean': 4 });
    expect(storedItems(authority.world, 'bedroom-2', 'chest')).toEqual({});
  });

  it('limits the nightstand to two distinct stacks while allowing an existing stack to grow', async () => {
    const { authority, at, act, host } = household();
    // Item records permit saved/future content keys. Those still occupy a slot.
    authority.world.containers['castle:side-table'] = { 'cacao-bean': 1, keepsake: 1 };
    Object.assign(authority.world.players[host].inventory, { 'cacao-bean': 2, 'welcome-letter': 1 });
    at(host, 'castle', 272, 450); await act(host, { kind: 'interact', target: 'side-table' });
    expect(storageCapacity('side-table')).toBe(2);
    const before = structuredClone(authority.world);
    await expect(act(host, { kind: 'transfer', direction: 'deposit', item: 'welcome-letter', count: 1 })).rejects.toThrow('full');
    expect(authority.world).toEqual(before);
    await act(host, { kind: 'transfer', direction: 'deposit', item: 'cacao-bean', count: 2 });
    expect(authority.world.containers['castle:side-table']).toEqual({ 'cacao-bean': 3, keepsake: 1 });
    await act(host, { kind: 'transfer', direction: 'withdraw', item: 'cacao-bean', count: 3 });
    await act(host, { kind: 'transfer', direction: 'deposit', item: 'welcome-letter', count: 1 });
    expect(authority.world.containers['castle:side-table']).toEqual({ keepsake: 1, 'welcome-letter': 1 });
  });

  it('files the letter once and lets each resident discover it independently from the correct drawer', async () => {
    const { authority, at, act, host, guest } = household();
    authority.world.players[guest].discoveries = ['pantry'];
    at(host, 'castle', 362, 296); await act(host, { kind: 'interact', target: 'letter' });
    expect(authority.world.story.flags['letter-filed']).toBe(true);
    expect(authority.world.containers['castle:desk:left']).toEqual({ 'welcome-letter': 1 });
    expect(authority.world.players[host].discoveries).toEqual(['letter']);
    expect(authority.world.players[guest].discoveries).toEqual(['pantry']);
    at(guest, 'castle', 420, 296); await act(guest, { kind: 'interact', target: 'desk' });
    await expect(act(guest, { kind: 'read-letter' })).rejects.toThrow('drawer containing');
    expect(authority.world.players[guest].discoveries).toEqual(['pantry']);
    at(guest, 'castle', 350, 296); await act(guest, { kind: 'interact', target: 'desk' });
    await act(guest, { kind: 'read-letter' }); await act(guest, { kind: 'read-letter' });
    expect(authority.world.players[guest].discoveries).toEqual(['pantry', 'letter']);
    expect(authority.world.players[guest].quests['a-household-begins']).toBe('complete');
    expect(authority.world.players[host].quests['a-household-begins']).toBe('started');
    await act(guest, { kind: 'transfer', direction: 'withdraw', item: 'welcome-letter', count: 1 });
    at(host, 'castle', 362, 296);
    await expect(act(host, { kind: 'interact', target: 'letter' })).rejects.toThrow('left desk drawer');
    expect(authority.world.containers['castle:desk:left']).toEqual({});
    expect(authority.world.players[guest].inventory['welcome-letter']).toBe(1);
    expect(authority.world.containers['bedroom-2:desk:left']).toBeUndefined();
  });
});

describe('resting without teleporting and broad bed access', () => {
  it('starts sleep exactly where the resident is standing, including a moved and rotated bed', () => {
    for (const map of ['castle', 'bedroom-2'] as const) for (const rotation of [0, 1, 2, 3] as const) {
      const layout: RoomLayout = { bed: { x: map === 'castle' ? 220 : 68, y: 48, rotation } };
      const player = createPlayer('Keeper'); Object.assign(player, bedPoint({ x: 163, y: 300 }, map, layout), { map });
      const position = { x: player.x, y: player.y, map: player.map };
      startSleep(player, 1080, layout);
      expect(player).toMatchObject({ ...position, interaction: null, seated: null, fatigue: { sleeping: true, sleepStartedAt: 1080, wakeAt: 1800 } });
    }
  });

  it.each([{ first: 150, arriving: 170, disturbed: true }, { first: 140, arriving: 220, disturbed: false }])('only nudges an existing sleeper when bodies overlap: $disturbed', async ({ first, arriving, disturbed }) => {
    const { authority, at, act, host, guest } = household();
    at(host, 'castle', first, 304); await act(host, { kind: 'sleep' });
    const prior = structuredClone(authority.world.players[host]);
    at(guest, 'castle', arriving, 304); await act(guest, { kind: 'sleep' });
    expect(authority.world.players[guest]).toMatchObject({ x: arriving, y: 304, fatigue: { sleeping: true } });
    if (disturbed) {
      expect(authority.world.players[host].bedDisturbances).toBe(prior.bedDisturbances + 1);
      expect(Math.abs(authority.world.players[host].x - arriving)).toBeGreaterThanOrEqual(46);
      expect(authority.world.players[host]).toMatchObject({ y: 304, fatigue: prior.fatigue, bedDisturbedAt: 1080 });
    } else expect(authority.world.players[host]).toEqual(prior);
  });

  it.each([0, 1, 2, 3] as const)('guides both broad bed entrances without crossing solid furniture at rotation %i', (rotation: Turn) => {
    for (const map of ['castle', 'bedroom-2'] as const) for (const side of ['left', 'right'] as const) for (const y of [292, 298, 304]) {
      const layout: RoomLayout = { bed: { x: map === 'castle' ? 220 : 68, y: 80, rotation } };
      const direction = side === 'right' ? -1 : 1;
      const [dx, dy] = [[direction, 0], [0, direction], [-direction, 0], [0, -direction]][rotation];
      let p = { ...bedPoint({ x: side === 'right' ? 264 : 96, y }, map, layout), map };
      expect(canStand(p, map, layout), `${map}/${rotation}/${side}/${y} start`).toBe(true);
      for (let step = 0; step < 8; step++) {
        const local = bedLocal(p, layout);
        if (local.x >= 150 && local.x <= 210) break;
        p = { ...moveInRoom(p, dx, dy, 14, map, layout), map };
        expect(canStand(p, map, layout)).toBe(true);
      }
      const local = bedLocal(p, layout), bed = getRoomObjects(map, layout).find(object => object.id === 'bed')!;
      expect(local.x, `${map}/${rotation}/${side}/${y} reached mattress`).toBeGreaterThanOrEqual(150);
      expect(local.x).toBeLessThanOrEqual(210); expect(local.y).toBeGreaterThanOrEqual(y);
      if (y === 292) expect(local.y).toBeGreaterThan(298); // Entry movement, not sleep, guides feet down the funnel.
      expect(inBedEntry(p, layout)).toBe(true); expect(canInteract(p, bed, layout)).toBe(true);
    }
  });
});

it('moves the ledger onto the nightstand without moving or replacing either container', async () => {
  const { authority, at, act, host } = household();
  authority.world.containers = { 'castle:desk:left': { 'welcome-letter': 1 }, 'castle:side-table': { 'cacao-bean': 5 } };
  const contents = structuredClone(authority.world.containers), layout: RoomLayout = { journal: { x: -103, y: 165 } };
  await act(host, { kind: 'save-layout', map: 'castle', layout, expected: {} });
  const objects = getRoomObjects('castle', authority.world.layout), ledger = objects.find(object => object.id === 'journal')!, nightstand = objects.find(object => object.id === 'side-table')!;
  expect(ledger.bounds).toEqual({ x: 279, y: 396, width: 18, height: 14 });
  expect(ledger.depth).toBe(nightstand.depth + 1); expect(ledger.anchor).toEqual({ x: 288, y: 446 });
  at(host, 'castle', 288, 450); await act(host, { kind: 'interact', target: 'journal' });
  expect(authority.world.players[host].interaction).toBeNull(); expect(authority.world.containers).toEqual(contents);
  await act(host, { kind: 'interact', target: 'side-table' });
  expect(authority.world.players[host].interaction).toBe('side-table');
  await expect(act(host, { kind: 'read-letter' })).rejects.toThrow('drawer containing');
  expect(getRoomObjects('castle', { ...layout, desk: { x: 16, y: 0 } }).find(object => object.id === 'journal')!.bounds).toEqual(ledger.bounds);
  const restored = parseWorld(JSON.parse(JSON.stringify(authority.world)));
  expect(restored.layout).toEqual(layout); expect(restored.containers).toEqual(contents);
});
