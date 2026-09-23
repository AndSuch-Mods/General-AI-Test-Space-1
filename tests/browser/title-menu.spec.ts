import { test, expect } from '@playwright/test';
import { newWorld, continueWorld, worldSlots } from './navigation';

test('supplied title art has readable working touch controls at phone sizes', async ({ page }, testInfo) => {
  await page.goto('/?renderer=canvas');
  await expect(page.getByRole('heading', { name: 'Haunted Chocolatier: Twilight' })).toHaveCount(1);
  const art = page.locator('.title-menu-art img');
  await expect.poll(() => art.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(1280);
  await expect(page.locator('#continue')).toBeDisabled();
  await expect(page.locator('.title-menu-nav button')).toHaveText(['Continue', 'New Game', 'Co-Op', 'Settings', 'Credits']);
  for (const [width, height] of [[844, 390], [667, 375], [568, 320]]) {
    await page.setViewportSize({ width, height });
    const boxes = await page.locator('.title-menu-nav button').evaluateAll(buttons => buttons.map(button => {
      const r = button.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    }));
    for (const [i, box] of boxes.entries()) {
      expect(box.height).toBeGreaterThanOrEqual(44); expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.y).toBeGreaterThanOrEqual(0); expect(box.right).toBeLessThanOrEqual(width); expect(box.bottom).toBeLessThanOrEqual(height);
      if (i) expect(box.y).toBeGreaterThanOrEqual(boxes[i - 1].bottom);
    }
    await page.screenshot({ path: testInfo.outputPath(`menu-${width}.png`) });
  }
  await page.locator('#credits').click(); await expect(page.getByText('Title artwork supplied by the project owner.')).toBeVisible();
  await page.locator('#close-dialog').click();
  await page.locator('#coop').click(); await page.locator('#host').click();
  await expect(page.getByRole('group', { name: 'World save slots' }).getByRole('button')).toHaveCount(2);
  await page.locator('#slot-1').click(); await expect(page.locator('#new-resident')).toBeVisible();
  await page.locator('#close-dialog').click();
});

test('new game protects occupied slots and continue resumes the chosen resident', async ({ page }) => {
  await page.goto('/?renderer=canvas'); await newWorld(page, 2);
  await page.getByLabel('Your name', { exact: true }).fill('Moonlit keeper');
  await page.getByRole('button', { name: 'Enter the castle' }).click();
  await expect(page.locator('#resident-label')).toContainText('Moonlit keeper');
  await page.locator('#leave').click();
  await worldSlots(page, 'new');
  await expect(page.locator('#slot-1')).toBeEnabled(); await expect(page.locator('#slot-2')).toBeDisabled();
  await expect(page.locator('#slot-2')).toContainText('Moonlit keeper');
  await page.locator('#close-dialog').click();
  await worldSlots(page, 'continue'); await expect(page.locator('#slot-1')).toBeDisabled();
  await page.locator('#close-dialog').click(); await continueWorld(page, 2);
  await expect(page.locator('#resident-label')).toContainText('Moonlit keeper');
});
