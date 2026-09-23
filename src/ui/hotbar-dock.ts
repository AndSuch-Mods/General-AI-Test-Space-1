export type HotbarEdge = 'bottom' | 'top';

/** Keep the south exit clear, with five movement steps of return leeway. */
export class HotbarDock {
  edge: HotbarEdge = 'bottom';
  private map = '';
  private returnY = -Infinity;

  update(map: string, playerY: number, cameraBottom: number, viewportHeight: number): HotbarEdge {
    if (map !== this.map) { this.map = map; this.edge = 'bottom'; }
    // Move before the camera uses its final two movement steps of southward travel.
    if (this.edge === 'bottom' && cameraBottom >= 474 && cameraBottom - playerY <= Math.min(92, viewportHeight * .32)) {
      this.edge = 'top'; this.returnY = playerY - 70;
    } else if (this.edge === 'top' && playerY <= this.returnY) this.edge = 'bottom';
    return this.edge;
  }
}
