import './style.css';
import { BUILD_VERSION, CharacterLookSchema, createPlayer, createWorld, type Player, type Slot, type World } from '../game/model';
import { BODY_OPTIONS, HAIR_STYLE_OPTIONS, HAIR_COLOR_OPTIONS, SKIN_TONE_OPTIONS, OUTFIT_OPTIONS, DEFAULT_LOOK, type CharacterLook } from '../game/art/character-look';
import { Authority, type Intent } from '../game/authority';
import { arrival, validateContent, type ArrivalId } from '../content/arrival';
import { canArrangeRoom, getRoomObjects, inBedEntry, roomFlag, roomLayout, roomOwner, nearestInteractable } from '../content/room';
import { db, parseBackup } from '../persistence/database';
import { acquireWorldLock } from '../persistence/lock';
import { OfflinePackage } from '../pwa/offline';
import { WebRTCTransport, decodePairing, encodePairing } from '../networking/webrtc';
import { GuestSession, HostSession } from '../networking/session';
import { scanPairing, showPairingQR } from '../ui/pairing';
import { mountTouchControls, type TouchControls } from '../ui/touch-controls';
import { ROOM_MATERIAL_IMAGE } from '../game/art/room-atlas';
import { clockLabel, dayPhase, fatigueMessage, SLEEP_RULES } from '../game/time';

import { LayoutDesigner } from '../ui/layout-designer';
import { RoomPresentation } from '../game/presentation';
import { HouseholdAudio } from '../audio/household-audio';

validateContent();
const roomPresentation = new RoomPresentation();
const sound = new HouseholdAudio();
let arranging: LayoutDesigner | undefined;
let bedEntryLatched = false;
let lastFootstep = 0;
let dawnUntil = 0;
let dawnTimer: ReturnType<typeof setTimeout> | undefined;
document.addEventListener('pointerdown', () => { void sound.unlock().catch(() => undefined); }, { capture: true });
// WebKit may grant audio activation only when the tap completes.
document.addEventListener('click', () => { void sound.unlock().catch(() => undefined); }, { capture: true });
document.addEventListener('keydown', () => { void sound.unlock().catch(() => undefined); }, { capture: true });
const app = document.querySelector<HTMLElement>('#app')!;
const toastElement = document.querySelector<HTMLElement>('#toast')!;
const portraitGuard = document.querySelector<HTMLDialogElement>('#rotate')!;
const portraitMedia = matchMedia('(orientation: portrait)');
let slot: Slot = 1;
let world: World | undefined;
let localId = '';
let authority: Authority | undefined;
let hostSession: HostSession | undefined;
let guestSession: GuestSession | undefined;
let transport: WebRTCTransport | undefined;
let releaseLock: (() => void) | undefined;
let destroyScene: (() => void) | undefined;
let sequence = 0;
let modal: HTMLDialogElement | undefined;
let modalCleanup: (() => void) | undefined;
type DialogKind = 'menu' | 'object' | 'conversation';
let modalKind: DialogKind = 'menu';
let moving = false;
let interacting = false;
let exiting = false;
let touchControls: TouchControls | undefined;
let playGeneration = 0;
let menuRefresh: (() => void) | undefined;
type InventoryTab = 'items' | 'missions' | 'journal' | 'household' | 'session';
interface QuickSettings { slots: (string | null)[]; selected: number; seen: string }
const QUICK_SLOT_COUNT = 7;
let quickSettings: QuickSettings = { slots: Array(QUICK_SLOT_COUNT).fill(null), selected: 0, seen: '' };
let settingsQueue = Promise.resolve();
let clockTimer: ReturnType<typeof setInterval> | undefined;
let clockLastTime = performance.now();
let advancingClock = false;
let toastTimer: ReturnType<typeof setTimeout>;
const offline = new OfflinePackage(refreshOffline);
const escape = (text: string) => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
function toast(text: string) { toastElement.textContent = text; toastElement.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastElement.classList.remove('visible'), 5500); }
function fail(error: unknown) { toast(error instanceof Error ? error.message : 'Something went wrong. Your last saved progress is kept.'); }
function on(id: string, action: () => unknown) {
  document.getElementById(id)?.addEventListener('click', () => { Promise.resolve().then(action).catch(fail); });
}
function updateOrientation() {
  if (portraitMedia.matches) {
    touchControls?.stop(); arranging?.cancelDrag(); clockLastTime = performance.now();
    // Reopening puts the guard above a creation or inventory dialog in the top layer.
    if (portraitGuard.open) portraitGuard.close();
    portraitGuard.showModal();
  } else if (portraitGuard.open) portraitGuard.close();
}
portraitGuard.addEventListener('cancel', event => event.preventDefault());
portraitMedia.addEventListener('change', updateOrientation);
function disposeModal() {
  touchControls?.stop(); menuRefresh = undefined; modalCleanup?.(); modalCleanup = undefined;
  const actions = document.getElementById('game-actions');
  if (actions) document.querySelector('.play-screen')?.append(actions);
  modal?.close(); modal?.remove(); modal = undefined; modalKind = 'menu'; refreshActionButtons();
}
async function closeModal(reason: 'back' | 'authored-exit' = 'back') {
  if (interacting) return;
  if (modalKind === 'conversation' && reason !== 'authored-exit') return;
  if (world?.players[localId]?.interaction) {
    interacting = true; refreshActionButtons();
    try {
      const target = world!.players[localId].interaction!;
      disposeModal();
      await dispatch({ kind: 'close-interaction' });
      if (!Object.values(world!.players).some(p => p.map === world!.players[localId].map && p.interaction === target)) await roomPresentation.wait(target, false);
    }
    finally { interacting = false; refreshActionButtons(); }
  } else disposeModal();
}
function dialog(title: string, body: string, kind: DialogKind = 'menu') {
  disposeModal(); modalKind = kind;
  modal = document.createElement('dialog'); modal.className = `panel-dialog${world ? ' in-game-dialog' : ''}`;
  modal.dataset.dialogKind = kind;
  modal.innerHTML = `<div class="dialog-head"><h2>${title}</h2>${kind === 'conversation' ? '' : '<button id="close-dialog" class="icon-button" aria-label="Close dialog">×</button>'}</div>${body}`;
  app.append(modal); modal.showModal(); on('close-dialog', closeModal);
  const actions = document.getElementById('game-actions'); if (actions) modal.append(actions);
  modal.addEventListener('cancel', event => { event.preventDefault(); void closeModal().catch(fail); });
  refreshActionButtons(); updateOrientation();
  return modal;
}
function refreshOffline() {
  const label = document.getElementById('offline-label'); if (label) { label.textContent = offline.label; label.classList.toggle('sr-only', offline.ready); }
  const details = document.getElementById('offline-details'); if (details) details.textContent = offline.label;
  const action = document.getElementById('offline-install'); if (action) action.hidden = offline.ready;
  const update = document.getElementById('apply-update'); if (update) update.hidden = !offline.updateReady;
}
async function title() {
  playGeneration += 1; arranging = undefined; bedEntryLatched = false; sound.suspend();
  sound.setScene({ map: 'castle', night: true, hearth: false });
  clearInterval(clockTimer); clockTimer = undefined; clockLastTime = performance.now();
  touchControls?.destroy(); touchControls = undefined;
  disposeModal();
  hostSession?.close(); guestSession?.close(); transport?.close();
  hostSession = undefined; guestSession = undefined; transport = undefined;
  destroyScene?.(); destroyScene = undefined; releaseLock?.(); releaseLock = undefined;
  authority = undefined; world = undefined;
  const records = await Promise.all(([1, 2] as Slot[]).map(id => db.load(id)));
  app.innerHTML = `<section class="title-screen">
    <div class="title-art" aria-hidden="true"><canvas id="title-materials" width="640" height="400"></canvas></div>
    <div class="title-copy"><h1>Haunted<br>Chocolatier<span>TWILIGHT</span></h1></div>
    <div class="menu-panel"><div class="menu-heading"><p>Select game</p></div>
    <div class="slots" role="group" aria-label="World save slots">${records.map((record, index) => `<button class="slot ${slot === index + 1 ? 'selected' : ''}" id="slot-${index + 1}" aria-pressed="${slot === index + 1}"><span class="slot-number">0${index + 1}</span><span><b>World Save Slot ${index + 1}</b><small>${record ? `${escape(record.world.players[record.world.hostId].name)} · The castle` : 'A new beginning'}</small></span><span class="slot-mark">${record ? '◈' : '+'}</span></button>`).join('')}</div>
    <button id="solo" class="primary">${records[slot - 1] ? 'Continue / Single Player' : 'Single Player'}<span>→</span></button>
    <div class="coop-buttons"><button id="host">Host Co-op</button><button id="join">Join Co-op</button></div>
    <div class="menu-links"><button id="backups">Backups</button><span>·</span><button id="settings">Settings & help</button></div>
    </div>
    <footer><div class="offline"><span id="offline-label"></span><button id="offline-install">Make Available Offline</button><button id="apply-update" hidden>Update ready · restart</button></div></footer>
  </section>`;
  on('slot-1', () => { slot = 1; return title(); }); on('slot-2', () => { slot = 2; return title(); });
  on('solo', () => begin(false)); on('host', () => begin(true)); on('join', joinDialog);
  on('backups', backupDialog); on('settings', settingsDialog);
  on('offline-install', () => offline.install()); on('apply-update', () => offline.applyUpdate()); refreshOffline();
  void paintTitleMaterials(document.getElementById('title-materials') as HTMLCanvasElement).catch(fail);
}
async function paintTitleMaterials(canvas: HTMLCanvasElement) {
  const source = new Image(); source.src = ROOM_MATERIAL_IMAGE; await source.decode();
  if (!canvas.isConnected) return;
  const floor = document.createElement('canvas'), wall = document.createElement('canvas');
  floor.width = floor.height = 64; wall.width = 64; wall.height = 68;
  const floorContext = floor.getContext('2d')!, wallContext = wall.getContext('2d')!, context = canvas.getContext('2d')!;
  floorContext.imageSmoothingEnabled = wallContext.imageSmoothingEnabled = context.imageSmoothingEnabled = false;
  floorContext.drawImage(source, 0, 0, 887, 887, 0, 0, 64, 64);
  wallContext.drawImage(source, 887, 0, 887, 812, 0, 0, 64, 68);
  for (let x = 0; x < 640; x += 128) {
    context.drawImage(wall, x, 0, 128, 136);
    for (let y = 144; y < 400; y += 128) context.drawImage(floor, x, y, 128, 128);
  }
  context.fillStyle = '#2e262a'; context.fillRect(0, 132, 640, 12); context.fillStyle = '#8c6243'; context.fillRect(0, 132, 640, 2);
  context.fillStyle = '#271f32'; context.fillRect(28, 192, 296, 164); context.fillStyle = '#75535a'; context.fillRect(32, 196, 288, 156);
  context.fillStyle = '#bb967b'; context.fillRect(39, 203, 274, 142); context.fillStyle = '#52313e'; context.fillRect(42, 206, 268, 136);
}
async function begin(hosting: boolean) {
  const record = await db.load(slot);
  if (record) { await enterHost(record.world); if (hosting) await hostDialog(); return; }
  const panel = dialog('Create resident', `<form id="new-resident">${characterFields('player-name', 'Keeper')}<button class="primary character-submit" type="submit">Enter the castle<span>→</span></button></form>`);
  panel.classList.add('character-dialog'); void prepareResidentPreview(panel).catch(fail);
  document.getElementById('new-resident')!.addEventListener('submit', event => {
    event.preventDefault();
    void (async () => {
      const name = (document.getElementById('player-name') as HTMLInputElement).value.trim();
      const appearance = (document.getElementById('appearance') as HTMLSelectElement).value as Player['appearance'];
      const created = createWorld(createPlayer(name, appearance, undefined, readCharacterLook(panel)));
      await db.save(slot, created, { create: true });
      await enterHost(created); if (hosting) await hostDialog();
    })().catch(fail);
  });
}
function characterFields(id: string, name: string) {
  const choice = (key: keyof CharacterLook, label: string, options: readonly string[]) => `<label>${label}<select aria-label="${label}" data-look="${key}">${options.map(value => `<option value="${value}" ${DEFAULT_LOOK[key] === value ? 'selected' : ''}>${value[0].toUpperCase() + value.slice(1)}</option>`).join('')}</select></label>`;
  return `<div class="character-layout"><div class="resident-preview-frame"><canvas id="resident-preview" width="128" height="144" aria-label="Your resident appearance"></canvas></div><div class="character-fields"><label>Your name<input id="${id}" name="playerName" maxlength="24" required autocomplete="off" value="${name}" /></label>${choice('body', 'Character', BODY_OPTIONS)}${choice('outfit', 'Outfit', OUTFIT_OPTIONS)}${appearanceField()}${choice('hairStyle', 'Hair style', HAIR_STYLE_OPTIONS)}${choice('hairColor', 'Hair color', HAIR_COLOR_OPTIONS)}${choice('skinTone', 'Skin tone', SKIN_TONE_OPTIONS)}</div></div>`;
}
function readCharacterLook(panel: HTMLDialogElement): CharacterLook {
  return CharacterLookSchema.parse(Object.fromEntries([...panel.querySelectorAll<HTMLSelectElement>('select[data-look]')].map(select => [select.dataset.look, select.value])));
}
async function prepareResidentPreview(panel: HTMLDialogElement) {
  const select = panel.querySelector<HTMLSelectElement>('#appearance')!;
  const preview: { current?: Awaited<ReturnType<typeof import('../ui/resident-preview').mountResidentPreview>> } = {};
  let disposed = false;
  // Choices work immediately, including while the preview chunk is still loading.
  select.addEventListener('change', () => preview.current?.setAppearance(select.value as Player['appearance']));
  const chosen = new Set<string>();
  panel.querySelectorAll<HTMLSelectElement>('select[data-look]').forEach(field => field.addEventListener('change', () => {
    const key = field.dataset.look!;
    if (key === 'body') {
      const preset = field.value === 'female' ? { hairStyle: 'long', outfit: 'skirt' } : { hairStyle: 'short', outfit: 'coat' };
      for (const [name, value] of Object.entries(preset)) if (!chosen.has(name)) panel.querySelector<HTMLSelectElement>(`select[data-look="${name}"]`)!.value = value;
    } else chosen.add(key);
    preview.current?.setLook(readCharacterLook(panel));
  }));
  const previousCleanup = modalCleanup;
  modalCleanup = () => { disposed = true; previousCleanup?.(); preview.current?.destroy(); };
  const { mountResidentPreview } = await import('../ui/resident-preview');
  if (disposed || modal !== panel) return;
  const ready = await mountResidentPreview(panel.querySelector<HTMLCanvasElement>('#resident-preview')!, select.value as Player['appearance'], readCharacterLook(panel));
  if (disposed || modal !== panel) { ready.destroy(); return; }
  preview.current = ready;
  ready.setAppearance(select.value as Player['appearance']);
  ready.setLook(readCharacterLook(panel));
}
function appearanceField() { return '<label>Clothing color<select id="appearance"><option value="amber">Hearth amber</option><option value="moss">Woodland moss</option><option value="violet">Evening violet</option><option value="navy">Midnight navy</option><option value="wine">Berry wine</option><option value="cream">Warm cream</option></select></label>'; }
async function enterHost(saved: World) {
  const release = await acquireWorldLock(saved.worldId);
  releaseLock?.(); releaseLock = release;
  world = saved; localId = saved.hostId; sequence = saved.lastSequence[localId] ?? 0;
  authority = new Authority(saved, state => db.save(slot, state));
  authority.subscribe(state => { const previous = world; world = state; updateHud(); sharedPresentation(previous, state); });
  try { await authority.prepareRoom(); await play(); }
  catch (error) { await title(); throw error; }
}
function sharedPresentation(previous: World | undefined, next: World) {
  const oldPlayer = previous?.players[localId], currentPlayer = next.players[localId];
  if (oldPlayer && currentPlayer) {
    const fireId = currentPlayer.map === 'kitchen' ? 'stove' : 'hearth';
    if (oldPlayer.map === currentPlayer.map && roomFlag(previous!, oldPlayer.map, fireId) !== roomFlag(next, currentPlayer.map, fireId)) sound.cue(roomFlag(next, currentPlayer.map, fireId) ? 'ignite' : 'extinguish');
    if (oldPlayer.map !== currentPlayer.map) sound.cue('door');
    else if (Math.hypot(oldPlayer.x - currentPlayer.x, oldPlayer.y - currentPlayer.y) > 1 && !currentPlayer.fatigue.sleeping && performance.now() - lastFootstep > 250) { sound.cue('step'); lastFootstep = performance.now(); }
    if (oldPlayer.fatigue.sleeping !== currentPlayer.fatigue.sleeping) sound.cue(currentPlayer.fatigue.sleeping ? 'sleep' : 'wake');
    for (const id of ['candle-desk', 'candle-table']) if (oldPlayer.map === currentPlayer.map && roomFlag(previous!, oldPlayer.map, id, true) !== roomFlag(next, currentPlayer.map, id, true)) sound.cue(roomFlag(next, currentPlayer.map, id, true) ? 'ignite' : 'extinguish');
    const activeIds = [next.hostId, ...(guestSession || hostSession?.guestId ? [next.guestId!] : [])];
    if (activeIds.some(id => previous?.players[id]?.map === currentPlayer.map && next.players[id]?.map === currentPlayer.map && next.players[id].bedDisturbances > previous.players[id].bedDisturbances)) sound.cue('disturbed');
    for (const target of ['chest', 'pantry', 'desk']) {
      const was = activeIds.some(id => previous?.players[id]?.map === currentPlayer.map && previous?.players[id]?.interaction === target);
      const is = activeIds.some(id => next.players[id]?.map === currentPlayer.map && next.players[id]?.interaction === target);
      if (was !== is) sound.cue(is ? 'open' : 'close');
    }
    if (next.clock.totalMinutes - previous!.clock.totalMinutes > 30 && activeIds.every(id => previous!.players[id]?.fatigue.sleeping)) {
      dawnUntil = performance.now() + 1200; clearTimeout(dawnTimer);
      dawnTimer = setTimeout(updateHud, 1250); updateHud();
    }
  }
  const before = previous?.players[localId]?.fatigue, player = next.players[localId];
  if (before && player) {
    const fatigue = player.fatigue;
    const critical = SLEEP_RULES.terminalMinutes * .75;
    if (fatigue.consecutiveAllNighters > before.consecutiveAllNighters || fatigue.consecutiveAllNighters >= 5 && before.terminalMinutes < critical && fatigue.terminalMinutes >= critical) {
      const message = fatigueMessage(player); if (message) toast(message);
    }
  }
}
async function dispatch(intent: Intent) {
  if (guestSession) await guestSession.dispatch(intent);
  else if (authority) { await authority.dispatch(localId, ++sequence, intent); hostSession?.publish(intent.kind === 'move'); }
}
function move(dx: number, dy: number) {
  if (moving || controlsBlocked()) return;
  moving = true;
  document.getElementById('game-canvas')?.setAttribute('data-movement-pending', 'true');
  void dispatch({ kind: 'move', dx, dy }).then(() => {
    const entered = inBedEntry(world!.players[localId], roomLayout(world!, world!.players[localId].map));
    if (entered && !bedEntryLatched) { bedEntryLatched = true; sleepPrompt(); }
    if (!entered) bedEntryLatched = false;
  }).catch(fail).finally(() => {
    moving = false;
    document.getElementById('game-canvas')?.setAttribute('data-movement-pending', 'false');
  });
}
function controlsBlocked() { return !!modal || !!arranging || portraitMedia.matches || interacting || exiting || document.hidden || performance.now() < dawnUntil || !!world?.players[localId]?.fatigue.sleeping; }
async function interact() {
  if (!world || controlsBlocked()) return;
  touchControls?.stop();
  const nearest = nearestInteractable(world.players[localId], roomLayout(world, world.players[localId].map));
  if (nearest) await performInteraction(nearest.actions[0]);
}
function sleepPrompt() {
  const panel = dialog('Rest until morning?', '<div class="button-row"><button id="confirm-sleep" data-primary="true">A · Sleep until 06:00</button><button id="cancel-sleep">B · Stay awake</button></div>', 'object');
  panel.classList.add('story-dialog', 'sleep-prompt');
  on('cancel-sleep', closeModal);
  on('confirm-sleep', async () => { interacting = true; refreshActionButtons(); try { await dispatch({ kind: 'sleep' }); disposeModal(); } finally { interacting = false; refreshActionButtons(); } });
}
async function performInteraction(target: ArrivalId) {
  if (interacting || exiting) return;
  if (target === 'bed') { sleepPrompt(); return; }
  if (['window-west', 'window-east', 'plant', 'side-table'].includes(target)) return;
  interacting = true; touchControls?.stop(); refreshActionButtons();
  try {
    await dispatch({ kind: 'interact', target });
    if (target.startsWith('door-') || target === 'hearth' || target.startsWith('candle-') || target === 'stove' || target === 'sink' || target === 'sofa' || target === 'armchair') return;
    if (target === 'journal') { sound.cue('paper'); dailyJournal(); return; }
    if (target === 'chest' || target === 'pantry' || target === 'desk') await roomPresentation.wait(target, true);
    if (target === 'chest' || target === 'pantry') { chestDialog(target); return; }
    if (target === 'desk') { sound.cue('paper'); dailyJournal(); return; }
    if (target === 'bookshelf' || target === 'worktop') { sound.cue('paper'); recipeBook(); return; }
    if (target === 'letter') {
      sound.cue('paper');
      const entry = arrival.find(event => event.id === target)!;
      const panel = dialog(entry.title, '<p class="story-text">' + escape(entry.text) + '</p><button id="finish-story" class="story-continue" data-primary="true"><kbd>A</kbd>Close letter</button>', 'object');
      panel.classList.add('story-dialog'); on('finish-story', closeModal);
    }
  } finally { interacting = false; refreshActionButtons(); }
}
function refreshArrangement() {
  const bar = document.getElementById('arrange-bar');
  if (!bar || !arranging) return;
  const label = getRoomObjects(arranging.map).find(o => o.id === arranging!.selected)?.label;
  bar.querySelector('strong')!.textContent = label ?? 'Arrange room';
  const save = document.getElementById('save-layout') as HTMLButtonElement;
  save.disabled = interacting || !arranging.dirty || arranging.invalid;
  bar.dataset.invalid = String(arranging.invalid);
}
function endArrangement() {
  arranging = undefined; touchControls?.stop(); document.getElementById('arrange-bar')?.remove();
  document.querySelector('.play-screen')?.classList.remove('designing');
}
function arrangeRoom() {
  const map = world!.players[localId].map;
  if (!canArrangeRoom(world!, localId, map) || world!.players[localId].seated) return;
  disposeModal(); touchControls?.stop();
  arranging = new LayoutDesigner(map, () => world!, refreshArrangement);
  document.querySelector('.play-screen')?.classList.add('designing');
  const bar = document.createElement('div'); bar.id = 'arrange-bar';
  bar.innerHTML = '<button id="cancel-layout">Cancel</button><div><strong>Arrange room</strong><small>Drag to move · Tap to rotate</small></div><button id="save-layout" class="primary" disabled>Save layout</button>';
  document.querySelector('.play-screen')!.append(bar);
  on('cancel-layout', endArrangement);
  on('save-layout', saveArrangement); refreshArrangement();
}
async function saveArrangement() {
  if (!arranging || interacting || !arranging.dirty || arranging.invalid) return;
  const draft = arranging;
  interacting = true; refreshArrangement();
  try {
    await dispatch({ kind: 'save-layout', map: draft.map, layout: structuredClone(draft.layout), expected: draft.expected });
    sound.cue('place'); endArrangement();
  } finally { interacting = false; refreshArrangement(); refreshActionButtons(); }
}
function recipeBook() {
  const recipes = world!.players[localId].recipes;
  const panel = dialog('Your recipe book', recipes.length ? '<ul class="recipe-list">' + recipes.map(id => `<li>${escape(itemName(id))}</li>`).join('') + '</ul>' : '<p>No recipes recorded yet.</p>', 'object');
  panel.classList.add('recipe-dialog');
}
function dailyJournal() {
  const report = world!.dayReports.at(-1), personal = report?.players[localId];
  const body = report ? `<p class="muted">Day ${report.day + 1} · recorded at dawn</p><div class="daily-columns"><section><h3>Our household</h3>${report.shared.length ? report.shared.map(kind => `<p>${escape(arrival.find(event => event.id === kind)?.title ?? 'A change in the household')}</p>`).join('') : '<p>No shared milestones recorded.</p>'}</section><section><h3>Your day</h3>${personal ? `<p>${personal.rested ? 'You rested until morning.' : 'You were awake when dawn arrived.'}</p><p>At dawn: ${personal.discoveries} discoveries, ${personal.recipes} known recipes, ${personal.completedQuests} completed personal quests.</p>` : '<p>Your record begins with your first morning here.</p>'}</section></div>` : '<p>The first entry will be ready after dawn. Each page keeps the household\'s shared milestones and your own record.</p>';
  const panel = dialog('Yesterday at the castle', body + '<button id="finish-story" data-primary="true">A · Close journal</button>', 'object');
  panel.classList.add('story-dialog', 'daily-journal'); on('finish-story', closeModal);
}
async function leaveGame() {
  if (exiting) return;
  exiting = true; endArrangement(); touchControls?.stop();
  const leave = document.getElementById('leave') as HTMLButtonElement | null;
  if (leave) { leave.disabled = true; leave.setAttribute('aria-label', 'Finishing save'); }
  try {
    if (!guestSession) hostSession?.close();
    await settingsQueue;
    if (guestSession) await guestSession.flush();
    else { await hostSession?.flush(); await authority?.flush(); }
    await title();
  } catch (error) {
    if (guestSession) {
      // Unacknowledged guest work cannot be called saved. Keep the existing
      // recovery mirror, release the broken session and allow a fresh join.
      await title();
      toast('The last action could not be confirmed. Your saved recovery copy is kept. Rejoin for the host’s latest progress.');
    } else throw error;
  } finally { exiting = false; if (leave) { leave.disabled = false; leave.setAttribute('aria-label', 'Save and return to title'); } }
}
async function play() {
  disposeModal();
  touchControls?.destroy();
  const generation = ++playGeneration;
  const savedQuick = (await db.settings.get(quickSettingsKey()))?.value as Partial<QuickSettings> | undefined;
  quickSettings = { slots: Array.from({ length: QUICK_SLOT_COUNT }, (_, index) => typeof savedQuick?.slots?.[index] === 'string' ? savedQuick.slots[index] : null),
    selected: Number.isInteger(savedQuick?.selected) && savedQuick!.selected! >= 0 && savedQuick!.selected! < QUICK_SLOT_COUNT ? savedQuick!.selected! : 0,
    seen: typeof savedQuick?.seen === 'string' ? savedQuick.seen : '' };
  if (generation !== playGeneration) return;
  app.innerHTML = `<section class="play-screen"><div id="game-canvas" data-movement-pending="false" aria-label="Castle arrival hall"></div>
    <div id="touch-surface" aria-label="Drag the left side to move"><div id="thumbstick" hidden aria-hidden="true"><div id="thumbstick-knob"></div></div></div>
    <span id="resident-label" class="sr-only"></span><span id="save-state" class="sr-only" aria-live="polite"></span>
    <header class="game-hud"><div class="hud-clock" aria-label="World time"><span class="clock-moon" aria-hidden="true">☾</span><time id="game-clock">18:00</time></div><button id="inventory-toggle" class="hud-button" aria-label="Inventory and missions"><span>I</span><span id="notification-dot" hidden aria-label="New mission or discovery"></span></button><button id="leave" class="hud-button" aria-label="Save and return to title"><span>ESC</span></button></header>
    <div class="quickbar" role="group" aria-label="Quick slots">${Array.from({ length: QUICK_SLOT_COUNT }, (_, index) => `<button id="quick-slot-${index + 1}" class="quick-slot" aria-label="Quick slot ${index + 1}"><span class="slot-key">${index + 1}</span><span class="quick-item"></span><span class="quick-count"></span></button>`).join('')}</div>
    <div id="night-transition" hidden aria-hidden="true"><span>☾</span></div>
    <div id="sleep-overlay" hidden role="status"><span id="sleep-label"></span><small>B · Wake up</small></div>
    <div id="game-actions" class="game-actions"><button id="action-b" class="action-key" aria-label="Back"><span>B</span></button><button id="action-a" class="action-key" aria-label="Interact"><span>A</span></button></div></section>`;
  on('inventory-toggle', () => inventory(quickSettings.seen !== notificationState() ? 'missions' : 'items'));
  on('leave', leaveGame); on('action-a', primaryAction); on('action-b', backAction);
  for (let index = 0; index < QUICK_SLOT_COUNT; index++) on(`quick-slot-${index + 1}`, () => selectQuickSlot(index));
  touchControls = mountTouchControls(document.getElementById('touch-surface')!, move, controlsBlocked);
  updateHud();
  const { mountArrival } = await import('../game/scenes/arrival-scene');
  if (generation !== playGeneration) return;
  destroyScene?.();
  destroyScene = await mountArrival(document.getElementById('game-canvas')!, () => ({ world: world!, localId,
    activeIds: guestSession ? [world!.hostId, localId] : [localId, ...(hostSession?.guestId ? [hostSession.guestId] : [])], design: arranging?.state }), move, () => { void primaryAction().catch(fail); }, controlsBlocked, roomPresentation, {
      select: id => { if (!interacting && !portraitMedia.matches) arranging?.select(id); },
      drag: (id, dx, dy) => { if (!interacting && !portraitMedia.matches) arranging?.drag(id, dx, dy); },
      drop: id => arranging?.drop(id), rotate: id => { if (!interacting && !portraitMedia.matches) arranging?.rotate(id); },
      cancelDrag: () => arranging?.cancelDrag(),
    });
  updateHud();
  startClock();
}
function startClock() {
  clearInterval(clockTimer); clockLastTime = performance.now();
  if (!authority) return;
  const currentAuthority = authority;
  let sleepPresentationKey = '', sleepPresentationAt = 0;
  clockTimer = setInterval(() => {
    const now = performance.now(), elapsed = (now - clockLastTime) / 1000; clockLastTime = now;
    if (!world || document.hidden || exiting || advancingClock || authority !== currentAuthority) return;
    const activeIds = [world.hostId, ...(hostSession?.guestId ? [hostSession.guestId] : [])];
    const sleepers = activeIds.map(id => world!.players[id]);
    const sleepKey = sleepers.every(player => player.fatigue.sleeping) ? sleepers.map(player => `${player.id}:${player.fatigue.sleepStartedAt}`).join('|') : '';
    if (sleepKey !== sleepPresentationKey) { sleepPresentationKey = sleepKey; sleepPresentationAt = now; }
    // Let the resident settle beneath the quilt before the host advances to wake-up.
    // This is a brief presentation pause, not a second world clock or sleep duration.
    if (sleepKey && now - sleepPresentationAt < 850) return;
    advancingClock = true;
    void currentAuthority.advanceTime(elapsed <= 2 ? elapsed : 0, { activeIds, paused: activeIds.length === 1 && (!!modal || !!arranging || portraitMedia.matches) }).then(changed => {
      if (changed) hostSession?.publish(true);
    }).catch(fail).finally(() => { advancingClock = false; });
  }, 1000);
}
async function primaryAction() {
  if (interacting || exiting || portraitMedia.matches || arranging || world?.players[localId]?.fatigue.sleeping) return;
  if (world?.players[localId]?.seated && !modal) { await dispatch({ kind: 'stand' }); return; }
  if (modal) {
    const choices = modal.querySelectorAll<HTMLButtonElement>('[data-primary="true"]');
    if (choices.length === 1) choices[0].click();
  } else await interact();
}
async function backAction() {
  if (interacting || exiting || portraitMedia.matches) return;
  if (arranging) { endArrangement(); return; }
  if (world?.players[localId]?.fatigue.sleeping) {
    interacting = true; refreshActionButtons();
    try { await dispatch({ kind: 'wake' }); }
    finally { interacting = false; refreshActionButtons(); }
    return;
  }
  if (modal) await closeModal();
  else if (world?.players[localId]?.seated) await dispatch({ kind: 'stand' });
}
function refreshActionButtons() {
  const a = document.getElementById('action-a') as HTMLButtonElement | null;
  const b = document.getElementById('action-b') as HTMLButtonElement | null;
  const sleeping = !!world?.players[localId]?.fatigue.sleeping;
  const seated = !!world?.players[localId]?.seated;
  const inventoryButton = document.getElementById('inventory-toggle') as HTMLButtonElement | null;
  if (inventoryButton) inventoryButton.disabled = interacting || exiting || sleeping || performance.now() < dawnUntil;
  if (a) { a.disabled = interacting || exiting || sleeping || !!modal && modal.querySelectorAll('[data-primary="true"]').length !== 1; a.setAttribute('aria-label', modal ? 'Continue' : seated ? 'Stand up' : 'Interact'); }
  if (b) { b.disabled = interacting || exiting || !!modal && modalKind === 'conversation'; b.setAttribute('aria-label', sleeping ? 'Wake up' : !modal && seated ? 'Stand up' : 'Back'); }
}
function updateHud() {
  if (!world) return;
  const label = document.getElementById('resident-label');
  if (label) label.textContent = `${world.players[localId].name} · ${guestSession ? 'Player 2' : 'Player 1'}`;
  const saved = document.getElementById('save-state');
  if (saved) saved.textContent = guestSession ? guestSession.connected ? 'Host saved · recovery copy on this device' : 'Disconnected · waiting for host' : 'Saved on this device';
  const clock = document.getElementById('game-clock');
  if (clock) clock.textContent = clockLabel(world.clock.totalMinutes);
  const phase = dayPhase(world.clock.totalMinutes), sky = document.querySelector('.clock-moon');
  if (sky) { sky.textContent = phase === 'day' || phase === 'dawn' ? '☀' : '☾'; sky.setAttribute('title', phase); }
  const badge = document.getElementById('notification-dot');
  if (badge) badge.hidden = quickSettings.seen === notificationState();
  document.getElementById('inventory-toggle')?.setAttribute('aria-label', `Inventory and missions${badge && !badge.hidden ? ', new updates' : ''}`);
  const player = world.players[localId], sleepOverlay = document.getElementById('sleep-overlay');
  sound.setScene({ map: player.map, night: phase === 'night' || phase === 'late-night', hearth: roomFlag(world, player.map, player.map === 'kitchen' ? 'stove' : 'hearth') });
  const activeIds = [world.hostId, ...(guestSession || hostSession?.guestId ? [world.guestId!] : [])];
  const allSleeping = activeIds.every(id => world!.players[id]?.fatigue.sleeping);
  const transition = document.getElementById('night-transition');
  if (transition) { transition.hidden = !allSleeping && performance.now() >= dawnUntil; transition.classList.toggle('dawn', !allSleeping); }
  if (sleepOverlay) {
    sleepOverlay.hidden = !player.fatigue.sleeping;
    if (player.fatigue.sleeping) {
      touchControls?.stop();
      document.getElementById('sleep-label')!.textContent = allSleeping ? 'The castle rests until morning' : `Asleep until ${clockLabel(player.fatigue.wakeAt ?? world.clock.totalMinutes)}`;
    }
  }
  const inventoryButton = document.getElementById('inventory-toggle') as HTMLButtonElement | null;
  if (inventoryButton) inventoryButton.disabled = player.fatigue.sleeping;
  for (let index = 0; index < QUICK_SLOT_COUNT; index++) {
    const button = document.getElementById(`quick-slot-${index + 1}`); if (!button) continue;
    const item = quickSettings.slots[index], count = item ? world.players[localId].inventory[item] ?? 0 : 0;
    button.setAttribute('aria-pressed', String(quickSettings.selected === index));
    button.setAttribute('aria-label', `Quick slot ${index + 1}${item ? `: ${itemName(item)}, ${count}` : ': empty'}`);
    button.querySelector('.quick-item')!.innerHTML = item ? itemIcon(item) : '';
    button.querySelector('.quick-count')!.textContent = count ? String(count) : '';
    button.classList.toggle('unavailable', !!item && !count);
  }
  menuRefresh?.();
  refreshArrangement();
  refreshActionButtons();
}
function quickSettingsKey() { return `quickSlots:${world!.worldId}:${localId}`; }
function saveQuickSettings() {
  const key = quickSettingsKey(), value = structuredClone(quickSettings);
  settingsQueue = settingsQueue.catch(() => undefined).then(async () => { await db.settings.put({ key, value }); });
  void settingsQueue.catch(fail);
}
function notificationState() {
  if (!world) return '';
  const player = world.players[localId];
  return JSON.stringify([player.discoveries, player.quests, world.quests]);
}
function itemName(id: string) { return id === 'cacao-bean' ? 'Cacao bean' : id.replaceAll('-', ' '); }
function itemIcon(id: string) { return id === 'cacao-bean' ? '<span class="cacao-icon" aria-hidden="true"></span>' : '<span class="unknown-item" aria-hidden="true">◇</span>'; }
function selectQuickSlot(index: number) {
  if (!world || exiting || interacting || arranging || portraitMedia.matches || world.players[localId].fatigue.sleeping) return;
  quickSettings.selected = index; saveQuickSettings(); updateHud();
}
function inventory(tab: InventoryTab = 'items') {
  if (!world || exiting || interacting || arranging || portraitMedia.matches || world.players[localId].fatigue.sleeping) return;
  endArrangement();
  if (tab === 'missions' || tab === 'journal') { quickSettings.seen = notificationState(); saveQuickSettings(); }
  const tabs = [['items', 'Satchel'], ['missions', 'Missions'], ['journal', 'Journal'], ['household', 'Household'], ['session', 'Co-op']] as const;
  const panel = dialog('Your satchel', `<nav class="inventory-tabs" aria-label="Satchel sections">${tabs.map(([key, label]) => `<button id="tab-${key}" aria-pressed="${tab === key}">${label}</button>`).join('')}</nav><div id="inventory-content"></div>`);
  panel.classList.add('inventory-dialog');
  for (const [key] of tabs) on(`tab-${key}`, () => inventory(key));
  let previousContents = '';
  const refresh = () => {
    if (!world || modal !== panel) return;
    const player = world.players[localId], contents = panel.querySelector<HTMLElement>('#inventory-content')!;
    const nextContents = JSON.stringify(tab === 'items' ? player.inventory : tab === 'missions' ? [player.discoveries, world.story.flags] :
      tab === 'journal' ? player.discoveries : tab === 'household' ? [world.events, world.story.flags, player.map, player.seated, Object.keys(world.players)] : [guestSession?.connected, hostSession?.guestId]);
    if (nextContents === previousContents) return;
    previousContents = nextContents;
    if (tab === 'items') {
      const owned = Object.entries(player.inventory).filter(([, count]) => count > 0);
      contents.innerHTML = `<p class="muted inventory-intro">Choose an item to inspect it or place it in a quick slot.</p><div class="inventory-grid">${owned.map(([id, count]) => `<button class="inventory-item" data-item="${escape(id)}" aria-label="${escape(itemName(id))}, ${count}">${itemIcon(id)}<span>${escape(itemName(id))}</span><b>×${count}</b></button>`).join('')}${Array.from({ length: Math.max(0, 10 - owned.length) }, () => '<div class="empty-item" aria-hidden="true"></div>').join('')}</div>${owned.length ? '' : '<p class="empty-satchel">Your satchel is empty. Look for the welcome parcel.</p>'}`;
      for (const button of contents.querySelectorAll<HTMLButtonElement>('[data-item]')) button.addEventListener('click', () => itemDetails(button.dataset.item!));
    } else if (tab === 'missions') {
      const steps = [{ done: player.discoveries.includes('letter'), title: 'Read the sealed letter', note: 'Personal · On the writing desk.' },
        { done: world.quests['a-light-for-the-house'] === 'complete', title: 'Light the household hearth', note: 'Shared · Either resident can bring the fire back.' },
        { done: player.discoveries.includes('pantry'), title: 'Open your welcome parcel', note: 'Personal · A parcel waits by the pantry.' }];
      contents.innerHTML = `<h3>A household begins</h3><div class="mission-list">${steps.map(step => `<div class="mission-row ${step.done ? 'complete' : ''}"><span aria-label="${step.done ? 'Complete' : 'Open'}">${step.done ? '✓' : '○'}</span><div><strong>${step.title}</strong><p class="muted">${step.note}</p></div></div>`).join('')}</div>`;
    } else if (tab === 'journal') {
      const letters = player.discoveries.filter(id => id === 'letter' || id === 'pantry');
      contents.innerHTML = `<p class="muted">${escape(player.name)} · Personal journal</p><div class="journal-entries">${letters.length ? letters.map(id => {
        const entry = arrival.find(event => event.id === id);
        return `<details><summary>${escape(entry?.title ?? id)}</summary><p>${escape(entry?.text ?? '')}</p></details>`;
      }).join('') : '<p>The first page is waiting.</p>'}</div>`;
    } else if (tab === 'household') {
      const hearth = getRoomObjects(player.map).some(object => object.id === 'hearth') ? `<p>${roomFlag(world, player.map, 'hearth') ? 'The hearth is burning. Its warmth will remain when another resident arrives.' : 'The hearth is cold.'}</p>` : '';
      contents.innerHTML = `<button id="arrange-room" ${canArrangeRoom(world, localId, player.map) ? '' : 'disabled'}>Arrange room</button>${roomOwner(world, player.map) && roomOwner(world, player.map) !== localId ? '<p class="muted">Only this bedroom’s owner can rearrange its furniture. You may use everything here.</p>' : ''}<h3>The castle household</h3>${hearth}<p class="muted">${Object.values(world.players).map(resident => escape(resident.name)).join(' and ')} call this place home. Personal discoveries and belongings stay with each resident.</p><h3>Changes to the house</h3>${world.events.length ? world.events.slice(-12).reverse().map(event => `<p class="household-event">${escape(arrival.find(entry => entry.id === event.kind)?.title ?? event.kind.replaceAll('-', ' '))}<small>${escape(world!.players[event.actor]?.name ?? 'A resident')}</small></p>`).join('') : '<p class="muted">The next chapter is still yours to write.</p>'}`;
      const arrangeButton = document.getElementById('arrange-room') as HTMLButtonElement;
      if (player.seated) {
        arrangeButton.disabled = true;
        arrangeButton.insertAdjacentHTML('afterend', '<p class="muted">Stand up before arranging the room.</p>');
      }
      on('arrange-room', arrangeRoom);
    } else {
      contents.innerHTML = `<h3>${guestSession ? guestSession.connected ? 'Together in the castle' : 'Connection closed' : hostSession?.guestId ? 'The household is together' : 'Invite someone home'}</h3><p>${guestSession ? 'You are the second resident. Your belongings and discoveries are saved with this household, with a recovery copy on this device.' : 'A second resident can join this world over the same reachable Wi-Fi. You can continue alone after they leave.'}</p>${guestSession ? '<p class="muted">Use ESC to save and return to the title. Join Co-op there to reconnect.</p>' : '<button id="session" class="primary">Co-op session<span>→</span></button>'}<h3>Controls</h3><p class="muted">Drag on the left side to walk. A interacts or continues; B goes back. Choose dialogue responses directly. Keyboard: WASD or arrows, E to interact, B to go back, I for this satchel, ESC to save and leave.</p>`;
      on('session', hostDialog);
    }
  };
  menuRefresh = refresh; refresh(); updateHud();
}
function itemDetails(id: string) {
  if (!world) return;
  const count = world.players[localId].inventory[id] ?? 0;
  const panel = dialog(itemName(id), `<div class="item-description">${itemIcon(id)}<div><p>${count} in your satchel</p><p class="muted">${id === 'cacao-bean' ? 'A bitter, fragrant ingredient from Rook’s welcome parcel. Keep it for the kitchen.' : 'An item carried by this resident.'}</p></div></div><h3>Place in a quick slot</h3><div class="assign-slots">${Array.from({ length: QUICK_SLOT_COUNT }, (_, index) => `<button id="assign-slot-${index + 1}" ${count ? '' : 'disabled'} aria-label="Assign to quick slot ${index + 1}">${index + 1}</button>`).join('')}</div><p class="muted">Quick slots refer to your own items. They do not move or copy them.</p><div class="button-row"><button id="back-to-items">Back to satchel</button><button id="clear-quick" ${quickSettings.slots.includes(id) ? '' : 'disabled'}>Clear from quick slots</button></div>`);
  panel.classList.add('inventory-dialog');
  for (let index = 0; index < QUICK_SLOT_COUNT; index++) on(`assign-slot-${index + 1}`, () => {
    quickSettings.slots[index] = id; quickSettings.selected = index; saveQuickSettings(); void closeModal().catch(fail); updateHud();
  });
  on('back-to-items', () => inventory('items'));
  on('clear-quick', () => { quickSettings.slots = quickSettings.slots.map(item => item === id ? null : item); saveQuickSettings(); closeModal(); updateHud(); });
}
function chestDialog(container: 'chest' | 'pantry' = 'chest') {
  const label = container === 'pantry' ? 'Household pantry' : 'Household chest';
  const panel = dialog(label, '<p class="muted">Shared storage for both residents.</p><div id="chest-content"></div>', 'object');
  panel.classList.add('chest-dialog');
  let busy = false;
  let previousContents = '';
  const refresh = () => {
    if (!world || modal !== panel) return;
    const personal = world.players[localId].inventory['cacao-bean'] ?? 0, shared = world.chest['cacao-bean'] ?? 0;
    const nextContents = `${personal}:${shared}:${busy}`;
    if (nextContents === previousContents) return;
    previousContents = nextContents;
    panel.querySelector('#chest-content')!.innerHTML = `<div class="storage-columns"><div><h3>Your satchel</h3><p>${personal} cacao bean${personal === 1 ? '' : 's'}</p><button id="chest-deposit" ${personal && !busy ? '' : 'disabled'}>Deposit one →</button></div><div><h3>${label}</h3><p>${shared} cacao bean${shared === 1 ? '' : 's'}</p><button id="chest-withdraw" ${shared && !busy ? '' : 'disabled'}>← Take one</button></div></div>`;
    const transfer = async (direction: 'deposit' | 'withdraw') => {
      if (busy) return; busy = true; refresh();
      try { await dispatch({ kind: 'transfer', direction, item: 'cacao-bean', count: 1 }); }
      finally { busy = false; refresh(); }
    };
    on('chest-deposit', () => transfer('deposit')); on('chest-withdraw', () => transfer('withdraw'));
  };
  menuRefresh = refresh; refresh();
}
async function hostDialog() {
  if (!authority || !world) return;
  if (hostSession?.guestId) { dialog('The household is together', '<p>Player 2 is connected. Their personal progress is saved with this world.</p><button id="end-coop">End co-op and keep playing alone</button>'); on('end-coop', () => { hostSession?.close(); hostSession = undefined; void closeModal().catch(fail); }); return; }
  transport?.close(); hostSession?.close();
  const currentTransport = new WebRTCTransport(); transport = currentTransport;
  hostSession = new HostSession(currentTransport, authority, text => { toast(text); updateHud(); });
  const currentDialog = dialog('Invite a second resident', '<p class="muted">Both phones need the same reachable Wi-Fi. Internet is not needed once the game is installed. Keep both apps open.</p><p id="pair-status">Finding this phone on the local network…</p><div id="pair-content"></div>');
  const offer = await currentTransport.offer(world.worldId, world.epoch);
  if (modal !== currentDialog) { currentTransport.close(); return; }
  document.getElementById('pair-status')!.textContent = '1. Let the other phone scan or copy your offer. 2. Scan or paste its answer here.';
  document.getElementById('pair-content')!.innerHTML = `${pairingOutput()}<label>Guest answer<textarea id="pair-input" placeholder="TW1:…" spellcheck="false"></textarea></label><div class="button-row"><button id="scan">Scan answer QR</button><button id="accept" class="primary">Connect</button></div><video id="camera" hidden></video><p id="scan-status" class="muted"></p>`;
  displayPairing(encodePairing(offer));
  on('scan', () => scanIntoInput());
  on('accept', async () => {
    await currentTransport.accept(decodePairing((document.getElementById('pair-input') as HTMLTextAreaElement).value), offer);
    document.getElementById('pair-status')!.textContent = 'Connecting. You can close this panel and keep playing.';
  });
}
function pairingOutput() { return '<div class="pair-output"><div><canvas id="qr"></canvas><p id="qr-label" class="muted"></p></div><div><label>Pairing code<textarea id="pair-output" readonly spellcheck="false"></textarea></label><button id="copy-code">Copy code</button><p class="muted">If camera pairing is unavailable, copy the complete code to the other phone.</p></div></div>'; }
function displayPairing(code: string) {
  (document.getElementById('pair-output') as HTMLTextAreaElement).value = code;
  modalCleanup = showPairingQR(document.getElementById('qr') as HTMLCanvasElement, document.getElementById('qr-label')!, code);
  on('copy-code', async () => { await navigator.clipboard.writeText(code); toast('Pairing code copied.'); });
}
async function scanIntoInput() {
  const currentDialog = modal;
  const video = document.getElementById('camera') as HTMLVideoElement; video.hidden = false;
  const cleanup = modalCleanup;
  const stop = await scanPairing(video, document.getElementById('scan-status')!, code => {
    (document.getElementById('pair-input') as HTMLTextAreaElement).value = code; video.hidden = true; toast('Pairing code read.');
  });
  if (modal !== currentDialog) { stop(); return; }
  modalCleanup = () => { cleanup?.(); stop(); };
}
function joinDialog() {
  const panel = dialog('Join the household', `${characterFields('guest-name', 'Companion')}<label>Host offer<textarea id="pair-input" placeholder="TW1:…" spellcheck="false"></textarea></label><div class="button-row"><button id="scan">Scan offer QR</button><button id="create-answer" class="primary">Create answer</button></div><video id="camera" hidden></video><p id="scan-status" class="muted"></p>`);
  panel.classList.add('guest-dialog'); void prepareResidentPreview(panel).catch(fail);
  on('scan', scanIntoInput);
  on('create-answer', async () => {
    const offer = decodePairing((document.getElementById('pair-input') as HTMLTextAreaElement).value);
    const mirror = await db.mirrors.get(offer.worldId);
    if (mirror && mirror.world.epoch !== offer.epoch) throw Error('This host is using a different world timeline. Keep your recovery copy.');
    const pending = await db.settings.get(`guestIdentity:${offer.worldId}`);
    const existing = pending?.value as { id: string; key: string } | undefined;
    const identity = { id: mirror?.playerId ?? existing?.id ?? crypto.randomUUID(), key: mirror?.key ?? existing?.key ?? crypto.randomUUID(),
      name: (document.getElementById('guest-name') as HTMLInputElement).value.trim(), appearance: (document.getElementById('appearance') as HTMLSelectElement).value as Player['appearance'], look: readCharacterLook(panel) };
    createPlayer(identity.name, identity.appearance, identity.id, identity.look);
    await db.settings.put({ key: `guestIdentity:${offer.worldId}`, value: identity });
    transport?.close(); transport = new WebRTCTransport();
    let entered = false;
    guestSession = new GuestSession(transport, db, identity, offer, mirror, received => {
      const previous = world; world = received; localId = identity.id;
      sharedPresentation(previous, received);
      if (!entered) { entered = true; void play().catch(fail); } else updateHud();
    }, text => { toast(text); updateHud(); });
    const answer = await transport.answer(offer);
    dialog('Send your answer home', `<p class="muted">Let the host scan this QR, or copy the answer into their Co-op panel. Your room opens when they connect.</p>${pairingOutput()}`);
    displayPairing(encodePairing(answer));
  });
}
async function backupDialog() {
  const records = await Promise.all(([1, 2] as Slot[]).map(id => db.load(id)));
  dialog('Keep a copy of home', `<p>Save files belong to this device. Export a backup before clearing browser data or changing phones.</p>${records.map((record, index) => `<div class="backup-row"><span>World Save Slot ${index + 1}<small>${record ? `Last export: ${record.lastBackupAt ? new Date(record.lastBackupAt).toLocaleString() : 'not yet backed up'}` : 'Empty'}</small></span><button id="export-${index + 1}" ${record ? '' : 'disabled'}>Export</button></div>`).join('')}<button id="export-both">Export both saves</button><label class="file-label">Import a world backup<input type="file" id="import-save" accept="application/json,.json" /></label><p class="muted">Imports are checked before any save changes. Replacing an occupied slot keeps a recovery checkpoint.</p><p id="import-status"></p>`);
  const exportSlots = async (slots: Slot[], share = false) => {
    const text = await db.backup(slots);
    parseBackup(text);
    const file = new File([text], 'twilight-worlds.json', { type: 'application/json' });
    if (share && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Twilight save backup' });
    else {
      const link = document.createElement('a'); const url = URL.createObjectURL(file); link.href = url; link.download = file.name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
    await db.markBackup(slots); toast('Backup exported.');
  };
  on('export-1', () => exportSlots([1])); on('export-2', () => exportSlots([2])); on('export-both', () => exportSlots([1, 2]));
  if (typeof navigator.share === 'function') {
    const shareButton = document.createElement('button'); shareButton.id = 'share-backup'; shareButton.textContent = 'Share both saves';
    document.getElementById('export-both')!.after(shareButton);
    on('share-backup', () => exportSlots([1, 2], true));
  }
  document.getElementById('import-save')!.addEventListener('change', event => {
    void (async () => {
      const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return;
      if (file.size > 4_000_000) throw Error('This backup is too large.');
      const text = await file.text(); const parsed = parseBackup(text);
      const occupied = (await Promise.all(parsed.worlds.map(w => db.load(w.slot)))).some(Boolean);
      if (occupied) {
        dialog('Replace occupied world saves?', `<p>This backup will replace world slot${parsed.worlds.length > 1 ? 's' : ''} ${parsed.worlds.map(w => w.slot).join(' and ')}. Export your current saves first if you want to keep them.</p><div class="button-row"><button id="cancel-import">Keep current saves</button><button id="confirm-import">Replace with backup</button></div>`);
        on('cancel-import', closeModal); on('confirm-import', async () => { await db.restore(text, true); await title(); toast('Backup restored.'); });
      } else { await db.restore(text, false); await title(); toast('Backup restored.'); }
    })().catch(fail);
  });
}
async function settingsDialog() {
  const value = (await db.settings.get('reducedMotion'))?.value === true;
  const audioOff = (await db.settings.get('audioOff'))?.value === true, musicOff = (await db.settings.get('musicOff'))?.value === true;
  dialog('Settings & help', `<label class="check-label"><input id="audio-enabled" type="checkbox" ${audioOff ? '' : 'checked'} /> Sound effects and ambience</label><label class="check-label"><input id="music-enabled" type="checkbox" ${musicOff ? '' : 'checked'} /> Music</label><label class="check-label"><input id="reduced-motion" type="checkbox" ${value ? 'checked' : ''} /> Reduce decorative motion</label><h3>Offline installation</h3><p id="offline-details">${escape(offline.label)}</p><button id="offline-settings-install">Check or repair offline package</button><h3>On your iPhone</h3><p>In Safari, open Share and choose Add to Home Screen. Check the offline status here before leaving the network. Turn your phone sideways to play.</p><h3>Sharing the castle</h3><p>Use the same Wi-Fi network on both phones. Networks that isolate devices can prevent local pairing. Keep the host app open. If either app is suspended, reconnect through Co-op.</p><p class="muted">Haunted Chocolatier: Twilight · ${BUILD_VERSION}</p>`);
  document.getElementById('audio-enabled')!.addEventListener('change', event => {
    const enabled = (event.target as HTMLInputElement).checked;
    sound.setEnabled(enabled);
    // Capture listeners ran while the old preference was still muted. Resume here,
    // synchronously within the enabling gesture, including on iOS WebKit.
    if (enabled) void sound.unlock().catch(() => undefined);
    void db.settings.put({ key: 'audioOff', value: !enabled }).catch(fail);
  });
  document.getElementById('music-enabled')!.addEventListener('change', event => { const enabled = (event.target as HTMLInputElement).checked; sound.setMusicEnabled(enabled); void db.settings.put({ key: 'musicOff', value: !enabled }).catch(fail); });
  on('offline-settings-install', () => offline.install());
  document.getElementById('reduced-motion')!.addEventListener('change', event => {
    const checked = (event.target as HTMLInputElement).checked;
    document.documentElement.classList.toggle('reduced-motion', checked);
    void db.settings.put({ key: 'reducedMotion', value: checked }).catch(fail);
  });
}
document.addEventListener('keydown', event => {
  if (portraitMedia.matches) { if (event.key === 'Escape') event.preventDefault(); return; }
  if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
  if (modal) {
    if (event.key === 'Escape' || event.key.toLowerCase() === 'b') { event.preventDefault(); void backAction().catch(fail); return; }
    if (event.key.toLowerCase() === 'a' || (event.key === 'Enter' || event.key === ' ') && !(event.target instanceof HTMLButtonElement) && modal.querySelectorAll('[data-primary="true"]').length === 1) { event.preventDefault(); void primaryAction().catch(fail); return; }
    if (/^[1-9]$/.test(event.key)) {
      const choice = modal.querySelector<HTMLButtonElement>(`[data-choice-number="${event.key}"]`);
      if (choice) { event.preventDefault(); choice.click(); }
    }
    return;
  }
  if (!world || exiting || interacting) return;
  if (arranging) { if (event.key === 'Escape' || event.key.toLowerCase() === 'b') { event.preventDefault(); endArrangement(); } return; }
  if (event.key === 'Escape') { event.preventDefault(); void leaveGame().catch(fail); }
  else if (event.key.toLowerCase() === 'b') { event.preventDefault(); void backAction().catch(fail); }
  else if (event.key.toLowerCase() === 'i') { event.preventDefault(); inventory(quickSettings.seen !== notificationState() ? 'missions' : 'items'); }
  else if (/^[1-7]$/.test(event.key)) { event.preventDefault(); selectQuickSlot(Number(event.key) - 1); }
});
window.addEventListener('blur', () => { clockLastTime = performance.now(); arranging?.cancelDrag(); });
window.addEventListener('pagehide', () => { clockLastTime = performance.now(); touchControls?.stop(); hostSession?.close(); guestSession?.close(); });
document.addEventListener('visibilitychange', () => { clockLastTime = performance.now(); if (document.hidden) { touchControls?.stop(); arranging?.cancelDrag(); hostSession?.close(); guestSession?.close(); } });
updateOrientation();
void (async () => {
  sound.setEnabled((await db.settings.get('audioOff'))?.value !== true);
  sound.setMusicEnabled((await db.settings.get('musicOff'))?.value !== true);
  document.documentElement.classList.toggle('reduced-motion', (await db.settings.get('reducedMotion'))?.value === true);
  await title(); await offline.start();
})().catch(error => { app.textContent = 'The castle could not open its local saves. Please enable browser storage and reload. Existing saves have not been deleted.'; fail(error); });
