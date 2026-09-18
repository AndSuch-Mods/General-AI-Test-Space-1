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
  await page.keyboard.down(key);
  try { await expect.poll(async () => sign * (Number(await page.locator('#game-canvas').getAttribute(`data-player-${axis}`)) - target), { timeout: count * 350 + 2500, intervals: [30] }).toBeGreaterThanOrEqual(-1); }
  finally { await page.keyboard.up(key); }
}
export async function walkTo(page: Page, axis: 'x' | 'y', target: number) {
  const before = await position(page), sign = Math.sign(target - before[axis]);
  if (Math.abs(target - before[axis]) <= 7) return;
  const key = axis === 'x' ? sign > 0 ? 'ArrowRight' : 'ArrowLeft' : sign > 0 ? 'ArrowDown' : 'ArrowUp';
  await page.keyboard.down(key);
  try { await expect.poll(async () => sign * (Number(await page.locator('#game-canvas').getAttribute(`data-player-${axis}`)) - target), { timeout: 12000, intervals: [30] }).toBeGreaterThanOrEqual(-1); }
  finally { await page.keyboard.up(key); }
}
export async function inventory(page: Page, tab: 'items' | 'journal' | 'missions' | 'household' | 'session' = 'items') {
  await page.locator('#inventory-more').click();
  if (tab !== 'items') await page.locator(`#tab-${tab}`).click();
}
export async function action(page: Page, target?: string) {
  const bounds = await page.locator('#touch-surface').boundingBox();
  await page.locator('#touch-surface').click({ position: { x: bounds!.width * .8, y: bounds!.height * .58 } });
  if (target) await page.locator(`[data-action="${target}"]`).click();
}
