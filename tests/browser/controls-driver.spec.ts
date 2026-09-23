import { test, expect } from '@playwright/test';
import { walkTo } from './controls';

test('walkTo waits for a pending acknowledged step and corrects its final position', async ({ page }) => {
  await page.setContent('<div id="game-canvas" data-player-x="268" data-player-y="315" data-player-map="castle" data-sleeping="false" data-movement-pending="false"></div>');
  await page.evaluate(() => {
    const element = document.querySelector<HTMLElement>('#game-canvas')!;
    let held = '', pending = false, injected = false;
    const step = (direction: string, delay: number) => {
      pending = true; element.dataset.movementPending = 'true';
      setTimeout(() => {
        const y = Number(element.dataset.playerY) + (direction === 'ArrowUp' ? -14 : 14);
        element.dataset.playerY = String(y);
        pending = false; element.dataset.movementPending = 'false';
        // The game can dispatch the next step in the same frame that first draws
        // y301, before the driver's MutationObserver releases the held key.
        if (y === 301 && !injected) {
          injected = true; element.dataset.delayedStepInjected = 'true'; step(direction, 350);
        } else if (held) requestAnimationFrame(() => { if (held && !pending) step(held, 30); });
      }, delay);
    };
    window.addEventListener('keydown', event => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      held = event.key;
      if (!pending) step(held, 30);
    });
    window.addEventListener('keyup', event => {
      if (event.key !== held) return;
      if (pending) element.dataset.releasedWhilePending = 'true';
      held = '';
    });
  });
  await walkTo(page, 'y', 302);
  const scene = page.locator('#game-canvas');
  await expect(scene).toHaveAttribute('data-delayed-step-injected', 'true');
  await expect(scene).toHaveAttribute('data-released-while-pending', 'true');
  await expect(scene).toHaveAttribute('data-movement-pending', 'false');
  await expect(scene).toHaveAttribute('data-player-y', '301');
});
