import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const sources = {
  original: 'public/art/residents-v2.png',
  base: 'docs/art/sources/resident-v8-clean-bases-alpha.png',
  male: 'docs/art/sources/resident-v8-male-outfits-rgb.png',
  female: 'docs/art/sources/resident-v8-female-outfits-alpha.png',
  hair: 'docs/art/sources/resident-v8-hair-alpha.png',
};
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1320 } });
  const packed = await page.evaluate(async urls => {
    const images = Object.fromEntries(await Promise.all(Object.entries(urls).map(async ([key, src]) => { const i = new Image(); i.src = src; await i.decode(); return [key, i]; })));
    const frames = {}, outfits = ['coat', 'vest', 'tunic', 'dress', 'skirt'], directions = ['down', 'right', 'up'];
    const poses = ['idle', 'step-left', 'passing', 'step-right'];
    const material = { ink: 1, skin: 2, hair: 3, cloth: 4, linen: 5, leather: 6, trousers: 7, brass: 8, eye: 9 };
    const rgba = (data, p) => Array.from(data.slice(p * 4, p * 4 + 4));
    const register = (name, canvas, kind, outfit, facing) => {
      const context = canvas.getContext('2d'), image = context.getImageData(0, 0, 32, 48), pixels = image.data, materials = new Uint8Array(1536);
      for (let y = 0; y < 48; y++) for (let x = 0; x < 32; x++) {
        const p = y * 32 + x, i = p * 4, [r, g, b, a] = rgba(pixels, p);
        const matte = kind === 'male' && Math.max(r, g, b) - Math.min(r, g, b) < 23 && Math.min(r, g, b) > 125;
        if (a < 128 || matte) { pixels.fill(0, i, i + 4); continue; }
        pixels[i + 3] = 255;
        const eye = facing === 'down' && y >= 13 && y <= 15 && (x >= 13 && x <= 14 || x >= 18 && x <= 19);
        const skin = r > 157 && r > g * 1.15 && g > b * 1.12 && (kind === 'hair' || kind === 'original' ? y < 19 || y >= 27 && y < 35 : y < 20 || y >= 28 && y < 36);
        let m = material.ink;
        if (eye) m = material.eye;
        else if (skin) m = material.skin;
        else if (kind === 'hair' || kind === 'original' && y < 18) m = material.hair;
        else if (y < 20 && kind === 'base') m = r < 70 ? material.ink : material.skin;
        else if (y >= 41) m = material.leather;
        else if (Math.max(r, g, b) - Math.min(r, g, b) < 22 && r < 115) m = material.trousers;
        else if (kind === 'base') m = y < 32 ? material.linen : y < 40 ? material.trousers : material.leather;
        else if (outfit === 'coat' && y <= 23 && r - g > 40 && g - b > 20) m = material.brass;
        else if (r > 140 && g > 110 && b > 70 || outfit === 'vest' && (facing === 'right' ? x < 18 : x < 12 || x > 21) && y < 31 || outfit === 'skirt' && y < 30) m = material.linen;
        else if (y > (outfit === 'vest' ? 31 : outfit === 'coat' ? 35 : outfit === 'dress' ? 40 : 38)) m = y >= 40 ? material.leather : material.trousers;
        else m = material.cloth;
        if (r + g + b < 74 && m !== material.eye) m = material.ink;
        materials[p] = m;
      }
      // Keep the single authored sprite. Discard detached matte specks, not real pixels.
      const visited = new Set(), components = [];
      for (let first = 0; first < 1536; first++) if (pixels[first * 4 + 3] && !visited.has(first)) {
        const queue = [first], group = []; visited.add(first);
        for (let n = 0; n < queue.length; n++) { const p = queue[n]; group.push(p); const x = p % 32, y = Math.floor(p / 32);
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy, q = yy * 32 + xx; if (xx >= 0 && xx < 32 && yy >= 0 && yy < 48 && pixels[q * 4 + 3] && !visited.has(q)) { visited.add(q); queue.push(q); } }
        } components.push(group);
      }
      components.sort((a, b) => b.length - a.length);
      for (const group of components.slice(1)) for (const p of group) { pixels.fill(0, p * 4, p * 4 + 4); materials[p] = 0; }
      context.putImageData(image, 0, 0);
      frames[name] = { pixels: Array.from(pixels), materials: Array.from(materials) };
    };
    const sample = (image, cx, sole, width = 248, height = 372, foot = 370) => {
      const c = document.createElement('canvas'); c.width = 32; c.height = 48; const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, cx - width / 2, sole - foot, width, height, 0, 0, 32, 48); return c;
    };
    const original = [{ c: [154, 444, 736, 1024], s: [399, 398, 398, 398] }, { c: [155, 437, 731, 1019], s: [836, 836, 836, 836] }, { c: [155, 441, 734, 1023], s: [1253, 1253, 1253, 1253] }];
    directions.forEach((facing, row) => poses.forEach((pose, col) => register(`original-${facing}-${pose}`, sample(images.original, original[row].c[col], original[row].s[col]), 'original', 'coat', facing)));
    for (const [body, col] of [['male', 0], ['female', 1]]) directions.forEach((facing, row) => register(`base-${body}-${facing}`, sample(images.base, col ? 696 : 320, [504, 980, 1446][row], 288, 432, 423), 'base', 'vest', facing));
    const centers = { male: [144, 385, 628, 867, 1108], female: [171, 400, 629, 854, 1080] };
    const soles = { male: [396, 792, 1179], female: [399, 788, 1182] };
    for (const body of ['male', 'female']) directions.forEach((facing, row) => outfits.forEach((outfit, col) => register(`body-${body}-${outfit}-${facing}`, sample(images[body], centers[body][col], soles[body][row]), body, outfit, facing)));
    const hairNames = ['short', 'cropped', 'swept', 'bob', 'long', 'braid'], hairCenters = [163, 449, 736, 1030, 1326, 1618], edges = [0, 305, 592, 885, 1175, 1470, 1774], rows = [0, 302, 580, 887];
    directions.forEach((facing, row) => hairNames.forEach((style, col) => {
      const c = document.createElement('canvas'); c.width = 32; c.height = 48; const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
      const sx = edges[col], sy = rows[row], sw = edges[col + 1] - sx, sh = rows[row + 1] - sy;
      ctx.drawImage(images.hair, sx, sy, sw, sh, 16 + (sx - hairCenters[col]) / 14, 19 + (sy - [274, 549, 817][row]) / 14, sw / 14, sh / 14);
      register(`head-${style}-${facing}`, c, 'hair', 'coat', facing);
    }));
    const c = document.createElement('canvas'); c.width = 1100; c.height = 1320; const ctx = c.getContext('2d'); ctx.fillStyle = '#29242e'; ctx.fillRect(0, 0, c.width, c.height); ctx.imageSmoothingEnabled = false; ctx.font = '11px monospace';
    Object.entries(frames).forEach(([name, frame], n) => { const x = n % 11 * 100, y = Math.floor(n / 11) * 200; const native = document.createElement('canvas'); native.width = 32; native.height = 48; const nx = native.getContext('2d'), d = nx.createImageData(32, 48); d.data.set(frame.pixels); nx.putImageData(d, 0, 0); ctx.drawImage(native, x, y + 20, 96, 144); ctx.fillStyle = '#efd9b1'; const parts = name.split('-'); ctx.fillText(parts.slice(0, -1).join('-'), x + 2, y + 178); ctx.fillText(parts.at(-1), x + 2, y + 192); });
    document.body.replaceChildren(c); document.body.style.cssText = 'margin:0;background:#29242e';
    return frames;
  }, Object.fromEntries(Object.entries(sources).map(([key, path]) => [key, `data:image/png;base64,${readFileSync(path).toString('base64')}`])));
  await page.screenshot({ path: '.local/resident-v8-native-layers.png' });
  const encoded = Object.fromEntries(Object.entries(packed).map(([key, value]) => [key, { pixels: Buffer.from(value.pixels).toString('base64'), materials: Buffer.from(value.materials).toString('base64') }]));
  writeFileSync('src/game/art/resident-raster-data.ts', '/** Measured original/generated raster layers. Reproducible sources and crops: docs/ART_RESIDENT_V7.md. */\nexport const RESIDENT_RASTER_DATA: Readonly<Record<string, { pixels: string; materials: string }>> = ' + JSON.stringify(encoded) + ';\n');
  writeFileSync('.local/resident-v8-unpacked.json', JSON.stringify(packed));
  mkdirSync('docs/art', { recursive: true });
  writeFileSync('docs/art/RESIDENT_V8_SOURCE_HASHES.json', JSON.stringify(Object.fromEntries(Object.entries(sources).map(([key, path]) => [key, { path, sha256: createHash('sha256').update(readFileSync(path)).digest('hex') }])), null, 2) + '\n');
  console.log(`Packed ${Object.keys(packed).length} native raster frames`);
} finally { await browser.close(); }
