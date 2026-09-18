/* This file is expanded at build time. Cache changes never touch IndexedDB. */
const manifest = __MANIFEST__;
const prefix = 'twilight-' + new URL(self.registration.scope).pathname + '-';
const cacheName = prefix + manifest.version;
const absolute = path => new URL(path, self.registration.scope).href;
const notify = async message => {
  for (const client of await self.clients.matchAll({ includeUncontrolled: true })) client.postMessage(message);
};
async function verify(cache) {
  for (const asset of manifest.assets) if (!await cache.match(absolute(asset.url))) return false;
  return true;
}
async function installPackage() {
  const cache = await caches.open(cacheName);
  let done = 0;
  let bytes = 0;
  for (const asset of manifest.assets) {
    if (!await cache.match(absolute(asset.url))) {
      const response = await fetch(absolute(asset.url), { cache: 'reload' });
      if (!response.ok) throw Error('Could not download ' + asset.url);
      const buffer = await response.clone().arrayBuffer();
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buffer)), b => b.toString(16).padStart(2, '0')).join('');
      if (digest !== asset.hash) throw Error('Content verification failed for ' + asset.url);
      await cache.put(absolute(asset.url), response);
    }
    bytes += asset.bytes;
    await notify({ type: 'PROGRESS', done: ++done, total: manifest.assets.length, bytes, totalBytes: manifest.assets.reduce((n, a) => n + a.bytes, 0) });
  }
  if (!await verify(cache)) throw Error('The offline package is incomplete');
  await notify({ type: 'READY', version: manifest.version });
}
self.addEventListener('install', event => { event.waitUntil(installPackage()); });
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Retain the previous asset cache so already-open older clients can finish safely.
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'APPLY_UPDATE') { event.waitUntil(self.skipWaiting()); return; }
  if (event.data?.type === 'STATUS') {
    event.waitUntil((async () => {
      const ready = await verify(await caches.open(cacheName));
      event.ports[0]?.postMessage({ type: ready ? 'READY' : 'INCOMPLETE', version: manifest.version });
    })());
  }
  if (event.data?.type === 'INSTALL') event.waitUntil(installPackage().catch(error => notify({ type: 'ERROR', message: error.message })));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  const url = new URL(request.url);
  const target = request.mode === 'navigate' ? absolute('index.html') : url.origin + url.pathname;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const match = await cache.match(target);
    if (match) return match;
    // A previous version may still be open in a second tab after explicit activation.
    for (const name of await caches.keys()) {
      if (name.startsWith(prefix)) {
        const previous = await (await caches.open(name)).match(target);
        if (previous) return previous;
      }
    }
    return fetch(request);
  })());
});
