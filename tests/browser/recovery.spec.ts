import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

test('the default renderer opens the arrival room without script errors', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: /^Single Player/ }).click();
  await page.getByRole('button', { name: 'Enter the castle' }).click();
  await expect(page.locator('#game-canvas canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Journal & satchel' }).click();
  await expect(page.getByText('The first page is waiting.')).toBeVisible();
  expect(errors).toEqual([]);
});

test('missing mandatory content clears offline readiness and can be repaired', async ({ page }) => {
  await page.goto('/?renderer=canvas');
  await expect(page.locator('#offline-label')).toHaveText('Ready for offline play', { timeout: 30000 });
  await page.evaluate(async () => {
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      await cache.delete(new URL('art/title-castle.png', location.href).href);
    }
  });
  await page.reload();
  await expect(page.locator('#offline-label')).toHaveText('Online, offline package incomplete');
  await page.getByRole('button', { name: 'Make Available Offline' }).click();
  await expect(page.locator('#offline-label')).toHaveText('Ready for offline play');
});

test('an update waits for explicit restart and preserves the saved resident', async ({ page }) => {
  const path = 'dist/sw.js'; const original = await readFile(path, 'utf8');
  try {
    await page.goto('/?renderer=canvas');
    await expect(page.locator('#offline-label')).toHaveText('Ready for offline play', { timeout: 30000 });
    await page.getByRole('button', { name: /^Single Player/ }).click();
    await page.getByLabel('Your name', { exact: true }).fill('Update keeper');
    await page.getByRole('button', { name: 'Enter the castle' }).click();
    await expect(page.locator('canvas')).toBeVisible();
    await page.getByRole('button', { name: 'Save & title' }).click();
    await writeFile(path, original + '\n// Explicit-update integration check\n');
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())!.update(); });
    await expect(page.getByRole('button', { name: 'Update ready · restart' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: /World Save Slot 1/ })).toContainText('Update keeper');
    await page.getByRole('button', { name: 'Update ready · restart' }).click();
    await expect(page.getByRole('button', { name: /World Save Slot 1/ })).toContainText('Update keeper');
    await expect(page.locator('#apply-update')).toBeHidden();
  } finally { await writeFile(path, original); }
});

test('malformed import is rejected and occupied slots require confirmation', async ({ page }) => {
  await page.goto('/?renderer=canvas');
  await page.getByRole('button', { name: /^Single Player/ }).click();
  await page.getByLabel('Your name', { exact: true }).fill('Original keeper');
  await page.getByRole('button', { name: 'Enter the castle' }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Save & title' }).click();
  await page.getByRole('button', { name: 'Backups', exact: true }).click();
  await page.locator('#import-save').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
  await expect(page.locator('#toast')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-1').click();
  const file = await (await downloadPromise).path();
  const backup = JSON.parse(await readFile(file!, 'utf8'));
  const w = backup.worlds[0].world; w.players[w.hostId].name = 'Restored keeper';
  await page.locator('#import-save').setInputFiles({ name: 'restore.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await expect(page.getByRole('heading', { name: 'Replace occupied world saves?' })).toBeVisible();
  await page.getByRole('button', { name: 'Keep current saves' }).click();
  await expect(page.getByRole('button', { name: /World Save Slot 1/ })).toContainText('Original keeper');
  await page.getByRole('button', { name: 'Backups', exact: true }).click();
  await page.locator('#import-save').setInputFiles({ name: 'restore.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await page.getByRole('button', { name: 'Replace with backup' }).click();
  await expect(page.getByRole('button', { name: /World Save Slot 1/ })).toContainText('Restored keeper');
});
