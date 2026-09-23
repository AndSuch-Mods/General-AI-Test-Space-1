import { expect, type Page } from '@playwright/test';

export async function position(page: Page) {
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-player-x', /\d/);
  return page.locator('#game-canvas').evaluate(element => ({ x: Number((element as HTMLElement).dataset.playerX), y: Number((element as HTMLElement).dataset.playerY) }));
}
export async function walk(page: Page, key: string, count: number) {
  const before = await position(page);
  const axis = key === 'ArrowLeft' || key === 'ArrowRight' ? 'x' : 'y';
  const sign = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1;
  const target = before[axis] + sign * count * 14;
  await moveTo(page, key, axis, sign, target, Math.max(15000, count * 350 + 4000), 1);
}
export async function walkTo(page: Page, axis: 'x' | 'y', target: number) {
  const before = await position(page), sign = Math.sign(target - before[axis]);
  if (Math.abs(target - before[axis]) <= 7) return;
  const key = axis === 'x' ? sign > 0 ? 'ArrowRight' : 'ArrowLeft' : sign > 0 ? 'ArrowDown' : 'ArrowUp';
  await moveTo(page, key, axis, sign, target, 20000, 7);
}
async function moveTo(page: Page, key: string, axis: 'x' | 'y', sign: number, target: number, timeout: number, tolerance: number) {
  const before = await position(page), deadline = Date.now() + timeout;
  let coordinate = before[axis];
  try {
    while (Math.abs(coordinate - target) > tolerance) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error(`Movement did not reach ${axis}=${target} within ${timeout}ms`);
      const heldKey = axis === 'x' ? coordinate < target ? 'ArrowRight' : 'ArrowLeft'
        : coordinate < target ? 'ArrowDown' : 'ArrowUp';
      // Hold real keyboard input until the authoritative telemetry reaches the target.
      // Release in the same page microtask, without one protocol round trip per step.
      const driver = await page.evaluateHandle(({ axis, target, tolerance, sign, key, remaining }) => {
        const element = document.querySelector('#game-canvas')!;
        const code = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 }[key]!;
        const state = () => ({ coordinate: Number(element.getAttribute(`data-player-${axis}`)),
          sleeping: element.getAttribute('data-sleeping') === 'true', map: element.getAttribute('data-player-map') });
        const initialMap = state().map;
        let settled = false;
        let complete!: (value: ReturnType<typeof state> & { reason: string }) => void;
        const done = new Promise<ReturnType<typeof state> & { reason: string }>(resolve => { complete = resolve; });
        const finish = (reason: string) => {
          if (settled) return;
          settled = true; observer.disconnect(); clearTimeout(timer); window.removeEventListener('keydown', started);
          window.dispatchEvent(new KeyboardEvent('keyup', { key, code: key, keyCode: code, which: code, bubbles: true }));
          complete({ ...state(), reason });
        };
        const check = () => {
          const current = state();
          if (current.sleeping) finish('sleeping');
          else if (current.map !== initialMap) finish('map changed');
          else if (Math.abs(current.coordinate - target) <= tolerance) finish('reached');
          else if (sign * (current.coordinate - target) > tolerance) finish('crossed');
        };
        // An already sleeping resident may produce no position mutation.
        const started = (event: KeyboardEvent) => { if (event.key === key) queueMicrotask(check); };
        const observer = new MutationObserver(check);
        const timer = setTimeout(() => finish('timeout'), remaining);
        observer.observe(element, { attributes: true, attributeFilter: [`data-player-${axis}`, 'data-sleeping', 'data-player-map'] });
        window.addEventListener('keydown', started);
        return { done, cancel: () => finish('cancelled') };
      }, { axis, target, tolerance, sign: Math.sign(target - coordinate) || sign, key: heldKey, remaining });
      try {
        await page.keyboard.down(heldKey);
        const result = await driver.evaluate(driver => driver.done);
        coordinate = result.coordinate;
        if (result.sleeping) return;
        if (result.reason === 'timeout' || result.reason === 'map changed') throw new Error(`Movement ${result.reason} at ${axis}=${coordinate}; target ${target} within ${timeout}ms`);
        // A coalesced network update can cross the tolerance. Correct through normal
        // input with the original deadline instead of accepting an overshoot.
      } finally {
        await driver.evaluate(driver => driver.cancel());
        await page.keyboard.up(heldKey); await driver.dispose();
      }
    }
  }
  catch (error) {
    console.error('Walk target not reached', { before, axis, target, current: await position(page),
      map: await page.locator('#game-canvas').getAttribute('data-player-map'), sleeping: await page.locator('#game-canvas').getAttribute('data-sleeping') });
    throw error;
  }
  finally { await page.keyboard.up(key); }
}
export async function inventory(page: Page, tab: 'items' | 'journal' | 'missions' | 'household' | 'session' = 'items') {
  await page.locator('#inventory-toggle').click();
  // Unread discoveries open Missions first, so select the requested section explicitly.
  await page.locator(`#tab-${tab}`).click();
  await expect(page.locator(`#tab-${tab}`)).toHaveAttribute('aria-pressed', 'true');
}
export async function action(page: Page, target?: string) {
  await page.locator('#action-a').click();
  if (target) await page.locator(`[data-action="${target}"]`).click();
}

/** Walk through a centered threshold using ordinary movement only. */
export async function throughDoor(page: Page, id: string, destination: string) {
  const scene = page.locator('#game-canvas');
  const doors = JSON.parse((await scene.getAttribute('data-doorways'))!) as {id:string;wall:string}[];
  const wall = doors.find(d => d.id === id)!.wall;
  await walkTo(page, 'y', 378);
  await walkTo(page, 'x', wall === 'west' ? 200 : wall === 'east' ? 730 : 480);
  if (wall === 'west' || wall === 'east') await walkTo(page, 'y', 343);
  const key = {west:'ArrowLeft',east:'ArrowRight',north:'ArrowUp',south:'ArrowDown'}[wall]!;
  const before = await scene.getAttribute('data-player-map');
  await page.evaluate(({before,key}) => {
    const element = document.querySelector('#game-canvas')!;
    const code = {ArrowLeft:37,ArrowUp:38,ArrowRight:39,ArrowDown:40}[key]!;
    const observer = new MutationObserver(() => {
      if (element.getAttribute('data-player-map') === before) return;
      observer.disconnect(); clearTimeout(timer);
      window.dispatchEvent(new KeyboardEvent('keyup',{key,code:key,keyCode:code,which:code,bubbles:true}));
    });
    const timer = setTimeout(() => observer.disconnect(),20000);
    observer.observe(element,{attributes:true,attributeFilter:['data-player-map']});
  },{before,key});
  await page.keyboard.down(key);
  try { await expect(scene).toHaveAttribute('data-player-map',destination,{timeout:20000}); }
  finally { await page.keyboard.up(key); }
}

export async function roomPoint(page: Page, x: number, y: number) {
  return page.locator('#game-canvas').evaluate((element,point) => {
    const d = (element as HTMLElement).dataset, canvas = element.querySelector('canvas')!, r = canvas.getBoundingClientRect();
    const zoom = Number(d.cameraZoom), w = Number(d.logicalWidth), h = Number(d.logicalHeight);
    return { x: r.x + ((point.x - Number(d.cameraX) - w/2)*zoom + w/2) * r.width/w,
      y: r.y + ((point.y - Number(d.cameraY) - h/2)*zoom + h/2) * r.height/h };
  },{x,y});
}
export async function dragFurniture(page: Page, id: string, dx: number, dy: number) {
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-arranging', /.+/);
  await expect.poll(async () => Number(await page.locator('#game-canvas').getAttribute('data-camera-zoom'))).toBeLessThan(1);
  const objects = JSON.parse((await page.locator('#game-canvas').getAttribute('data-room-objects'))!) as {id:string;bounds:{x:number;y:number;width:number;height:number}}[];
  const b = objects.find(o => o.id === id)!.bounds;
  // Carpet's center is clear in the default bedrooms and living room.
  const from = await roomPoint(page,b.x+b.width/2,b.y+b.height/2), to = await roomPoint(page,b.x+b.width/2+dx,b.y+b.height/2+dy);
  await page.mouse.move(from.x,from.y); await page.mouse.down(); await expect(page.locator('#game-canvas')).toHaveAttribute('data-arranging', id); await page.mouse.move(to.x,to.y,{steps:6}); await page.mouse.up();
}
