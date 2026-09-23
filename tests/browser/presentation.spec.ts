import { test, expect, type Page } from '@playwright/test';
import { action, inventory, position, walkTo } from './controls';

async function start(page: Page) {
  await page.goto('/?renderer=canvas');
  await page.getByRole('button', { name: /^Single Player/ }).click();
  await page.getByRole('button', { name: 'Enter the castle' }).click();
  await position(page);
}

test('compact resident creation previews clothing changes without tinting the face or boots', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?renderer=canvas');
  await page.getByRole('button', { name: /^Single Player/ }).click();
  const canvas = page.locator('#resident-preview');
  await expect(canvas).toHaveAttribute('data-frame', 'down-idle');
  await expect(page.locator('#new-resident input,#new-resident select')).toHaveCount(7);
  for (const width of [844, 667]) {
    await page.setViewportSize({ width, height: 375 });
    const geometry = await page.locator('.character-layout').evaluate(element => {
      const preview = element.querySelector('canvas')!.getBoundingClientRect();
      const input = element.querySelector('input')!.getBoundingClientRect();
      const dialog = element.closest('dialog')!.getBoundingClientRect();
      return { previewRight: preview.right, inputLeft: input.left, inputWidth: input.width, dialogWidth: dialog.width, top: dialog.top, bottom: dialog.bottom };
    });
    expect(geometry.previewRight).toBeLessThanOrEqual(geometry.inputLeft);
    expect(geometry.inputWidth).toBeLessThan(geometry.dialogWidth * 2 / 3);
    expect(geometry.top).toBeGreaterThanOrEqual(0);
    expect(geometry.bottom).toBeLessThanOrEqual(375);
    expect((await page.locator('.character-submit').boundingBox())!.y + 44).toBeLessThanOrEqual(geometry.bottom);
  }
  const amber = await canvas.evaluate(element => Array.from((element as HTMLCanvasElement).getContext('2d')!.getImageData(0, 0, 64, 96).data));
  expect(amber.filter((value, index) => index % 4 === 3 && value > 0).length).toBeGreaterThan(500);
  for (const appearance of ['moss', 'violet', 'navy', 'wine', 'cream']) {
    await page.getByLabel('Clothing color').selectOption(appearance);
    await expect(canvas).toHaveAttribute('data-appearance', appearance);
    const pixels = await canvas.evaluate(element => Array.from((element as HTMLCanvasElement).getContext('2d')!.getImageData(0, 0, 64, 96).data));
    let changed = 0, protectedChanges = 0;
    for (let index = 0; index < pixels.length; index++) {
      const y = Math.floor(index / 4 / 64);
      if ((y < 40 || y >= 86 || index % 4 === 3) && pixels[index] !== amber[index]) protectedChanges++;
      if (pixels[index] !== amber[index]) changed++;
    }
    expect(changed).toBeGreaterThan(100);
    expect(protectedChanges).toBe(0);
  }
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Join Co-op', exact: true }).click();
  await expect(page.locator('#guest-name')).toHaveValue('Companion');
  await expect(page.locator('#resident-preview')).toHaveAttribute('data-frame', 'down-idle');
  await page.getByLabel('Clothing color').selectOption('moss');
  await expect(page.locator('#resident-preview')).toHaveAttribute('data-appearance', 'moss');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.getByRole('button', { name: /^Single Player/ }).click();
    await expect(page.locator('#resident-preview')).toHaveAttribute('data-frame', /^(down|right|up)-(idle|step-left|passing|step-right)$/);
    await page.getByRole('button', { name: 'Close dialog' }).click();
  }
  await page.getByRole('button', { name: /^Single Player/ }).click();
  await page.getByLabel('Character', { exact: true }).selectOption('female');
  await page.getByLabel('Hair style').selectOption('braid');
  await page.getByLabel('Hair color').selectOption('silver');
  await page.getByLabel('Skin tone').selectOption('deep');
  await page.getByLabel('Outfit', { exact: true }).selectOption('dress');
  const heads = await page.locator('#resident-preview').evaluate(element => new Promise<string[]>((resolve, reject) => {
    const canvas = element as HTMLCanvasElement, samples = new Map<string, string>();
    const capture = () => {
      const frame = canvas.dataset.frame ?? '';
      if (!frame.startsWith('down-')) return;
      samples.set(frame, JSON.stringify(Array.from(canvas.getContext('2d')!.getImageData(0, 0, 64, 40).data)));
      if (samples.size === 4) { observer.disconnect(); clearTimeout(timer); resolve([...samples.values()]); }
    };
    const observer = new MutationObserver(capture);
    const timer = setTimeout(() => { observer.disconnect(); reject(new Error('Walking preview did not show all four down-facing poses.')); }, 22000);
    observer.observe(canvas, { attributes: true, attributeFilter: ['data-frame'] }); capture();
  }));
  expect(new Set(heads).size).toBe(1); // The face must not blink or change with footfall.
  expect(errors).toEqual([]);
});

test('creation choices change the native preview and survive entering and reopening a world', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?renderer=canvas'); await page.locator('#solo').click();
  const canvas = page.locator('#resident-preview'); await expect(canvas).toHaveAttribute('data-frame', 'down-idle');
  const pixels = () => canvas.evaluate(el => (el as HTMLCanvasElement).toDataURL());
  await page.getByLabel('Character', { exact: true }).selectOption('female');
  await expect(page.getByLabel('Hair style')).toHaveValue('long');
  await expect(page.getByLabel('Outfit', { exact: true })).toHaveValue('skirt');
  await page.getByLabel('Character', { exact: true }).selectOption('male');
  await expect(page.getByLabel('Hair style')).toHaveValue('short');
  await expect(page.getByLabel('Outfit', { exact: true })).toHaveValue('coat');
  const choices = [['Character', 'female'], ['Hair style', 'swept'], ['Hair color', 'copper'], ['Skin tone', 'brown'], ['Outfit', 'dress'], ['Clothing color', 'wine']];
  for (const [label, value] of choices) {
    const before = await pixels(); await page.getByRole('combobox', { name: label, exact: true }).selectOption(value);
    await expect.poll(pixels).not.toBe(before);
  }
  await page.getByLabel('Character', { exact: true }).selectOption('male');
  await expect(page.getByLabel('Hair style')).toHaveValue('swept');
  await expect(page.getByLabel('Outfit', { exact: true })).toHaveValue('dress');
  await page.getByLabel('Character', { exact: true }).selectOption('female');
  await page.getByRole('button', { name: 'Enter the castle' }).click(); await position(page);
  const scene = page.locator('#game-canvas');
  await expect(scene).toHaveAttribute('data-resident-texture', 'resident-raster-v8-wine-female-swept-copper-brown-dress');
  await page.locator('#leave').click(); await page.reload(); await page.locator('#solo').click();
  await expect(scene).toHaveAttribute('data-resident-texture', 'resident-raster-v8-wine-female-swept-copper-brown-dress');
});

test('dedicated A and B operate menus while a right-side world tap does nothing', async ({ page }) => {
  await start(page);
  await walkTo(page, 'x', 550); await walkTo(page, 'y', 266);
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-nearest-object', 'hearth');
  const before = await position(page);
  const surface = page.locator('#touch-surface'), bounds = (await surface.boundingBox())!;
  await surface.click({ position: { x: bounds.width * .78, y: bounds.height * .5 } });
  await page.waitForTimeout(200);
  expect(await position(page)).toEqual(before);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-light-state', 'false:true:true:false:false');
  await action(page);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-light-state', /^true:/);
  await action(page);
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-light-state', /^false:/);
  await walkTo(page, 'y', 308); await walkTo(page, 'x', 362);
  await action(page);
  await expect(page.getByRole('heading', { name: 'A letter that waited' })).toBeVisible();
  await expect(page.locator('.dialogue-choices')).toHaveCount(0);
  const sheet = await page.locator('dialog[open]').boundingBox();
  const width = page.viewportSize()!.width; expect(sheet!.width).toBeGreaterThan(width * .85); expect(sheet!.x).toBeCloseTo((width - sheet!.width) / 2, 0);
  await page.locator('#action-a').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await inventory(page); await page.locator('#action-b').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('the rendered resident uses adult scale and keeps crisp pixels at phone sizes', async ({ page }, testInfo) => {
  await start(page);
  const scene = page.locator('#game-canvas');
  await expect(scene).toHaveAttribute('data-resident-width', '64');
  await expect(scene).toHaveAttribute('data-resident-height', '96');
  for (const width of [844, 667]) {
    await page.setViewportSize({ width, height: 390 });
    await expect.poll(async () => Number(await scene.getAttribute('data-render-scale'))).toBeGreaterThan(1);
    const pixels = await scene.locator('canvas').evaluate(canvas => getComputedStyle(canvas).imageRendering);
    expect(['pixelated', 'crisp-edges']).toContain(pixels);
    await page.screenshot({ path: testInfo.outputPath(`resident-${width}.png`) });
  }
});
