import { test, expect, type Page } from '@playwright/test';
import { offlineServer } from './offline-server';
import { walk, walkTo, inventory, action } from './controls';

async function create(page: Page, name = 'Ada') {
  await page.getByRole('button', { name: /^Single Player/ }).click();
  await page.getByLabel('Your name', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Enter the castle' }).click();
  await expect(page.locator('#resident-label')).toContainText(name);
  await expect(page.locator('#game-canvas canvas')).toBeVisible();
}
test('title, two slots, personal rewards, reload and backup export', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?renderer=canvas');
  await expect(page.getByRole('heading', { name: /Haunted Chocolatier/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /World Save Slot/ })).toHaveCount(2);
  await create(page);
  await walk(page, 'ArrowUp', 5); await walk(page, 'ArrowRight', 19);
  await action(page);
  await expect(page.getByRole('heading', { name: 'A practical welcome' })).toBeVisible();
  await page.locator('#finish-story').click();
  await inventory(page);
  await expect(page.getByRole('button', { name: 'Cacao bean, 3' })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Save and return to title' }).click();
  await expect(page.getByRole('button', { name: /Continue \/ Single Player/ })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /Continue \/ Single Player/ }).click();
  await inventory(page);
  await expect(page.getByRole('button', { name: 'Cacao bean, 3' })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Save and return to title' }).click();
  await page.getByRole('button', { name: /World Save Slot 2/ }).click();
  await create(page, 'Bryn');
  await page.getByRole('button', { name: 'Save and return to title' }).click();
  await page.getByRole('button', { name: 'Backups', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export both saves' }).click();
  expect((await download).suggestedFilename()).toBe('twilight-worlds.json');
  expect(errors).toEqual([]);
});
test('offline package survives a cold page and permits save/load without its origin', async ({ page, context }) => {
  const server = await offlineServer();
  try {
  await page.goto(server.url + '/?renderer=canvas');
  await expect(page.locator('#offline-label')).toHaveText('Ready for offline play', { timeout: 30000 });
  await create(page);
  await page.getByRole('button', { name: 'Save and return to title' }).click();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await server.stop();
  await expect(async () => { await fetch(server.url); }).rejects.toThrow();
  await page.close();
  const coldPage = await context.newPage();
  await coldPage.goto(server.url + '/?renderer=canvas');
  await expect(coldPage.locator('#offline-label')).toHaveText('Ready for offline play');
  await coldPage.getByRole('button', { name: /Continue \/ Single Player/ }).click();
  await expect(coldPage.locator('#game-canvas canvas')).toBeVisible();
  await inventory(coldPage, 'journal');
  await expect(coldPage.getByText('The first page is waiting.')).toBeVisible();
  } finally { await server.stop(); }
});
test('manual WebRTC pairing, shared props and storage, independent discoveries and guest reconnect', async ({ browser, browserName }) => {
  test.setTimeout(180000);
  const first = await browser.newContext({ viewport: { width: 1000, height: 650 } });
  const second = await browser.newContext({ viewport: { width: 1000, height: 650 } });
  const server = await offlineServer();
  try {
  const host = await first.newPage(); const guest = await second.newPage();
  for (const page of [host, guest]) {
    page.on('pageerror', error => console.log(browserName, 'page error', error.message));
  }
  await host.goto(server.url + '/?renderer=canvas'); await guest.goto(server.url + '/?renderer=canvas'); await create(host, 'Host');
  const supportsRTC = await host.evaluate(() => typeof RTCPeerConnection === 'function');
  test.skip(!supportsRTC, `${browserName} runtime has no RTCPeerConnection; real two-iPhone transport testing remains required.`);
  const pair = async () => {
    await inventory(host, 'session');
    await host.locator('#session').click();
    try { await expect(host.locator('#pair-output')).not.toHaveValue('', { timeout: 20000 }); }
    catch (error) { console.log('Host pairing error:', await host.locator('#toast').textContent()); throw error; }
    const offer = await host.locator('#pair-output').inputValue();
    await guest.getByRole('button', { name: 'Join Co-op', exact: true }).click();
    await guest.locator('#pair-input').fill(offer);
    await guest.getByRole('button', { name: 'Create answer' }).click();
    await expect(guest.locator('#pair-output')).not.toHaveValue('', { timeout: 20000 });
    await host.locator('#pair-input').fill(await guest.locator('#pair-output').inputValue());
    await host.getByRole('button', { name: 'Connect', exact: true }).click();
    try { await expect(guest.locator('#resident-label')).toContainText('Player 2', { timeout: 20000 }); }
    catch (error) { console.log('Pairing status:', await host.locator('#toast').textContent(), await guest.locator('#toast').textContent()); throw error; }
    await host.getByRole('button', { name: 'Close dialog' }).click();
  };
  await pair();
  await inventory(host, 'household'); await host.locator('#arrange-room').click();
  await host.locator('[data-furnishing="carpet"]').click();
  await host.keyboard.down('ArrowRight');
  try { await expect.poll(async () => Number(await host.locator('#game-canvas').getAttribute('data-placement-x'))).toBeGreaterThan(0); }
  finally { await host.keyboard.up('ArrowRight'); }
  await host.locator('#action-a').click();
  await expect(host.locator('#arrange-bar')).toHaveCount(0);
  const layout = await host.locator('#game-canvas').getAttribute('data-layout');
  await expect(guest.locator('#game-canvas')).toHaveAttribute('data-layout', layout!);
  // Remove the real HTTP origin while preserving the local network used by RTC.
  // Both existing peers and a fresh pairing must work without the web server.
  await server.stop();
  await expect(async () => { await fetch(server.url); }).rejects.toThrow();
  await walk(guest, 'ArrowUp', 5);
  await action(guest);
  await expect(guest.locator('dialog[open]')).toHaveCount(0);
  await expect(guest.locator('#game-canvas')).toHaveAttribute('data-light-state', /^true:/);
  await inventory(host, 'household');
  await expect(host.getByText(/The hearth is burning/)).toBeVisible();
  await host.getByRole('button', { name: 'Close dialog' }).click();
  await walkTo(guest, 'y', 290);
  await walkTo(guest, 'x', 782);
  await action(guest);
  await guest.locator('#finish-story').click();
  await walkTo(guest, 'y', 355);
  await action(guest);
  await expect(guest.getByRole('heading', { name: 'Household chest', exact: true, level: 2 })).toBeVisible();
  await guest.locator('#chest-deposit').click();
  await guest.getByRole('button', { name: 'Close dialog' }).click();
  await walkTo(host, 'x', 745);
  await action(host);
  await expect(host.locator('#chest-content')).toContainText('1 cacao bean');
  await host.locator('#chest-withdraw').click();
  await expect(host.locator('#chest-content')).toContainText('0 cacao beans');
  await host.getByRole('button', { name: 'Close dialog' }).click();
  await guest.getByRole('button', { name: 'Save and return to title' }).click();
  await expect(host.locator('#toast')).toContainText('Player 2 disconnected');
  await pair();
  await inventory(guest);
  await expect(guest.getByRole('button', { name: 'Cacao bean, 2' })).toBeVisible();
  await inventory(host);
  await expect(host.getByRole('button', { name: 'Cacao bean, 1' })).toBeVisible();
  } finally { await server.stop(); await first.close(); await second.close(); }
});
