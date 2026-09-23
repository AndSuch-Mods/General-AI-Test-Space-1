import { test, expect } from '@playwright/test';
import { inventory, position } from './controls';
import { dragFurniture, furnitureCenter, roomPoint } from './layout-controls';

test('portrait guard covers creation and preserves its choices', async ({ page }) => {
  await page.goto('/?renderer=canvas'); await page.locator('#solo').click();
  await page.locator('#player-name').fill('Mira');
  await page.locator('#appearance').selectOption('violet');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#rotate')).toBeVisible();
  expect(await page.locator('#rotate').evaluate(element => {
    const box = element.getBoundingClientRect(); return element.contains(document.elementFromPoint(box.width / 2, box.height / 2));
  })).toBe(true);
  await page.keyboard.press('Escape'); await expect(page.locator('#rotate')).toBeVisible();
  await expect(page.locator('.character-dialog')).toHaveAttribute('open', '');
  await page.screenshot({ path: '.local/v7-portrait-creation.png' });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('#rotate')).not.toBeVisible();
  await expect(page.locator('#player-name')).toHaveValue('Mira'); await expect(page.locator('#appearance')).toHaveValue('violet');
  const box = await page.locator('.character-dialog').boundingBox();
  expect(box!.width).toBeGreaterThan(740); expect(Math.abs(box!.y + box!.height / 2 - 195)).toBeLessThan(3);
  await page.screenshot({ path: '.local/v7-creation-844.png' });
  await page.setViewportSize({ width: 667, height: 375 });
  const compact = await page.locator('.character-dialog').boundingBox();
  expect(compact!.x).toBeGreaterThan(0); expect(compact!.x + compact!.width).toBeLessThan(667);
  await expect(page.getByRole('button', { name: 'Enter the castle' })).toBeInViewport();
  await page.screenshot({ path: '.local/v7-creation-667.png' });
  await page.getByRole('button', { name: 'Enter the castle' }).click(); await position(page);
});

test('room drafting clamps, rejects invalid drops, rotates valid pieces, and cancels without saving', async ({ page }) => {
  await page.goto('/?renderer=canvas'); await page.locator('#solo').click();
  await page.getByRole('button', { name: 'Enter the castle' }).click(); await position(page);
  await inventory(page, 'household'); await page.locator('#arrange-room').click();
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-arranging', 'room');
  const saved = await page.locator('#game-canvas').getAttribute('data-layout');
  await dragFurniture(page, 'chest', -580, -80, false);
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-placement-invalid', 'true');
  await page.screenshot({ path: '.local/v7-invalid-placement.png' });
  await expect(page.locator('#save-layout')).toBeDisabled(); await page.mouse.up();
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-preview-layout', saved!);
  await dragFurniture(page, 'carpet', -450, 0, false);
  await expect.poll(async () => {
    const pieces = JSON.parse((await page.locator('#game-canvas').getAttribute('data-room-objects'))!) as {id:string;bounds:{x:number}}[];
    return pieces.find(piece => piece.id === 'carpet')!.bounds.x;
  }).toBe(80);
  await page.mouse.up(); await page.locator('#cancel-layout').click();
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-preview-layout', saved!);
  await inventory(page, 'household'); await page.locator('#arrange-room').click();
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-arranging', 'room');
  await dragFurniture(page, 'carpet', 36, -35);
  const tap = await roomPoint(page, await furnitureCenter(page, 'carpet'));
  await page.mouse.click(tap.x, tap.y);
  await expect.poll(async () => JSON.parse((await page.locator('#game-canvas').getAttribute('data-preview-layout'))!).carpet?.rotation).toBe(1);
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-layout', saved!);
  await page.locator('#save-layout').click(); await expect(page.locator('#arrange-bar')).toHaveCount(0);
  await expect.poll(async () => JSON.parse((await page.locator('#game-canvas').getAttribute('data-layout'))!).carpet?.rotation).toBe(1);
  await page.locator('#leave').click(); await page.reload(); await page.locator('#solo').click(); await position(page);
  await expect.poll(async () => JSON.parse((await page.locator('#game-canvas').getAttribute('data-layout'))!).carpet?.rotation).toBe(1);
});
