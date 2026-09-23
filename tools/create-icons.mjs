import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
// Package the supplied artwork at platform sizes without redrawing or cropping it.
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.local/browsers');
const { chromium } = await import('@playwright/test');
const source = readFileSync('docs/art/home-icon-20260923.jpg').toString('base64');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  for (const size of [180, 192, 512]) {
    const data = await page.evaluate(async ({ source, size }) => {
      const image = new Image(); image.src = `data:image/jpeg;base64,${source}`; await image.decode();
      if (image.width !== image.height) throw Error('The home icon source must be square.');
      const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
      const context = canvas.getContext('2d'); context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, size, size); return canvas.toDataURL('image/png').split(',')[1];
    }, { source, size });
    writeFileSync(`public/icons/twilight-castle-${size}.png`, Buffer.from(data, 'base64'));
  }
} finally { await browser.close(); }
