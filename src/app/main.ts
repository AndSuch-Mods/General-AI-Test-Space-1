import './style.css';
import { BUILD_VERSION, createPlayer, createWorld, type Player, type Slot, type World } from '../game/model';
import { Authority, type Intent } from '../game/authority';
import { arrival, validateContent, type ArrivalId } from '../content/arrival';
import { nearestInteractable } from '../content/room';
import { db, parseBackup } from '../persistence/database';
import { acquireWorldLock } from '../persistence/lock';
import { OfflinePackage } from '../pwa/offline';
import { WebRTCTransport, decodePairing, encodePairing } from '../networking/webrtc';
import { GuestSession, HostSession } from '../networking/session';
import { scanPairing, showPairingQR } from '../ui/pairing';
import { mountTouchControls, type TouchControls } from '../ui/touch-controls';

validateContent();
const app = document.querySelector<HTMLElement>('#app')!;
const toastElement = document.querySelector<HTMLElement>('#toast')!;
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
let moving = false;
let interacting = false;
let exiting = false;
let touchControls: TouchControls | undefined;
let playGeneration = 0;
let menuRefresh: (() => void) | undefined;
type InventoryTab = 'items' | 'missions' | 'journal' | 'household' | 'session';
interface QuickSettings { slots: (string | null)[]; selected: number; seen: string }
let quickSettings: QuickSettings = { slots: [null, null, null, null, null], selected: 0, seen: '' };
let settingsQueue = Promise.resolve();
let toastTimer: ReturnType<typeof setTimeout>;
const offline = new OfflinePackage(refreshOffline);
const escape = (text: string) => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
function toast(text: string) { toastElement.textContent = text; toastElement.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastElement.classList.remove('visible'), 5500); }
function fail(error: unknown) { toast(error instanceof Error ? error.message : 'Something went wrong. Your last saved progress is kept.'); }
function on(id: string, action: () => unknown) {
  document.getElementById(id)?.addEventListener('click', () => { Promise.resolve().then(action).catch(fail); });
}
function closeModal() { touchControls?.stop(); menuRefresh = undefined; modalCleanup?.(); modalCleanup = undefined; modal?.close(); modal?.remove(); modal = undefined; }
function dialog(title: string, body: string) {
  closeModal();
  modal = document.createElement('dialog'); modal.className = 'panel-dialog';
  modal.innerHTML = `<div class="dialog-head"><h2>${title}</h2><button id="close-dialog" class="icon-button" aria-label="Close dialog">×</button></div>${body}`;
  app.append(modal); modal.showModal(); on('close-dialog', closeModal);
  modal.addEventListener('cancel', event => { event.preventDefault(); closeModal(); });
  return modal;
}
function refreshOffline() {
  const label = document.getElementById('offline-label'); if (label) label.textContent = offline.label;
  const action = document.getElementById('offline-install'); if (action) action.hidden = offline.ready;
  const update = document.getElementById('apply-update'); if (update) update.hidden = !offline.updateReady;
}
async function title() {
  playGeneration += 1;
  touchControls?.destroy(); touchControls = undefined;
  closeModal();
  hostSession?.close(); guestSession?.close(); transport?.close();
  hostSession = undefined; guestSession = undefined; transport = undefined;
  destroyScene?.(); destroyScene = undefined; releaseLock?.(); releaseLock = undefined;
  authority = undefined; world = undefined;
  const records = await Promise.all(([1, 2] as Slot[]).map(id => db.load(id)));
  app.innerHTML = `<section class="title-screen">
    <div class="title-art" aria-hidden="true"><img src="./art/title-castle.png" alt="" /></div>
    <div class="title-copy"><p class="eyebrow">A light in the old house</p><h1>Haunted<br>Chocolatier<span>TWILIGHT</span></h1><p class="tagline">Some memories need a way home.</p><div class="title-line"></div><p class="world-caption">Gloambridge · At the edge of evening</p></div>
    <div class="menu-panel"><div class="menu-heading"><span class="tiny-star">✧</span><p>Welcome home</p><span class="tiny-star">✧</span></div>
    <div class="slots" role="group" aria-label="World save slots">${records.map((record, index) => `<button class="slot ${slot === index + 1 ? 'selected' : ''}" id="slot-${index + 1}" aria-pressed="${slot === index + 1}"><span class="slot-number">0${index + 1}</span><span><b>World Save Slot ${index + 1}</b><small>${record ? `${escape(record.world.players[record.world.hostId].name)} · The castle` : 'A new beginning'}</small></span><span class="slot-mark">${record ? '◈' : '+'}</span></button>`).join('')}</div>
    <button id="solo" class="primary">${records[slot - 1] ? 'Continue / Single Player' : 'Single Player'}<span>→</span></button>
    <div class="coop-buttons"><button id="host">Host Co-op</button><button id="join">Join Co-op</button></div>
    <p class="menu-note">One household. Two stories.<br>Play alone, or share the castle with someone nearby.</p>
    <div class="menu-links"><button id="backups">Backups</button><span>·</span><button id="settings">Settings & help</button></div>
    </div>
    <footer><div class="offline"><span class="status-dot"></span><span id="offline-label"></span><button id="offline-install">Make Available Offline</button><button id="apply-update" hidden>Update ready · restart</button></div><span class="build-label">EARLY DEVELOPMENT · ${BUILD_VERSION}</span></footer>
  </section>`;
  on('slot-1', () => { slot = 1; return title(); }); on('slot-2', () => { slot = 2; return title(); });
  on('solo', () => begin(false)); on('host', () => begin(true)); on('join', joinDialog);
  on('backups', backupDialog); on('settings', settingsDialog);
  on('offline-install', () => offline.install()); on('apply-update', () => offline.applyUpdate()); refreshOffline();
}
async function begin(hosting: boolean) {
  const record = await db.load(slot);
  if (record) { await enterHost(record.world); if (hosting) await hostDialog(); return; }
  dialog('The castle has kept a room for you.', `<p class="muted">A name for the next keeper. You can invite a second resident whenever you like.</p><form id="new-resident"><label>Your name<input id="player-name" name="playerName" maxlength="24" required autocomplete="off" value="Keeper" /></label>${appearanceField()}<button class="primary" type="submit">Enter the castle<span>→</span></button></form>`);
  document.getElementById('new-resident')!.addEventListener('submit', event => {
    event.preventDefault();
    void (async () => {
      const name = (document.getElementById('player-name') as HTMLInputElement).value.trim();
      const appearance = (document.getElementById('appearance') as HTMLSelectElement).value as Player['appearance'];
      const created = createWorld(createPlayer(name, appearance));
      await db.save(slot, created, { create: true });
      await enterHost(created); if (hosting) await hostDialog();
    })().catch(fail);
  });
}
function appearanceField() { return '<label>Coat color<select id="appearance"><option value="amber">Hearth amber</option><option value="moss">Woodland moss</option><option value="violet">Evening violet</option></select></label>'; }
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
  if (previous && !previous.story.flags.hearth && next.story.flags.hearth) {
    toast('The house exhales. A warm hearth now waits for everyone who calls this place home.');
  }
}
async function dispatch(intent: Intent) {
  if (guestSession) await guestSession.dispatch(intent);
  else if (authority) { await authority.dispatch(localId, ++sequence, intent); hostSession?.publish(intent.kind === 'move'); }
}
function move(dx: number, dy: number) {
  if (moving || controlsBlocked()) return;
  moving = true; void dispatch({ kind: 'move', dx, dy }).catch(fail).finally(() => { moving = false; });
}
function controlsBlocked() { return !!modal || interacting || exiting || document.hidden; }
async function interact() {
  if (!world || controlsBlocked()) return;
  touchControls?.stop();
  const nearest = nearestInteractable(world.players[localId]);
  if (!nearest) { toast('Move closer to something you want to examine.'); return; }
  if (nearest.actions.length === 1) { await performInteraction(nearest.actions[0]); return; }
  const choices = nearest.actions.map(id => arrival.find(entry => entry.id === id)!);
  const panel = dialog(nearest.label, `<div class="dialogue-choices">${choices.map((entry, index) => `<button data-action="${entry.id}" data-choice="${index}"><kbd>${String.fromCharCode(65 + index)}</kbd><span>${escape(entry.label)}</span></button>`).join('')}</div>`);
  panel.classList.add('story-dialog');
  for (const choice of panel.querySelectorAll<HTMLButtonElement>('[data-action]')) choice.addEventListener('click', () => { void performInteraction(choice.dataset.action as ArrivalId).catch(fail); });
}
async function performInteraction(target: ArrivalId) {
  if (interacting || exiting) return;
  interacting = true; touchControls?.stop();
  try {
    await dispatch({ kind: 'interact', target });
    if (target === 'chest') { chestDialog(); return; }
    const entry = arrival.find(event => event.id === target)!;
    const panel = dialog(entry.title, `<p class="story-text">${escape(entry.text)}</p><button id="finish-story" class="story-continue" data-choice="0"><kbd>A</kbd>Carry on<span>→</span></button>`);
    panel.classList.add('story-dialog'); on('finish-story', closeModal);
  } finally { interacting = false; }
}
async function leaveGame() {
  if (exiting) return;
  exiting = true; touchControls?.stop();
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
  closeModal();
  touchControls?.destroy();
  const generation = ++playGeneration;
  const savedQuick = (await db.settings.get(quickSettingsKey()))?.value as Partial<QuickSettings> | undefined;
  quickSettings = { slots: Array.from({ length: 5 }, (_, index) => typeof savedQuick?.slots?.[index] === 'string' ? savedQuick.slots[index] : null),
    selected: Number.isInteger(savedQuick?.selected) && savedQuick!.selected! >= 0 && savedQuick!.selected! < 5 ? savedQuick!.selected! : 0,
    seen: typeof savedQuick?.seen === 'string' ? savedQuick.seen : '' };
  if (generation !== playGeneration) return;
  app.innerHTML = `<section class="play-screen"><div id="game-canvas" aria-label="Castle arrival hall"></div>
    <div id="touch-surface" aria-label="Drag the left side to move; tap the right side to interact"><div id="thumbstick" hidden aria-hidden="true"><div id="thumbstick-knob"></div></div></div>
    <span id="resident-label" class="sr-only"></span><span id="save-state" class="sr-only" aria-live="polite"></span>
    <header class="game-hud"><div class="hud-clock" aria-label="World time"><span class="clock-moon" aria-hidden="true">☾</span><time id="game-clock">18:00</time></div><button id="inventory-toggle" class="hud-button" aria-label="Inventory and missions"><span>I</span><span id="notification-dot" hidden aria-label="New mission or discovery"></span></button><button id="leave" class="hud-button" aria-label="Save and return to title"><span>ESC</span></button></header>
    <div class="quickbar" role="group" aria-label="Quick slots">${Array.from({ length: 5 }, (_, index) => `<button id="quick-slot-${index + 1}" class="quick-slot" aria-label="Quick slot ${index + 1}"><span class="slot-key">${index + 1}</span><span class="quick-item"></span><span class="quick-count"></span></button>`).join('')}<button id="inventory-more" class="quick-more" aria-label="Open inventory">···</button></div></section>`;
  on('inventory-toggle', () => inventory(quickSettings.seen !== notificationState() ? 'missions' : 'items'));
  on('inventory-more', () => inventory()); on('leave', leaveGame);
  for (let index = 0; index < 5; index++) on(`quick-slot-${index + 1}`, () => selectQuickSlot(index));
  touchControls = mountTouchControls(document.getElementById('touch-surface')!, move, () => { void interact().catch(fail); }, controlsBlocked);
  updateHud();
  const { mountArrival } = await import('../game/scenes/arrival-scene');
  if (generation !== playGeneration) return;
  destroyScene?.();
  destroyScene = await mountArrival(document.getElementById('game-canvas')!, () => ({ world: world!, localId,
    activeIds: guestSession ? [world!.hostId, localId] : [localId, ...(hostSession?.guestId ? [hostSession.guestId] : [])] }), move, () => { void interact().catch(fail); }, controlsBlocked);
  updateHud();
}
function updateHud() {
  if (!world) return;
  const label = document.getElementById('resident-label');
  if (label) label.textContent = `${world.players[localId].name} · ${guestSession ? 'Player 2' : 'Player 1'}`;
  const saved = document.getElementById('save-state');
  if (saved) saved.textContent = guestSession ? guestSession.connected ? 'Host saved · recovery copy on this device' : 'Disconnected · waiting for host' : 'Saved on this device';
  const clock = document.getElementById('game-clock');
  if (clock) { const minutes = Math.floor(world.clock.totalMinutes) % 1440; clock.textContent = `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`; }
  const badge = document.getElementById('notification-dot');
  if (badge) badge.hidden = quickSettings.seen === notificationState();
  document.getElementById('inventory-toggle')?.setAttribute('aria-label', `Inventory and missions${badge && !badge.hidden ? ', new updates' : ''}`);
  for (let index = 0; index < 5; index++) {
    const button = document.getElementById(`quick-slot-${index + 1}`); if (!button) continue;
    const item = quickSettings.slots[index], count = item ? world.players[localId].inventory[item] ?? 0 : 0;
    button.setAttribute('aria-pressed', String(quickSettings.selected === index));
    button.setAttribute('aria-label', `Quick slot ${index + 1}${item ? `: ${itemName(item)}, ${count}` : ': empty'}`);
    button.querySelector('.quick-item')!.innerHTML = item ? itemIcon(item) : '';
    button.querySelector('.quick-count')!.textContent = count ? String(count) : '';
    button.classList.toggle('unavailable', !!item && !count);
  }
  menuRefresh?.();
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
  if (!world || exiting || interacting) return;
  const item = quickSettings.slots[index], wasSelected = quickSettings.selected === index;
  quickSettings.selected = index; saveQuickSettings(); updateHud();
  if (!item) inventory('items');
  else if (wasSelected) itemDetails(item);
}
function inventory(tab: InventoryTab = 'items') {
  if (!world || exiting) return;
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
      tab === 'journal' ? player.discoveries : tab === 'household' ? [world.events, Object.keys(world.players)] : [guestSession?.connected, hostSession?.guestId]);
    if (nextContents === previousContents) return;
    previousContents = nextContents;
    if (tab === 'items') {
      const owned = Object.entries(player.inventory).filter(([, count]) => count > 0);
      contents.innerHTML = `<p class="muted inventory-intro">Choose an item to inspect it or place it in a quick slot.</p><div class="inventory-grid">${owned.map(([id, count]) => `<button class="inventory-item" data-item="${escape(id)}" aria-label="${escape(itemName(id))}, ${count}">${itemIcon(id)}<span>${escape(itemName(id))}</span><b>×${count}</b></button>`).join('')}${Array.from({ length: Math.max(0, 10 - owned.length) }, () => '<div class="empty-item" aria-hidden="true"></div>').join('')}</div>${owned.length ? '' : '<p class="empty-satchel">Your satchel is empty. Look for the welcome parcel.</p>'}`;
      for (const button of contents.querySelectorAll<HTMLButtonElement>('[data-item]')) button.addEventListener('click', () => itemDetails(button.dataset.item!));
    } else if (tab === 'missions') {
      const steps = [{ done: player.discoveries.includes('letter'), title: 'Read the sealed letter', note: 'Personal · On the writing desk.' },
        { done: !!world.story.flags.hearth, title: 'Light the household hearth', note: 'Shared · Either resident can bring the fire back.' },
        { done: player.discoveries.includes('pantry'), title: 'Open your welcome parcel', note: 'Personal · A parcel waits by the pantry.' }];
      contents.innerHTML = `<h3>A household begins</h3><div class="mission-list">${steps.map(step => `<div class="mission-row ${step.done ? 'complete' : ''}"><span aria-label="${step.done ? 'Complete' : 'Open'}">${step.done ? '✓' : '○'}</span><div><strong>${step.title}</strong><p class="muted">${step.note}</p></div></div>`).join('')}</div>`;
    } else if (tab === 'journal') {
      contents.innerHTML = `<p class="muted">${escape(player.name)} · Personal discoveries</p><div class="journal-entries">${player.discoveries.length ? player.discoveries.map(id => {
        const entry = arrival.find(event => event.id === id);
        return `<details><summary>${escape(entry?.title ?? id)}</summary><p>${escape(entry?.text ?? '')}</p></details>`;
      }).join('') : '<p>The first page is waiting.</p>'}</div>`;
    } else if (tab === 'household') {
      contents.innerHTML = `<h3>The castle household</h3><p>${world.story.flags.hearth ? 'The hearth is burning. Its warmth will remain when another resident arrives.' : 'The hearth is cold.'}</p><p class="muted">${Object.values(world.players).map(resident => escape(resident.name)).join(' and ')} call this place home. Personal discoveries and belongings stay with each resident.</p><h3>Changes to the house</h3>${world.events.length ? world.events.slice(-12).reverse().map(event => `<p class="household-event">${escape(arrival.find(entry => entry.id === event.kind)?.title ?? event.kind.replaceAll('-', ' '))}<small>${escape(world!.players[event.actor]?.name ?? 'A resident')}</small></p>`).join('') : '<p class="muted">The next chapter is still yours to write.</p>'}`;
    } else {
      contents.innerHTML = `<h3>${guestSession ? guestSession.connected ? 'Together in the castle' : 'Connection closed' : hostSession?.guestId ? 'The household is together' : 'Invite someone home'}</h3><p>${guestSession ? 'You are the second resident. Your belongings and discoveries are saved with this household, with a recovery copy on this device.' : 'A second resident can join this world over the same reachable Wi-Fi. You can continue alone after they leave.'}</p>${guestSession ? '<p class="muted">Use ESC to save and return to the title. Join Co-op there to reconnect.</p>' : '<button id="session" class="primary">Co-op session<span>→</span></button>'}<h3>Controls</h3><p class="muted">Drag anywhere on the left side to walk. Tap the right side near an object to interact. Keyboard: WASD or arrows, E to interact, I for this satchel, ESC to save and leave. The clock currently remains at the arrival hour while the day cycle is in development.</p>`;
      on('session', hostDialog);
    }
  };
  menuRefresh = refresh; refresh(); updateHud();
}
function itemDetails(id: string) {
  if (!world) return;
  const count = world.players[localId].inventory[id] ?? 0;
  const panel = dialog(itemName(id), `<div class="item-description">${itemIcon(id)}<div><p>${count} in your satchel</p><p class="muted">${id === 'cacao-bean' ? 'A bitter, fragrant ingredient from Rook’s welcome parcel. Keep it for the kitchen.' : 'An item carried by this resident.'}</p></div></div><h3>Place in a quick slot</h3><div class="assign-slots">${Array.from({ length: 5 }, (_, index) => `<button id="assign-slot-${index + 1}" ${count ? '' : 'disabled'} aria-label="Assign to quick slot ${index + 1}">${index + 1}</button>`).join('')}</div><p class="muted">Quick slots refer to your own items. They do not move or copy them.</p><div class="button-row"><button id="back-to-items">Back to satchel</button><button id="clear-quick" ${quickSettings.slots.includes(id) ? '' : 'disabled'}>Clear from quick slots</button></div>`);
  panel.classList.add('inventory-dialog');
  for (let index = 0; index < 5; index++) on(`assign-slot-${index + 1}`, () => {
    quickSettings.slots[index] = id; quickSettings.selected = index; saveQuickSettings(); closeModal(); updateHud();
  });
  on('back-to-items', () => inventory('items'));
  on('clear-quick', () => { quickSettings.slots = quickSettings.slots.map(item => item === id ? null : item); saveQuickSettings(); closeModal(); updateHud(); });
}
function chestDialog() {
  const panel = dialog('Household chest', '<p class="muted">Shared storage. Both residents use the same chest.</p><div id="chest-content"></div>');
  let busy = false;
  let previousContents = '';
  const refresh = () => {
    if (!world || modal !== panel) return;
    const personal = world.players[localId].inventory['cacao-bean'] ?? 0, shared = world.chest['cacao-bean'] ?? 0;
    const nextContents = `${personal}:${shared}:${busy}`;
    if (nextContents === previousContents) return;
    previousContents = nextContents;
    panel.querySelector('#chest-content')!.innerHTML = `<div class="storage-columns"><div><h3>Your satchel</h3><p>${personal} cacao bean${personal === 1 ? '' : 's'}</p><button id="chest-deposit" ${personal && !busy ? '' : 'disabled'}>Deposit one →</button></div><div><h3>Household chest</h3><p>${shared} cacao bean${shared === 1 ? '' : 's'}</p><button id="chest-withdraw" ${shared && !busy ? '' : 'disabled'}>← Take one</button></div></div>`;
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
  if (hostSession?.guestId) { dialog('The household is together', '<p>Player 2 is connected. Their personal progress is saved with this world.</p><button id="end-coop">End co-op and keep playing alone</button>'); on('end-coop', () => { hostSession?.close(); hostSession = undefined; closeModal(); }); return; }
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
  dialog('Join the household', `<p class="muted">Ask the host to open I, then Co-op inside their world. Scan their offer, or paste its complete code.</p><label>Your name<input id="guest-name" maxlength="24" value="Companion" /></label>${appearanceField()}<label>Host offer<textarea id="pair-input" placeholder="TW1:…" spellcheck="false"></textarea></label><div class="button-row"><button id="scan">Scan offer QR</button><button id="create-answer" class="primary">Create answer</button></div><video id="camera" hidden></video><p id="scan-status" class="muted"></p>`);
  on('scan', scanIntoInput);
  on('create-answer', async () => {
    const offer = decodePairing((document.getElementById('pair-input') as HTMLTextAreaElement).value);
    const mirror = await db.mirrors.get(offer.worldId);
    if (mirror && mirror.world.epoch !== offer.epoch) throw Error('This host is using a different world timeline. Keep your recovery copy.');
    const pending = await db.settings.get(`guestIdentity:${offer.worldId}`);
    const existing = pending?.value as { id: string; key: string } | undefined;
    const identity = { id: mirror?.playerId ?? existing?.id ?? crypto.randomUUID(), key: mirror?.key ?? existing?.key ?? crypto.randomUUID(),
      name: (document.getElementById('guest-name') as HTMLInputElement).value.trim(), appearance: (document.getElementById('appearance') as HTMLSelectElement).value as Player['appearance'] };
    createPlayer(identity.name, identity.appearance, identity.id);
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
  dialog('Make yourself comfortable', `<label class="check-label"><input id="reduced-motion" type="checkbox" ${value ? 'checked' : ''} /> Reduce decorative motion</label><h3>On your iPhone</h3><p>In Safari, open Share and choose Add to Home Screen. Wait for “Ready for offline play” before leaving the network. Turn your phone sideways to play.</p><h3>Sharing the castle</h3><p>Use the same Wi-Fi network on both phones. Networks that isolate devices can prevent local pairing. Keep the host app open. If either app is suspended, reconnect through Co-op.</p><p class="muted">This early build opens the arrival hall. Town, wilderness, time progression, combat and cooking are still being built.</p>`);
  document.getElementById('reduced-motion')!.addEventListener('change', event => {
    const checked = (event.target as HTMLInputElement).checked;
    document.documentElement.classList.toggle('reduced-motion', checked);
    void db.settings.put({ key: 'reducedMotion', value: checked }).catch(fail);
  });
}
document.addEventListener('keydown', event => {
  if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
  if (modal) {
    if (event.key === 'Escape') { event.preventDefault(); closeModal(); return; }
    const index = event.key.toLowerCase().charCodeAt(0) - 97;
    if (event.key.length === 1 && index >= 0 && index < 5) {
      const choice = modal.querySelector<HTMLButtonElement>(`[data-choice="${index}"]`);
      if (choice) { event.preventDefault(); choice.click(); }
    }
    return;
  }
  if (!world || exiting || interacting) return;
  if (event.key === 'Escape') { event.preventDefault(); void leaveGame().catch(fail); }
  else if (event.key.toLowerCase() === 'i') { event.preventDefault(); inventory(quickSettings.seen !== notificationState() ? 'missions' : 'items'); }
  else if (/^[1-5]$/.test(event.key)) { event.preventDefault(); selectQuickSlot(Number(event.key) - 1); }
});
window.addEventListener('pagehide', () => { touchControls?.stop(); hostSession?.close(); guestSession?.close(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { touchControls?.stop(); hostSession?.close(); guestSession?.close(); } });
void (async () => {
  document.documentElement.classList.toggle('reduced-motion', (await db.settings.get('reducedMotion'))?.value === true);
  await title(); await offline.start();
})().catch(error => { app.textContent = 'The castle could not open its local saves. Please enable browser storage and reload. Existing saves have not been deleted.'; fail(error); });
