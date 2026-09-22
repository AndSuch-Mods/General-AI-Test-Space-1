import { test, expect } from '@playwright/test';
import { action, inventory, position, walkTo } from './controls';

test('living room connects private bedrooms; visitors can sleep and read a saved daily journal', async ({ page }) => {
  test.setTimeout(150000);
  await page.goto('/?renderer=canvas'); await page.locator('#solo').click();
  await page.getByRole('button', { name: 'Enter the castle' }).click(); await position(page);
  await walkTo(page, 'y', 454); await walkTo(page, 'x', 852); await action(page);
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-player-map', 'living');
  await inventory(page, 'household'); await expect(page.locator('#arrange-room')).toBeEnabled();
  await page.locator('#arrange-room').click(); await expect(page.locator('[data-furnishing="sofa"]')).toBeVisible();
  await page.locator('#action-b').click();
  await walkTo(page, 'y', 462); await walkTo(page, 'x', 852); await walkTo(page, 'y', 454); await action(page);
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-player-map', 'bedroom-2');
  await inventory(page, 'household'); await expect(page.locator('#arrange-room')).toBeDisabled();
  await page.locator('#action-b').click();
  await walkTo(page, 'y', 364); await walkTo(page, 'x', 270); await walkTo(page, 'y', 302);
  await page.keyboard.down('ArrowLeft');
  try { await expect(page.locator('#confirm-sleep')).toBeVisible(); } finally { await page.keyboard.up('ArrowLeft'); }
  await page.locator('#confirm-sleep').click();
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-player-frame', 'down-rest');
  await expect(page.locator('#night-transition')).toBeVisible();
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-day-phase', 'dawn');
  await expect(page.locator('#night-transition')).toBeHidden();
  await walkTo(page, 'x', 386); await action(page);
  await expect(page.getByRole('heading', { name: 'Yesterday at the castle' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Our household' })).toBeVisible();
  await expect(page.getByText('You rested until morning.')).toBeVisible();
  await page.locator('#action-b').click(); await page.locator('#leave').click(); await page.reload(); await page.locator('#solo').click();
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-player-map', 'bedroom-2');
  await action(page); await expect(page.getByText('You rested until morning.')).toBeVisible();
});
