import { test, expect, type Page } from '@playwright/test';
import { newWorld, continueWorld, joinCoop, backups, worldSlots } from './navigation';
import { offlineServer } from './offline-server';
import { walk, walkTo, inventory, action, dragFurniture } from './controls';
import { installRtcDiagnostics, reportRtcDiagnostics } from './rtc-diagnostics';

async function create(page: Page, name = 'Ada', slot: 1 | 2 = 1) {
  await newWorld(page, slot);
  await page.getByLabel('Your name', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Enter the castle' }).click();
  await expect(page.locator('#resident-label')).toContainText(name);
  await expect(page.locator('#game-canvas canvas')).toBeVisible();
}
test('title, two slots, personal rewards, reload and backup export', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?renderer=canvas');
  await expect(page.getByRole('heading', { name: /Haunted Chocolatier/ })).toBeVisible();
  await worldSlots(page, 'new');
  await expect(page.getByRole('button', { name: /World Save Slot/ })).toHaveCount(2);
  await page.locator('#close-dialog').click();
  await create(page);
  await walkTo(page, 'y', 294); await walkTo(page, 'x', 790); await walkTo(page, 'y', 266);
  await action(page);
  await expect(page.getByRole('heading', { name: 'Household pantry', exact: true, level: 2 })).toBeVisible();
  await page.locator('#close-dialog').click();
  await inventory(page);
  await expect(page.getByRole('button', { name: 'Cacao bean, 3' })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Save and return to title' }).click();
  await expect(page.locator('#continue')).toBeVisible();
  await expect(page.locator('#continue')).toBeEnabled();
  await page.reload();
  await continueWorld(page);
  await inventory(page);
  await expect(page.getByRole('button', { name: 'Cacao bean, 3' })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Save and return to title' }).click();
  await create(page, 'Bryn', 2);
  await page.getByRole('button', { name: 'Save and return to title' }).click();
  await backups(page);
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
  await continueWorld(coldPage);
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
  await installRtcDiagnostics(host, 'host'); await installRtcDiagnostics(guest, 'guest');
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
    catch (error) { console.log('Host pairing error:', await host.locator('#toast').textContent()); await reportRtcDiagnostics([host, guest], 'offer failure', true); throw error; }
    const offer = await host.locator('#pair-output').inputValue();
    await joinCoop(guest);
    await guest.locator('#pair-input').fill(offer);
    await guest.getByRole('button', { name: 'Create answer' }).click();
    await expect(guest.locator('#pair-output')).not.toHaveValue('', { timeout: 20000 });
    await host.locator('#pair-input').fill(await guest.locator('#pair-output').inputValue());
    await host.getByRole('button', { name: 'Connect', exact: true }).click();
    try { await expect(guest.locator('#resident-label')).toContainText('Player 2', { timeout: 20000 }); }
    catch (error) { console.log('Pairing status:', await host.locator('#toast').textContent(), await guest.locator('#toast').textContent()); await reportRtcDiagnostics([host, guest], 'pairing failure', true); throw error; }
    await reportRtcDiagnostics([host, guest], 'pairing success');
    await host.getByRole('button', { name: 'Close dialog' }).click();
  };
  await pair();
  await inventory(host, 'household'); await host.locator('#arrange-room').click();
  await dragFurniture(host, 'carpet', 16, 0);
  await host.locator('#save-layout').click();
  await expect(host.locator('#arrange-bar')).toHaveCount(0);
  await expect.poll(async () => JSON.parse((await host.locator('#game-canvas').getAttribute('data-layout'))!).carpet?.x ?? 0).toBeGreaterThan(0);
  const layout = await host.locator('#game-canvas').getAttribute('data-layout');
  await expect(guest.locator('#game-canvas')).toHaveAttribute('data-layout', layout!);
  // Remove the real HTTP origin while preserving the local network used by RTC.
  // Both existing peers and a fresh pairing must work without the web server.
  await server.stop();
  await expect(async () => { await fetch(server.url); }).rejects.toThrow();
  await walk(guest, 'ArrowUp', 7);
  await action(guest);
  await expect(guest.locator('dialog[open]')).toHaveCount(0);
  await expect(guest.locator('#game-canvas')).toHaveAttribute('data-light-state', /^true:/);
  await inventory(host, 'household');
  await expect(host.getByText(/The hearth is burning/)).toBeVisible();
  await host.getByRole('button', { name: 'Close dialog' }).click();
  await walkTo(guest, 'y', 290);
  await walkTo(guest, 'x', 782);
  await walkTo(guest, 'y', 266);
  await action(guest);
  await guest.locator('#close-dialog').click();
  await walkTo(guest, 'y', 365);
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
