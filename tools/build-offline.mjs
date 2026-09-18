import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
const walk = dir => readdirSync(dir).flatMap(name => {
  const file = `${dir}/${name}`;
  return statSync(file).isDirectory() ? walk(file) : [file];
});
const files = walk('dist').filter(file => !file.endsWith('/sw.js') && !file.endsWith('/offline-manifest.json'));
const assets = files.map(file => ({ url: file.slice(5), bytes: statSync(file).size, hash: createHash('sha256').update(readFileSync(file)).digest('hex') }));
const version = createHash('sha256').update(JSON.stringify(assets)).digest('hex').slice(0, 16);
writeFileSync('dist/offline-manifest.json', JSON.stringify({ version, assets }, null, 2));
writeFileSync('dist/sw.js', readFileSync('src/pwa/sw.template.js', 'utf8').replace('__MANIFEST__', JSON.stringify({ version, assets })));
console.log(`Offline package ${version}: ${assets.length} files, ${assets.reduce((sum, a) => sum + a.bytes, 0)} bytes`);
