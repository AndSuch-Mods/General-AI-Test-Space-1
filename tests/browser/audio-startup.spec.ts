import { test, expect } from '@playwright/test';
import { newWorld } from './navigation';
import { position } from './controls';

test('a temporarily unavailable audio clock cannot block entering from the menu', async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as Window & { audioClockBlocked?: boolean; menuAudio?: AudioContext; webkitAudioContext?: typeof AudioContext };
    const Native = window.AudioContext ?? state.webkitAudioContext;
    if (!Native) return;
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options); state.menuAudio = this;
        Object.defineProperty(this, 'currentTime', { get: () => state.audioClockBlocked ? NaN : Reflect.get(Native.prototype, 'currentTime', this) });
      }
    };
    document.addEventListener('submit', event => {
      if ((event.target as HTMLElement).id === 'new-resident') state.audioClockBlocked = true;
    }, true);
  });
  await page.goto('/?renderer=canvas');
  test.skip(!await page.evaluate(() => !!window.AudioContext), 'This browser build has no Web Audio API.');
  await newWorld(page);
  await page.getByRole('button', { name: 'Enter the castle' }).click();
  await position(page);
  await expect(page.locator('#toast')).not.toContainText('non-finite');
  expect(await page.evaluate(() => Number.isNaN((window as Window & { menuAudio?: AudioContext }).menuAudio!.currentTime))).toBe(true);
  await page.evaluate(() => { (window as Window & { audioClockBlocked?: boolean }).audioClockBlocked = false; });
  await page.locator('#inventory-toggle').click();
  await expect.poll(() => page.evaluate(() => (window as Window & { menuAudio?: AudioContext }).menuAudio!.state)).toBe('running');
  await expect(page.locator('#toast')).not.toContainText('non-finite');
});
