import { test, expect } from '@playwright/test';
import { newWorld } from './navigation';
import { action, position, throughDoor, walkTo } from './controls';

test('nearby A targeting and hotbar clearance remain accurate through room movement', async ({ page }) => {
  await page.goto('/?renderer=canvas'); await newWorld(page);
  await page.getByRole('button', { name: 'Enter the castle' }).click(); await position(page);
  await walkTo(page, 'y', 350); await walkTo(page, 'x', 280); await walkTo(page, 'y', 220);
  await action(page); await expect(page.locator('dialog[open]')).toHaveCount(0);
  await throughDoor(page, 'door-out', 'living');
  await walkTo(page, 'y', 378); await walkTo(page, 'x', 540); await walkTo(page, 'y', 434);
  const bar = page.locator('.quickbar');
  await expect(bar).toHaveAttribute('data-dock', 'top');
  for (const y of [406, 434, 380]) { await walkTo(page, 'y', y); await expect(bar).toHaveAttribute('data-dock', 'top'); }
  const bounds = await bar.boundingBox(), hud = await page.locator('.game-hud').boundingBox();
  expect(bounds!.x + bounds!.width).toBeLessThan(hud!.x);
  expect(bounds!.y).toBeLessThan(60);
  await walkTo(page, 'y', 338); await expect(bar).toHaveAttribute('data-dock', 'bottom');
  await throughDoor(page, 'door-out', 'landing');
  await expect(bar).toHaveAttribute('data-dock', 'bottom');
});
