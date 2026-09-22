import { expect, type Page } from '@playwright/test';

export async function roomPoint(page: Page, point: { x: number; y: number }) {
  return page.locator('#game-canvas').evaluate((element, point) => {
    const data = (element as HTMLElement).dataset, rect = element.querySelector('canvas')!.getBoundingClientRect();
    const width = Number(data.logicalWidth), height = Number(data.logicalHeight), zoom = Number(data.cameraZoom);
    return { x: rect.x + ((point.x - Number(data.cameraX) - width / 2) * zoom + width / 2) * rect.width / width,
      y: rect.y + ((point.y - Number(data.cameraY) - height / 2) * zoom + height / 2) * rect.height / height };
  }, point);
}

export async function furnitureCenter(page: Page, id: string) {
  const bounds = await page.locator('#game-canvas').evaluate((element, id) => {
    const pieces = JSON.parse((element as HTMLElement).dataset.roomObjects!) as { id: string; bounds: { x: number; y: number; width: number; height: number } }[];
    return pieces.find(piece => piece.id === id)!.bounds;
  }, id);
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

export async function dragFurniture(page: Page, id: string, dx: number, dy: number, release = true) {
  const center = await furnitureCenter(page, id), start = await roomPoint(page, center), end = await roomPoint(page, { x: center.x + dx, y: center.y + dy });
  await page.mouse.move(start.x, start.y); await page.mouse.down();
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-arranging', id);
  await page.mouse.move(end.x, end.y, { steps: 8 });
  if (release) await page.mouse.up();
}
