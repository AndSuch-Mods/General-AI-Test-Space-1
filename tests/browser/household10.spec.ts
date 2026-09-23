import { test, expect } from '@playwright/test';
import { newWorld } from './navigation';
import { action, position, walkTo } from './controls';

test('A works while walking against the hearth; ledger and individual drawers have separate lifetimes', async ({ page }) => {
  await page.goto('/?renderer=canvas'); await newWorld(page);
  await page.getByRole('button', { name: 'Enter the castle' }).click(); await position(page);
  await walkTo(page, 'y', 300); await walkTo(page, 'x', 556); await walkTo(page, 'y', 256);
  await page.keyboard.down('ArrowUp');
  try {
    await action(page); await expect(page.locator('#game-canvas')).toHaveAttribute('data-light-state', /^true:/);
    await action(page); await expect(page.locator('#game-canvas')).toHaveAttribute('data-light-state', /^false:/);
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  } finally { await page.keyboard.up('ArrowUp'); }
  await walkTo(page, 'y', 300); await walkTo(page, 'x', 362); await action(page);
  await expect(page.getByRole('heading', { name: 'A letter that waited' })).toBeVisible();
  await page.locator('#action-b').click();
  await walkTo(page, 'x', 390); await action(page);
  await expect(page.getByRole('heading', { name: 'Household ledger', exact: true })).toBeVisible();
  expect(JSON.parse((await page.locator('#game-canvas').getAttribute('data-container-poses'))!).desk).toBe(0);
  await page.locator('#action-b').click(); await walkTo(page, 'x', 334); await action(page);
  await expect(page.getByRole('heading', { name: 'Left desk drawer', exact: true, level: 2 })).toBeVisible();
  expect(JSON.parse((await page.locator('#game-canvas').getAttribute('data-container-poses'))!).desk).toBe(1);
  await expect(page.locator('#read-stored-letter')).toBeVisible();
  await page.locator('#read-stored-letter').click(); await expect(page.getByRole('heading', { name: 'A letter that waited' })).toBeVisible();
  await page.locator('#back-storage').click(); await page.locator('#action-b').click();
  await expect.poll(async () => JSON.parse((await page.locator('#game-canvas').getAttribute('data-container-poses'))!).desk).toBe(0);
  await walkTo(page, 'y', 360); await walkTo(page, 'x', 314); await walkTo(page, 'y', 440); await action(page);
  await expect(page.getByRole('heading', { name: 'Bedside table', exact: true, level: 2 })).toBeVisible();
  await expect(page.getByText('2 spaces · Both residents can use this storage.')).toBeVisible();
  expect(JSON.parse((await page.locator('#game-canvas').getAttribute('data-container-poses'))!)['side-table']).toBe(1);
});
