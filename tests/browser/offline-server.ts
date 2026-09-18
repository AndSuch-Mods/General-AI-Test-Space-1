import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

/** A real unavailable origin tests cache-only navigation without offline emulation. */
export async function offlineServer() {
  const root = resolve('dist');
  const server = createServer((request, response) => {
    void (async () => {
      const url = new URL(request.url!, 'http://localhost');
      const path = resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
      if (!path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
      const content = await readFile(path);
      const mime: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
      response.writeHead(200, { 'Content-Type': mime[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(content);
    })().catch(() => { response.writeHead(404).end(); });
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address() as { port: number };
  const stop = () => new Promise<void>((done, reject) => {
    if (!server.listening) { done(); return; }
    server.close(error => error ? reject(error) : done()); server.closeAllConnections();
  });
  return { url: `http://127.0.0.1:${address.port}`, stop };
}
