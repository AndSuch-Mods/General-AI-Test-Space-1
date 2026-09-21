import { test, expect } from '@playwright/test';
import { action, inventory, position, walkTo } from './controls';

test('arrangement previews, cancels and saves; containers finish opening before their bottom sheet', async ({ page }) => {
  await page.goto('/?renderer=canvas'); await page.locator('#solo').click();
  await page.getByRole('button', { name: 'Enter the castle' }).click(); await position(page);
  await inventory(page, 'household'); await page.locator('#arrange-room').click();
  await page.locator('[data-furnishing="carpet"]').click();
  await page.keyboard.down('ArrowRight');
  try { await expect.poll(async () => Number(await page.locator('#game-canvas').getAttribute('data-placement-x'))).toBeGreaterThan(0); }
  finally { await page.keyboard.up('ArrowRight'); }
  await page.locator('#action-a').click();
  await expect(page.locator('#arrange-bar')).toHaveCount(0);
  const saved = await page.locator('#game-canvas').getAttribute('data-layout');
  expect(JSON.parse(saved!).carpet.x).toBeGreaterThan(0);
  await inventory(page, 'household'); await page.locator('#arrange-room').click();
  await page.locator('[data-furnishing="plant"]').click(); await page.locator('#action-b').click();
  expect(await page.locator('#game-canvas').getAttribute('data-layout')).toBe(saved);
  await walkTo(page, 'x', 745); await action(page);
  await expect(page.getByRole('heading', { name: 'Household chest', exact: true, level: 2 })).toBeVisible();
  expect(JSON.parse((await page.locator('#game-canvas').getAttribute('data-container-poses'))!).chest).toBe(1);
  const sheet = await page.locator('dialog').boundingBox(); expect(sheet!.y).toBeGreaterThan(170);
  await page.locator('#action-b').click(); await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect.poll(async () => JSON.parse((await page.locator('#game-canvas').getAttribute('data-container-poses'))!).chest).toBe(0);
  await page.locator('#leave').click(); await page.reload(); await page.locator('#solo').click();
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-layout', saved!);
});

test('original audio produces a signal offline and obeys persisted sound/music switches', async ({ page, context }) => {
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    if (!Native) return;
    window.AudioContext = class extends Native {
      createDynamicsCompressor() {
        const node = super.createDynamicsCompressor(), connect = node.connect.bind(node);
        node.connect = ((destination: AudioNode) => {
          if (destination === this.destination) {
            const probe = this.createAnalyser(); probe.fftSize = 2048;
            connect(probe); probe.connect(destination);
            (window as Window & { audioProbe?: AnalyserNode }).audioProbe = probe;
            return destination;
          }
          return connect(destination);
        }) as typeof node.connect;
        return node;
      }
    };
  });
  await page.goto('/?renderer=canvas');
  await expect(page.locator('#offline-label')).toHaveText('Ready for offline play', { timeout: 30000 });
  await context.setOffline(true); await page.locator('#settings').click();
  const signal = () => page.evaluate(() => {
    const probe = (window as Window & { audioProbe?: AnalyserNode }).audioProbe;
    if (!probe) return 0;
    const samples = new Float32Array(probe.fftSize); probe.getFloatTimeDomainData(samples);
    return Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
  });
  await expect.poll(signal).toBeGreaterThan(.00001);
  expect(await signal()).toBeLessThan(.5);
  await page.locator('#music-enabled').uncheck();
  await expect.poll(signal, { timeout: 5000 }).toBeLessThan(.000005);
  await page.locator('#music-enabled').check(); await expect.poll(signal).toBeGreaterThan(.00001);
  await page.locator('#audio-enabled').uncheck(); await expect.poll(signal).toBeLessThan(.000005);
  await page.locator('#close-dialog').click();
  // Audio above is verified offline; persistence below is independent of WebKit's
  // emulated-offline reload bug. Cold offline navigation has its own origin-stop test.
  await context.setOffline(false); await page.reload(); await page.locator('#settings').click();
  await expect(page.locator('#audio-enabled')).not.toBeChecked(); expect(await signal()).toBe(0);
});
