import { expect, type Page } from '@playwright/test';

export async function worldSlots(page: Page, mode: 'continue' | 'new' | 'host' = 'continue') {
  if (mode === 'host') {
    await page.locator('#coop').click();
    await page.locator('#host').click();
  } else await page.locator(mode === 'new' ? '#new-game' : '#continue').click();
  await expect(page.locator('#slot-1')).toBeVisible();
  await expect(page.locator('#slot-2')).toBeVisible();
}

/** Open creation without submitting, so callers can exercise its fields/preview. */
export async function newWorld(page: Page, slot: 1 | 2 = 1) {
  await worldSlots(page, 'new');
  await page.locator(`#slot-${slot}`).click();
  await expect(page.locator('#new-resident')).toBeVisible();
}

export async function continueWorld(page: Page, slot: 1 | 2 = 1) {
  await worldSlots(page);
  await page.locator(`#slot-${slot}`).click();
}

export async function joinCoop(page: Page) {
  await page.locator('#coop').click();
  await page.locator('#join').click();
  await page.locator('#manual-pairing').click();
  await expect(page.locator('#pair-input')).toBeVisible();
}

export async function backups(page: Page) {
  await page.locator('#settings').click();
  await page.locator('#backups').click();
  await expect(page.locator('#import-save')).toBeAttached();
}
