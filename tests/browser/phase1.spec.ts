import { test, expect, type Page } from '@playwright/test';
import { offlineServer } from './offline-server';

async function create(page: Page, name = 'Ada') {
  await page.getByRole('button', { name: /^Single Player/ }).click();
  await page.getByLabel('Your name', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Enter the castle' }).click();
  await expect(page.locator('#resident-label')).toContainText(name);
  await expect(page.locator('canvas')).toBeVisible();
}
async function walk(page: Page, key: string, count: number) {
  for (let i = 0; i < count; i++) {
    await page.getByRole('button', { name: `Move ${key.replace('Arrow', '').toLowerCase()}`, exact: true }).click();
    await page.waitForTimeout(130);
  }
}
test('title, two slots, personal rewards, reload and backup export', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?renderer=canvas');
  await expect(page.getByRole('heading', { name: /Haunted Chocolatier/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /World Save Slot/ })).toHaveCount(2);
  await create(page);
  await walk(page, 'ArrowUp', 5); await walk(page, 'ArrowRight', 19);
  await page.getByRole('button', { name: 'Interact' }).click();
  await expect(page.getByRole('heading', { name: 'A practical welcome' })).toBeVisible();
  await page.getByRole('button', { name: 'Carry on' }).click();
  await page.getByRole('button', { name: 'Journal & satchel' }).click();
  await expect(page.getByText('3 cacao bean')).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Save & title' }).click();
  await page.reload();
  await page.getByRole('button', { name: /Continue \/ Single Player/ }).click();
  await page.getByRole('button', { name: 'Journal & satchel' }).click();
  await expect(page.getByText('3 cacao bean')).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Save & title' }).click();
  await page.getByRole('button', { name: /World Save Slot 2/ }).click();
  await create(page, 'Bryn');
  await page.getByRole('button', { name: 'Save & title' }).click();
  await page.getByRole('button', { name: 'Backups', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export both saves' }).click();
  expect((await download).suggestedFilename()).toBe('twilight-worlds.json');
  expect(errors).toEqual([]);
});
test('offline package survives a cold page and permits save/load without its origin', async ({ page }) => {
  const server = await offlineServer();
  await page.goto(server.url + '/?renderer=canvas');
  await expect(page.locator('#offline-label')).toHaveText('Ready for offline play', { timeout: 30000 });
  await create(page);
  await page.getByRole('button', { name: 'Save & title' }).click();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await server.stop();
  await expect(async () => { await fetch(server.url); }).rejects.toThrow();
  await page.reload();
  await expect(page.locator('#offline-label')).toHaveText('Ready for offline play');
  await page.getByRole('button', { name: /Continue \/ Single Player/ }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Journal & satchel' }).click();
  await expect(page.getByText('The first page is waiting.')).toBeVisible();
});
test('manual WebRTC pairing, independent discoveries, shared hearth and guest reconnect', async ({ browser, browserName }) => {
  test.setTimeout(180000);
  const first = await browser.newContext({ viewport: { width: 1000, height: 650 } });
  const second = await browser.newContext({ viewport: { width: 1000, height: 650 } });
  const host = await first.newPage(); const guest = await second.newPage();
  for (const page of [host, guest]) {
    page.on('console', message => { if (message.text().startsWith('RTC:')) console.log(browserName, message.text()); });
    await page.addInitScript(() => {
      if (typeof RTCPeerConnection !== 'function') return;
      const Native = RTCPeerConnection;
      window.RTCPeerConnection = class extends Native {
        constructor(config?: RTCConfiguration) {
          super(config);
          this.addEventListener('iceconnectionstatechange', () => console.log('RTC: ICE', this.iceConnectionState));
          this.addEventListener('connectionstatechange', () => console.log('RTC: peer', this.connectionState));
          this.addEventListener('datachannel', event => console.log('RTC: channel delivered', event.channel.readyState));
        }
      };
    });
  }
  await host.goto('/?renderer=canvas'); await guest.goto('/?renderer=canvas'); await create(host, 'Host');
  const supportsRTC = await host.evaluate(() => typeof RTCPeerConnection === 'function');
  test.skip(!supportsRTC, `${browserName} runtime has no RTCPeerConnection; real two-iPhone transport testing remains required.`);
  const pair = async () => {
    await host.getByRole('button', { name: 'Co-op', exact: true }).click();
    await expect(host.locator('#pair-output')).not.toHaveValue('', { timeout: 20000 });
    const offer = await host.locator('#pair-output').inputValue();
    await guest.getByRole('button', { name: 'Join Co-op', exact: true }).click();
    await guest.locator('#pair-input').fill(offer);
    await guest.getByRole('button', { name: 'Create answer' }).click();
    await expect(guest.locator('#pair-output')).not.toHaveValue('', { timeout: 20000 });
    await host.locator('#pair-input').fill(await guest.locator('#pair-output').inputValue());
    await host.getByRole('button', { name: 'Connect', exact: true }).click();
    await expect(guest.locator('#resident-label')).toContainText('Player 2', { timeout: 20000 });
    await host.getByRole('button', { name: 'Close dialog' }).click();
  };
  await pair();
  await walk(guest, 'ArrowUp', 5);
  await guest.getByRole('button', { name: 'Interact' }).click();
  await expect(guest.getByRole('heading', { name: 'The house exhales' })).toBeVisible();
  await guest.getByRole('button', { name: 'Carry on' }).click();
  await host.getByRole('button', { name: 'Journal & satchel' }).click();
  await expect(host.getByText(/The hearth is burning/)).toBeVisible();
  await host.getByRole('button', { name: 'Close dialog' }).click();
  await walk(guest, 'ArrowRight', 17);
  await guest.getByRole('button', { name: 'Interact' }).click();
  await guest.getByRole('button', { name: 'Carry on' }).click();
  await guest.getByRole('button', { name: 'Save & title' }).click();
  await expect(host.locator('#toast')).toContainText('Player 2 disconnected');
  await pair();
  await guest.getByRole('button', { name: 'Journal & satchel' }).click();
  await expect(guest.getByText('3 cacao bean')).toBeVisible();
  await host.getByRole('button', { name: 'Journal & satchel' }).click();
  await expect(host.getByText('Your satchel is empty.')).toBeVisible();
  await first.close(); await second.close();
});

