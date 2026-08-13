// Retirement worker: CM2109 no longer uses a service worker.
// This file exists only so previously installed copies can receive this update,
// clear the old CM2109 caches, and unregister the worker.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('cm2109-')).map(key => caches.delete(key)));
    await self.registration.unregister();
  })());
});
