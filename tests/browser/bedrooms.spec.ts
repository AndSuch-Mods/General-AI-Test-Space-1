import { test, expect } from '@playwright/test';
import { action, inventory, position, walkTo, throughDoor } from './controls';

test('living room connects private bedrooms; visitors can sleep and read a saved daily journal', async ({ page }) => {
  test.setTimeout(150000);
  await page.goto('/?renderer=canvas'); await page.locator('#solo').click();
  await page.getByRole('button', { name: 'Enter the castle' }).click(); await position(page);
  await throughDoor(page, 'door-out', 'living');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-player-map', 'living');
  await inventory(page, 'household'); await expect(page.locator('#arrange-room')).toBeEnabled();
  await page.locator('#arrange-room').click(); await expect(page.locator('#game-canvas')).toHaveAttribute('data-room-objects', /sofa/);
  await page.locator('#cancel-layout').click();
  await throughDoor(page, 'door-right', 'bedroom-2');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-player-map', 'bedroom-2');
  await inventory(page, 'household'); await expect(page.locator('#arrange-room')).toBeDisabled();
  await page.locator('#action-b').click();
  await walkTo(page, 'y', 364); await walkTo(page, 'x', 422); await walkTo(page, 'y', 302);
  await walkTo(page, 'x', 394);
  await expect(page.locator('#confirm-sleep')).toHaveCount(0);
  await action(page); await expect(page.locator('#confirm-sleep')).toBeVisible();
  await page.locator('#confirm-sleep').click();
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-player-frame', 'down-rest');
  await expect(page.locator('#night-transition')).toBeVisible();
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-day-phase', 'dawn');
  await expect(page.locator('#night-transition')).toBeHidden();
  await walkTo(page, 'x', 502); await action(page);
  await expect(page.getByRole('heading', { name: 'Yesterday at the castle' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Our household' })).toBeVisible();
  await expect(page.getByText('You rested until morning.')).toBeVisible();
  await page.locator('#action-b').click(); await page.locator('#leave').click(); await page.reload(); await page.locator('#solo').click();
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-player-map', 'bedroom-2');
  await action(page); await expect(page.getByText('You rested until morning.')).toBeVisible();
});


test('entry hall and kitchen have reciprocal automatic doors and usable seating', async ({page},testInfo) => {
  test.setTimeout(150000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?renderer=canvas');await page.locator('#solo').click();await page.getByRole('button',{name:'Enter the castle'}).click();await position(page);
  await throughDoor(page,'door-out','living');
  await walkTo(page,'y',378);await walkTo(page,'x',400);await action(page);
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-player-seated','sofa');
  await inventory(page,'household');
  await expect(page.locator('#arrange-room')).toBeDisabled();
  await expect(page.getByText('Stand up before arranging the room.')).toBeVisible();
  await page.locator('#action-b').click();
  await page.locator('#action-b').click();await expect(page.locator('#game-canvas')).toHaveAttribute('data-player-seated','');
  await throughDoor(page,'door-out','landing');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-room-objects',/window-west/);
  expect(await page.locator('#game-canvas').getAttribute('data-room-objects')).not.toContain('stairs');
  await inventory(page,'household');await page.locator('#arrange-room').click();await page.screenshot({path:testInfo.outputPath('entry-hall.png')});await page.locator('#cancel-layout').click();
  await throughDoor(page,'door-right','kitchen');
  await inventory(page,'household');await page.locator('#arrange-room').click();await page.screenshot({path:testInfo.outputPath('kitchen.png')});await page.locator('#cancel-layout').click();
  await walkTo(page,'y',343);await walkTo(page,'x',650);await walkTo(page,'y',326);await action(page);await expect(page.locator('#game-canvas')).toHaveAttribute('data-light-state',/:true:false$/);
  await action(page);await expect(page.locator('#game-canvas')).toHaveAttribute('data-light-state',/:false:false$/);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await throughDoor(page,'door-home','landing');await throughDoor(page,'door-home','living');
  expect(errors).toEqual([]);
});
