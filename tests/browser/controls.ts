import { expect, type Page } from '@playwright/test';

export async function position(page: Page) {
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-player-x', /\d/);
  return page.locator('#game-canvas').evaluate(element => ({ x: Number((element as HTMLElement).dataset.playerX), y: Number((element as HTMLElement).dataset.playerY) }));
}
export async function walk(page: Page, key: string, count: number) {
  const before = await position(page);
  const axis = key === 'ArrowLeft' || key === 'ArrowRight' ? 'x' : 'y';
  const sign = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1;
  const target = before[axis] + sign * count * 14;
  await moveTo(page, key, axis, sign, target, Math.max(15000, count * 350 + 4000), 1);
}
export async function walkTo(page: Page, axis: 'x' | 'y', target: number) {
  const before = await position(page), sign = Math.sign(target - before[axis]);
  if (Math.abs(target - before[axis]) <= 7) return;
  const key = axis === 'x' ? sign > 0 ? 'ArrowRight' : 'ArrowLeft' : sign > 0 ? 'ArrowDown' : 'ArrowUp';
  await moveTo(page, key, axis, sign, target, 20000, 7);
}
async function moveTo(page: Page, key: string, axis: 'x' | 'y', sign: number, target: number, timeout: number, tolerance: number) {
  const before = await position(page), deadline = Date.now() + timeout;
  const progress = async () => sign * (Number(await page.locator('#game-canvas').getAttribute(`data-player-${axis}`)) - target);
  const state = () => page.locator('#game-canvas').evaluate((element, coordinate) => ({
    coordinate: Number(element.getAttribute(`data-player-${coordinate}`)),
    sleeping: element.getAttribute('data-sleeping') === 'true',
  }), axis);
  try {
    // Protocol/VM latency can delay key-up after polling. Release well before a narrow
    // waypoint, then release each fine movement only after the game has observed it.
    if (await progress() < -84) {
      await page.keyboard.down(key);
      try { await expect.poll(progress, { timeout, intervals: [30] }).toBeGreaterThanOrEqual(-84); }
      finally { await page.keyboard.up(key); }
      await page.waitForTimeout(200);
    }
    for (;;) {
      const current = await state();
      // An already-resting resident no longer accepts movement.
      if (current.sleeping || Math.abs(current.coordinate - target) <= tolerance) return;
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error(`Movement did not reach ${axis}=${target} within ${timeout}ms`);
      const fineKey = axis === 'x' ? current.coordinate < target ? 'ArrowRight' : 'ArrowLeft'
        : current.coordinate < target ? 'ArrowDown' : 'ArrowUp';
      // Release inside the page on its first authoritative step. A separate CDP
      // key-up can arrive several frames late when two software renderers share a VM.
      await page.evaluate(({ coordinate, previous, key }) => {
        const element = document.querySelector('#game-canvas')!;
        const code = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 }[key]!;
        const observer = new MutationObserver(() => {
          if (Number(element.getAttribute(`data-player-${coordinate}`)) === previous) return;
          observer.disconnect(); clearTimeout(timer);
          window.dispatchEvent(new KeyboardEvent('keyup', { key, code: key, keyCode: code, which: code, bubbles: true }));
        });
        const timer = setTimeout(() => observer.disconnect(), 2000);
        observer.observe(element, { attributes: true, attributeFilter: [`data-player-${coordinate}`] });
      }, { coordinate: axis, previous: current.coordinate, key: fineKey });
      await page.keyboard.down(fineKey);
      try {
        // A fixed short pulse can end before Phaser's next update on a busy device.
        // Wait for a real authoritative step; a blocked route fails with its position.
        await page.waitForFunction(({ coordinate, previous }) => Number(document.querySelector('#game-canvas')?.getAttribute(`data-player-${coordinate}`)) !== previous,
          { coordinate: axis, previous: current.coordinate }, { timeout: Math.min(2000, remaining), polling: 'raf' });
      } finally { await page.keyboard.up(fineKey); }
      const released = await state();
      await page.waitForTimeout(200);
      if (released.sleeping) return;
    }
  }
  catch (error) {
    console.error('Walk target not reached', { before, axis, target, current: await position(page),
      map: await page.locator('#game-canvas').getAttribute('data-player-map'), sleeping: await page.locator('#game-canvas').getAttribute('data-sleeping') });
    throw error;
  }
  finally { await page.keyboard.up(key); }
}
export async function inventory(page: Page, tab: 'items' | 'journal' | 'missions' | 'household' | 'session' = 'items') {
  await page.locator('#inventory-toggle').click();
  // Unread discoveries open Missions first, so select the requested section explicitly.
  await page.locator(`#tab-${tab}`).click();
  await expect(page.locator(`#tab-${tab}`)).toHaveAttribute('aria-pressed', 'true');
}
export async function action(page: Page, target?: string) {
  await page.locator('#action-a').click();
  if (target) await page.locator(`[data-action="${target}"]`).click();
}
