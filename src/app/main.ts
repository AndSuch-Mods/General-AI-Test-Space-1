import './style.css';
import { createPlayer, createWorld, type Player, type Slot, type World } from '../game/model';
import { Authority, type Intent } from '../game/authority';
import { arrival, validateContent } from '../content/arrival';
import { db, parseBackup } from '../persistence/database';
import { acquireWorldLock } from '../persistence/lock';
import { OfflinePackage } from '../pwa/offline';
import { WebRTCTransport, decodePairing, encodePairing } from '../networking/webrtc';
import { GuestSession, HostSession } from '../networking/session';
import { scanPairing, showPairingQR } from '../ui/pairing';

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
let toastTimer: ReturnType<typeof setTimeout>;
const offline = new OfflinePackage(refreshOffline);
const escape = (text: string) => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
function toast(text: string) { toastElement.textContent = text; toastElement.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastElement.classList.remove('visible'), 5500); }
function fail(error: unknown) { toast(error instanceof Error ? error.message : 'Something went wrong. Your last saved progress is kept.'); }
function on(id: string, action: () => unknown) {
  document.getElementById(id)?.addEventListener('click', () => { Promise.resolve().then(action).catch(fail); });
}
function closeModal() { modalCleanup?.(); modalCleanup = undefined; modal?.close(); modal?.remove(); modal = undefined; }
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
  closeModal();
  hostSession?.close(); guestSession?.close(); transport?.close();
  hostSession = undefined; guestSession = undefined; transport = undefined;
  destroyScene?.(); destroyScene = undefined; releaseLock?.(); releaseLock = undefined;
  authority = undefined; world = undefined;
  const records = await Promise.all(([1, 2] as Slot[]).map(id => db.load(id)));
  app.innerHTML = `<section class="title-screen">
    <div class="title-art" aria-hidden="true"><img src="./art/castle.svg" alt="" /></div>
    <div class="title-copy"><p class="eyebrow">A light in the old house</p><h1>Haunted<br>Chocolatier<span>TWILIGHT</span></h1><p class="tagline">Some memories need a way home.</p><div class="title-line"></div><p class="world-caption">Gloambridge · At the edge of evening</p></div>
    <div class="menu-panel"><div class="menu-heading"><span class="tiny-star">✧</span><p>Welcome home</p><span class="tiny-star">✧</span></div>
    <div class="slots" role="group" aria-label="World save slots">${records.map((record, index) => `<button class="slot ${slot === index + 1 ? 'selected' : ''}" id="slot-${index + 1}" aria-pressed="${slot === index + 1}"><span class="slot-number">0${index + 1}</span><span><b>World Save Slot ${index + 1}</b><small>${record ? `${escape(record.world.players[record.world.hostId].name)} · The castle` : 'A new beginning'}</small></span><span class="slot-mark">${record ? '◈' : '+'}</span></button>`).join('')}</div>
    <button id="solo" class="primary">${records[slot - 1] ? 'Continue / Single Player' : 'Single Player'}<span>→</span></button>
    <div class="coop-buttons"><button id="host">Host Co-op</button><button id="join">Join Co-op</button></div>
    <p class="menu-note">One household. Two stories.<br>Play alone, or share the castle with someone nearby.</p>
    <div class="menu-links"><button id="backups">Backups</button><span>·</span><button id="settings">Settings & help</button></div>
    </div>
    <footer><div class="offline"><span class="status-dot"></span><span id="offline-label"></span><button id="offline-install">Make Available Offline</button><button id="apply-update" hidden>Update ready · restart</button></div><span class="build-label">EARLY DEVELOPMENT · 0.1.0</span></footer>
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
  await play();
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
  if (moving || modal || document.hidden) return;
  moving = true; void dispatch({ kind: 'move', dx, dy }).catch(fail).finally(() => { moving = false; });
}
async function interact() {
  if (!world || modal) return;
  const player = world.players[localId];
  const nearest = [...arrival].sort((a, b) => Math.hypot(player.x - a.x, player.y - a.y) - Math.hypot(player.x - b.x, player.y - b.y))[0];
  if (Math.hypot(player.x - nearest.x, player.y - nearest.y) > 105) { toast('Walk closer to the letter, hearth, or welcome parcel.'); return; }
  await dispatch({ kind: 'interact', target: nearest.id });
  dialog(nearest.title, `<p class="story-text">${escape(nearest.text)}</p><p class="muted">${nearest.scope === 'personal' ? 'Added to your own journal.' : 'The hearth is lit for the whole household.'}</p><button id="finish-story" class="primary">Carry on<span>→</span></button>`);
  on('finish-story', closeModal);
}
async function play() {
  closeModal();
  app.innerHTML = `<section class="play-screen"><div id="game-canvas" aria-label="Castle arrival hall"></div>
    <header class="game-hud"><div><span class="eyebrow">The castle</span><strong id="resident-label"></strong></div><div class="hud-actions"><button id="journal">Journal & satchel</button><button id="session">Co-op</button><button id="leave">Save & title</button></div></header>
    <div class="chapter-note"><span>I</span><div>A household begins<small>Read the letter. Light the hearth. Settle in.</small></div></div>
    <div class="touch-pad" aria-label="Movement controls"><button id="move-up" aria-label="Move up">↑</button><button id="move-left" aria-label="Move left">←</button><button id="move-down" aria-label="Move down">↓</button><button id="move-right" aria-label="Move right">→</button></div>
    <button id="interact" class="interact-button">Interact<small>E</small></button><p class="save-state" id="save-state">Saved on this device</p>
    <div class="arrival-help">WASD / arrows to walk · E to interact</div></section>`;
  on('interact', interact); on('journal', journal); on('session', () => guestSession ? toast('You are the second resident. Return to the title to leave or reconnect.') : hostDialog());
  on('leave', async () => { if (moving) { toast('Finishing the current save. Try again in a moment.'); return; } await title(); });
  for (const [name, dx, dy] of [['up', 0, -1], ['left', -1, 0], ['down', 0, 1], ['right', 1, 0]] as const) {
    const button = document.getElementById(`move-${name}`)!;
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = () => { clearInterval(timer); timer = undefined; };
    button.addEventListener('pointerdown', event => { event.preventDefault(); button.setPointerCapture(event.pointerId); move(dx, dy); timer = setInterval(() => move(dx, dy), 110); });
    button.addEventListener('pointerup', stop); button.addEventListener('pointercancel', stop); button.addEventListener('lostpointercapture', stop);
  }
  updateHud();
  const { mountArrival } = await import('../game/scenes/arrival-scene');
  destroyScene?.();
  destroyScene = await mountArrival(document.getElementById('game-canvas')!, () => ({ world: world!, localId,
    activeIds: guestSession ? [world!.hostId, localId] : [localId, ...(hostSession?.guestId ? [hostSession.guestId] : [])] }), move, () => { void interact().catch(fail); }, () => !!modal || document.hidden);
  updateHud();
}
function updateHud() {
  if (!world) return;
  const label = document.getElementById('resident-label');
  if (label) label.textContent = `${world.players[localId].name} · ${guestSession ? 'Player 2' : 'Player 1'}`;
  const saved = document.getElementById('save-state');
  if (saved) saved.textContent = guestSession ? guestSession.connected ? 'Host saved · recovery copy on this device' : 'Disconnected · waiting for host' : 'Saved on this device';
}
function journal() {
  if (!world) return;
  const player = world.players[localId];
  dialog('Your journal & satchel', `<p class="eyebrow">${escape(player.name)} · Personal discoveries</p><div class="journal-entries">${player.discoveries.length ? player.discoveries.map(id => `<p>✧ ${escape(arrival.find(e => e.id === id)?.title ?? id)}</p>`).join('') : '<p>The first page is waiting.</p>'}</div><h3>Satchel</h3><p>${Object.entries(player.inventory).map(([id, count]) => `${count} ${escape(id.replaceAll('-', ' '))}`).join('<br>') || 'Your satchel is empty.'}</p><h3>Our household</h3><p>${world.story.flags.hearth ? 'The hearth is burning. Its warmth will remain when another resident arrives.' : 'The hearth is cold.'}</p><p class="muted">Your discoveries and belongings are yours. Changes to the house belong to everyone.</p>`);
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
  dialog('Join the household', `<p class="muted">Ask the host to open Co-op inside their world. Scan their offer, or paste its complete code.</p><label>Your name<input id="guest-name" maxlength="24" value="Companion" /></label>${appearanceField()}<label>Host offer<textarea id="pair-input" placeholder="TW1:…" spellcheck="false"></textarea></label><div class="button-row"><button id="scan">Scan offer QR</button><button id="create-answer" class="primary">Create answer</button></div><video id="camera" hidden></video><p id="scan-status" class="muted"></p>`);
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
  const exportSlots = async (slots: Slot[]) => {
    const text = await db.backup(slots);
    parseBackup(text);
    const file = new File([text], 'twilight-worlds.json', { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Twilight save backup' });
    else {
      const link = document.createElement('a'); const url = URL.createObjectURL(file); link.href = url; link.download = file.name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
    await db.markBackup(slots); toast('Backup exported.');
  };
  on('export-1', () => exportSlots([1])); on('export-2', () => exportSlots([2])); on('export-both', () => exportSlots([1, 2]));
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
window.addEventListener('pagehide', () => { hostSession?.close(); guestSession?.close(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { hostSession?.close(); guestSession?.close(); } });
void (async () => {
  document.documentElement.classList.toggle('reduced-motion', (await db.settings.get('reducedMotion'))?.value === true);
  await title(); await offline.start();
})().catch(error => { app.textContent = 'The castle could not open its local saves. Please enable browser storage and reload. Existing saves have not been deleted.'; fail(error); });
