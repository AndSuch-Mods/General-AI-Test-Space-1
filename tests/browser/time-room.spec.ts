import { test, expect, type Page } from '@playwright/test';
import { action, inventory, position, walkTo } from './controls';

async function create(page: Page) {
  await page.goto('/?renderer=canvas');
  await page.locator('#solo').click();
  await page.getByRole('button', { name: 'Enter the castle' }).click();
  await position(page);
}
async function bed(page: Page) {
  await walkTo(page, 'y', 355);
  await walkTo(page, 'x', 270);
  await walkTo(page, 'y', 302);
  await page.keyboard.down('ArrowLeft');
  try { await expect(page.locator('#confirm-sleep')).toBeVisible(); } finally { await page.keyboard.up('ArrowLeft'); }
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-sleeping', 'false');
  await page.locator('#confirm-sleep').click();
}
const minutes = async (page: Page) => {
  const value = (await page.locator('#game-clock').textContent())!.split(':').map(Number);
  return value[0] * 60 + value[1];
};

test('bed entry advances solo time, windows change, menus pause and the new day survives reload', async ({ page }) => {
  await create(page);
  await bed(page);
  await expect.poll(() => minutes(page)).toBeGreaterThanOrEqual(360);
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-day-phase', 'dawn');
  await expect(page.locator('#sleep-overlay')).toBeHidden();
  await inventory(page);
  const paused = await minutes(page); await page.waitForTimeout(2200);
  expect(await minutes(page)).toBe(paused);
  await page.locator('#action-b').click();
  const beforeSecond = Number(await page.locator('#game-canvas').getAttribute('data-total-minutes'));
  await bed(page);
  await expect.poll(async () => Number(await page.locator('#game-canvas').getAttribute('data-total-minutes'))).toBeGreaterThan(beforeSecond + 1400);
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-day-phase', 'dawn');
  await page.locator('#leave').click(); await page.reload(); await page.locator('#solo').click();
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-day-phase', 'dawn');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-sleeping', 'false');
});

test('exit door reaches a saved living room and returns through its own door', async ({ page }) => {
  await create(page);
  await walkTo(page, 'y', 258); await walkTo(page, 'x', 685);
  await action(page);
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-player-map', 'living');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-nearest-object', 'door-left');
  await page.locator('#leave').click(); await page.reload(); await page.locator('#solo').click();
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-player-map', 'living');
  await action(page);
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-player-map', 'castle');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-nearest-object', 'door-out');
});

test('co-op residents separate maps, keep time through private menus and rest independently', async ({ browser, browserName }) => {
  test.setTimeout(180000);
  const first = await browser.newContext({ viewport: { width: 844, height: 390 } });
  const second = await browser.newContext({ viewport: { width: 844, height: 390 } });
  try {
    const host = await first.newPage(), guest = await second.newPage();
    await create(host); await guest.goto('/?renderer=canvas');
    test.skip(!await host.evaluate(() => typeof RTCPeerConnection === 'function'), `${browserName} runtime has no RTCPeerConnection; two-iPhone checks remain required.`);
    await inventory(host, 'session'); await host.locator('#session').click();
    await expect(host.locator('#pair-output')).not.toHaveValue('', { timeout: 20000 });
    await guest.locator('#join').click();
    await guest.locator('#pair-input').fill(await host.locator('#pair-output').inputValue());
    await guest.locator('#create-answer').click();
    await expect(guest.locator('#pair-output')).not.toHaveValue('', { timeout: 20000 });
    await host.locator('#pair-input').fill(await guest.locator('#pair-output').inputValue());
    await host.locator('#accept').click();
    await expect(guest.locator('#resident-label')).toContainText('Player 2', { timeout: 20000 });
    await host.locator('#action-b').click();
    await inventory(host);
    const before = await minutes(guest);
    await expect.poll(() => minutes(guest), { timeout: 6000 }).toBeGreaterThan(before);
    await host.locator('#action-b').click();
    await walkTo(guest, 'y', 258); await walkTo(guest, 'x', 685); await action(guest);
    await expect(guest.locator('#game-canvas')).toHaveAttribute('data-player-map', 'living');
    await expect(host.locator('#game-canvas')).toHaveAttribute('data-player-map', 'castle');
    await expect.poll(async () => (await host.locator('#game-canvas').getAttribute('data-visible-players'))?.split(',').length).toBe(1);
    await bed(host);
    await expect(host.locator('#sleep-overlay')).toBeVisible();
    const whileResting = await minutes(guest);
    await guest.waitForTimeout(2200);
    expect(await minutes(guest)).toBeGreaterThan(whileResting);
    expect(await minutes(guest)).toBeLessThan(whileResting + 10);
    await expect(guest.locator('#game-canvas')).toHaveAttribute('data-sleeping', 'false');
    await host.locator('#action-b').click();
    await expect(host.locator('#sleep-overlay')).toBeHidden();
    await action(guest); // Return through the living room's left door.
    await expect(guest.locator('#game-canvas')).toHaveAttribute('data-player-map', 'castle');
    await bed(guest); await expect(guest.locator('#sleep-overlay')).toBeVisible();
    await bed(host);
    await expect.poll(async () => {
      const [hx, gx] = await Promise.all([host.locator('#game-canvas').getAttribute('data-player-x'), guest.locator('#game-canvas').getAttribute('data-player-x')]);
      return Math.abs(Number(hx) - Number(gx));
    }, { intervals: [30] }).toBe(54);
    await expect(host.locator('#night-transition')).toBeVisible();
    await expect(host.locator('#game-canvas')).toHaveAttribute('data-day-phase', 'dawn');
    await expect(guest.locator('#game-canvas')).toHaveAttribute('data-day-phase', 'dawn');
    await expect(host.locator('#sleep-overlay')).toBeHidden();
    await expect(guest.locator('#sleep-overlay')).toBeHidden();
    expect(Math.abs(await minutes(host) - await minutes(guest))).toBeLessThanOrEqual(1);
  } finally { await first.close(); await second.close(); }
});
