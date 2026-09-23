import { test, expect } from '@playwright/test';

// Route the initial module request itself, without an installed worker serving it.
test.use({ serviceWorkers: 'block' });

test('character presets work before preview loading and preserve manual choices afterward', async ({ page }) => {
  let release!: () => void;
  const delayed = new Promise<void>(resolve => { release = resolve; });
  let requested = false;
  await page.route(/\/assets\/resident-preview-[^/]+\.js(?:\?.*)?$/, async route => {
    requested = true;
    await delayed;
    await route.continue();
  });
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?renderer=canvas');
    await page.locator('#solo').click();
    await expect.poll(() => requested).toBe(true);
    const preview = page.locator('#resident-preview');
    await expect(preview).not.toHaveAttribute('data-frame');
    await page.getByLabel('Character', { exact: true }).selectOption('female');
    await expect(page.getByLabel('Hair style')).toHaveValue('long');
    await expect(page.getByLabel('Outfit', { exact: true })).toHaveValue('skirt');
    await page.getByLabel('Hair style').selectOption('braid');
    await page.getByLabel('Outfit', { exact: true }).selectOption('dress');
    await page.getByLabel('Clothing color').selectOption('wine');
    await page.getByLabel('Hair color').selectOption('silver');
    await page.getByLabel('Skin tone').selectOption('deep');
    await page.getByLabel('Character', { exact: true }).selectOption('male');
    await expect(page.getByLabel('Hair style')).toHaveValue('braid');
    await expect(page.getByLabel('Outfit', { exact: true })).toHaveValue('dress');
    await page.getByLabel('Character', { exact: true }).selectOption('female');
    release();
    await expect(preview).toHaveAttribute('data-frame', 'down-idle');
    await expect(preview).toHaveAttribute('data-appearance', 'wine');
    expect(JSON.parse((await preview.getAttribute('data-character-look'))!)).toEqual({
      body: 'female', hairStyle: 'braid', hairColor: 'silver', skinTone: 'deep', outfit: 'dress',
    });
    await expect(page.getByLabel('Hair style')).toHaveValue('braid');
    await expect(page.getByLabel('Outfit', { exact: true })).toHaveValue('dress');
  } finally { release(); }
});
