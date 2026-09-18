export class OfflinePackage {
  registration?: ServiceWorkerRegistration;
  ready = false;
  updateReady = false;
  label = 'Online, offline package incomplete';
  constructor(private changed: () => void) {}
  async start() {
    if (!('serviceWorker' in navigator) || import.meta.env.DEV) {
      this.label = 'Offline installation is available in the production build'; this.changed(); return;
    }
    navigator.serviceWorker.addEventListener('message', event => {
      const data = event.data;
      if (data.type === 'PROGRESS') this.label = `Downloading offline package · ${data.done}/${data.total} files · ${(data.bytes / 1048576).toFixed(1)} MB`;
      if (data.type === 'READY') void this.refresh();
      if (data.type === 'ERROR') { this.label = data.message; this.ready = false; }
      this.changed();
    });
    try {
      this.registration = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
      this.registration.addEventListener('updatefound', () => {
        this.registration?.installing?.addEventListener('statechange', () => { void this.refresh(); });
      });
      void navigator.serviceWorker.ready.then(() => this.refresh());
      await this.refresh();
      window.addEventListener('online', () => { void this.refresh(); });
      window.addEventListener('offline', () => { void this.refresh(); });
    } catch { this.label = 'Offline installation failed. Check your connection and try again.'; this.changed(); }
  }
  async refresh() {
    this.updateReady = !!this.registration?.waiting;
    const worker = this.registration?.active;
    if (worker) {
      const channel = new MessageChannel();
      this.ready = await new Promise<boolean>(resolve => {
        const timeout = setTimeout(() => { channel.port1.close(); resolve(false); }, 4000);
        channel.port1.onmessage = event => { clearTimeout(timeout); channel.port1.close(); resolve(event.data.type === 'READY'); };
        worker.postMessage({ type: 'STATUS' }, [channel.port2]);
      });
      this.label = this.ready ? navigator.onLine ? 'Ready for offline play' : 'Running offline' : 'Online, offline package incomplete';
    }
    this.changed();
  }
  async install() {
    await navigator.storage?.persist?.().catch(() => false);
    if (!this.registration) await this.start();
    (this.registration?.active ?? this.registration?.installing)?.postMessage({ type: 'INSTALL' });
    await this.refresh();
  }
  applyUpdate() {
    if (!this.registration?.waiting) return;
    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
    this.registration.waiting.postMessage({ type: 'APPLY_UPDATE' });
  }
}
