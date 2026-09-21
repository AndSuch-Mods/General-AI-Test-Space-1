import { test, expect } from '@playwright/test';
import { action, inventory, position, walk, walkTo } from './controls';

test.beforeEach(async ({ page }) => {
  await page.goto('/?renderer=canvas');
  await page.getByRole('button', { name: /^Single Player/ }).click();
  await page.getByRole('button', { name: 'Enter the castle' }).click();
  await position(page);
});

test('floating touch controls, compact HUD and movement cancellation', async ({ page }) => {
  await expect(page.locator('.chapter-note,.touch-pad,.arrival-help,.interact-button,#inventory-more,.quick-more')).toHaveCount(0);
  await expect(page.locator('#thumbstick')).toBeHidden();
  await expect(page.locator('#game-clock')).toHaveText(/^\d{2}:\d{2}$/);
  await expect(page.locator('.quick-slot')).toHaveCount(7);
  for (const width of [844, 667]) {
    await page.setViewportSize({ width, height: 390 });
    const targets = await page.locator('.hud-button,.quick-slot,.action-key').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect(); return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }));
    for (const target of targets) { expect(target.width).toBeGreaterThanOrEqual(44); expect(target.height).toBeGreaterThanOrEqual(44); expect(target.x).toBeGreaterThanOrEqual(0); expect(target.x + target.width).toBeLessThanOrEqual(width); }
  }
  const before = await position(page);
  await page.mouse.move(110, 220); await page.mouse.down();
  await expect(page.locator('#thumbstick')).toBeVisible();
  await page.mouse.move(155, 220);
  await expect.poll(async () => (await position(page)).x).toBeGreaterThan(before.x + 28);
  await page.mouse.up();
  await expect(page.locator('#thumbstick')).toBeHidden();
  await page.waitForTimeout(180);
  const released = await position(page); await page.waitForTimeout(250);
  expect(await position(page)).toEqual(released);
  // A cancelled touch must stop too; no browser default scrolling or stuck stick.
  await page.mouse.move(100, 220);
  await page.locator('#touch-surface').evaluate(element => element.addEventListener('pointerdown', event => { (element as HTMLElement).dataset.testPointer = String((event as PointerEvent).pointerId); }, { once: true }));
  await page.mouse.down(); await page.mouse.move(55, 220);
  const pointerId = Number(await page.locator('#touch-surface').getAttribute('data-test-pointer'));
  await page.locator('#touch-surface').dispatchEvent('pointercancel', { pointerId });
  await page.mouse.up();
  await expect(page.locator('#thumbstick')).toBeHidden();
  await inventory(page, 'missions');
  await expect(page.locator('#notification-dot')).toBeHidden();
  await expect(page.getByText('Read the sealed letter', { exact: true })).toBeVisible();
  const inMenu = await position(page);
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(250); await page.keyboard.up('ArrowRight');
  expect(await position(page)).toEqual(inMenu);
});

test('left/right profiles, bed collision and furniture interaction at the closer camera', async ({ page }) => {
  await page.keyboard.down('ArrowLeft');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-player-facing', 'left');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-player-flip-x', 'true');
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.down('ArrowRight');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-player-facing', 'right');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-player-flip-x', 'false');
  await page.keyboard.up('ArrowRight');
  await expect.poll(async () => Number(await page.locator('#game-canvas').getAttribute('data-render-scale'))).toBeGreaterThan(1);
  const start = await position(page);
  await walk(page, 'ArrowLeft', Math.round((start.x - 190) / 14));
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(650); await page.keyboard.up('ArrowUp');
  const stopped = await position(page);
  expect(stopped.y).toBeGreaterThanOrEqual(348);
  expect(stopped.y).toBeLessThanOrEqual(352);
  await action(page);
  await expect(page.getByRole('heading', { name: 'Rest until morning?' })).toBeVisible();
  await page.locator('#cancel-sleep').click();
  await page.locator('#leave').click();
  await page.getByRole('button', { name: /Continue \/ Single Player/ }).click();
  expect(await position(page)).toEqual(stopped);
});

test('candle choices persist and seven quick slots retain items while migrating older five-slot settings', async ({ page }) => {
  await walkTo(page, 'y', 308); await walkTo(page, 'x', 416);
  await action(page);
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-light-state', /:false:/);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await walkTo(page, 'x', 362); await action(page);
  await expect(page.getByRole('heading', { name: 'A letter that waited' })).toBeVisible();
  await page.locator('#action-a').click();
  await inventory(page, 'journal');
  await expect(page.getByText('A letter that waited', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await walkTo(page, 'y', 294); await walkTo(page, 'x', 790);
  await action(page);
  await expect(page.getByRole('heading', { name: 'A practical welcome' })).toBeVisible();
  await page.locator('#finish-story').click();
  await inventory(page);
  await page.getByRole('button', { name: 'Cacao bean, 3' }).click();
  await expect(page.locator('.assign-slots button')).toHaveCount(7);
  await page.getByRole('button', { name: 'Assign to quick slot 7' }).click();
  await expect(page.locator('#quick-slot-7')).toHaveAttribute('aria-label', 'Quick slot 7: Cacao bean, 3');
  await page.locator('#leave').click();
  await expect(page.getByRole('button', { name: /Continue \/ Single Player/ })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /Continue \/ Single Player/ }).click();
  await expect(page.locator('#quick-slot-7')).toHaveAttribute('aria-label', 'Quick slot 7: Cacao bean, 3');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-light-state', 'false:false:true');
  await page.locator('#leave').click();
  await expect(page.getByRole('button', { name: /Continue \/ Single Player/ })).toBeVisible();
  // The previous released UI stored five slots. Keep those references and append two empty slots.
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('twilight-v1');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction(['saves', 'settings'], 'readwrite');
      const saved = transaction.objectStore('saves').get(1);
      saved.onsuccess = () => {
        const world = saved.result.world;
        transaction.objectStore('settings').put({ key: `quickSlots:${world.worldId}:${world.hostId}`,
          value: { slots: ['cacao-bean', null, null, null, null], selected: 4, seen: '' } });
      };
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => { database.close(); reject(transaction.error); };
    };
  }));
  await page.reload();
  await page.getByRole('button', { name: /Continue \/ Single Player/ }).click();
  await expect(page.locator('.quick-slot')).toHaveCount(7);
  await expect(page.locator('#quick-slot-1')).toHaveAttribute('aria-label', 'Quick slot 1: Cacao bean, 3');
  await expect(page.locator('#quick-slot-5')).toHaveAttribute('aria-pressed', 'true');
  for (const slot of [6, 7]) await expect(page.locator(`#quick-slot-${slot}`)).toHaveAttribute('aria-label', `Quick slot ${slot}: empty`);
});
