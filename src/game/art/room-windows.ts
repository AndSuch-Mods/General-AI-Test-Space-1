import type Phaser from 'phaser';
import type { World } from '../model';
import { daylight, nightVariant } from '../time';
import { inWindowPane } from './room-textures';

const mix = (a: number[], b: number[], amount: number) => a.map((value, index) => Math.round(value + (b[index] - value) * amount));
const rgb = (color: number[]) => `rgb(${color.join(',')})`;
/** The window frame is static; every visible outdoor pixel belongs to the shared clock. */
export class RoomWindowSky {
  private texture: Phaser.Textures.CanvasTexture;
  private key = '';
  constructor(scene: Phaser.Scene) { this.texture = scene.textures.createCanvas('window-sky-native', 52, 80)!; }
  update(world: World, reducedMotion: boolean) {
    const minute = world.clock.totalMinutes, light = daylight(minute), variant = nightVariant(world);
    const phase = reducedMotion ? 0 : Math.floor(minute / 2);
    const key = `${Math.floor(minute)}:${variant}:${world.weather}:${phase}`;
    if (key === this.key) return;
    this.key = key;
    const context = this.texture.context; context.clearRect(0, 0, 52, 80);
    const pixel = (x: number, y: number, color: string) => { if (inWindowPane(x, y)) { context.fillStyle = color; context.fillRect(x * 2, y * 2, 2, 2); } };
    const skyTop = mix([28, 33, 62], [144, 165, 176], light), skyBottom = mix([53, 54, 78], [171, 182, 179], light);
    for (let y = 8; y < 35; y++) for (let x = 8; x < 20; x++) pixel(x, y, rgb(mix(skyTop, skyBottom, (y - 8) / 27)));
    if (light < .45) {
      if (variant === 'moonlit') {
        for (const [x, y] of [[16, 11], [15, 12], [16, 12], [17, 12], [15, 13], [16, 13], [17, 13], [16, 14]]) pixel(x, y, '#c6ceb5');
        for (const [x, y] of [[10, 16], [17, 20], [11, 10]]) pixel(x, y, '#aeb7c7');
      } else if (variant === 'drifting-lights') {
        for (let i = 0; i < 3; i++) pixel(10 + (phase + i * 3) % 8, 17 + (i * 7 + phase) % 15, i % 2 ? '#a9bdc5' : '#b6c9a8');
      }
    }
    const treeColor = rgb(mix([21, 31, 45], [66, 88, 91], light));
    for (let x = 8; x < 20; x++) {
      const top = 22 + Math.abs((x + world.seed % 3) % 6 - 3);
      for (let y = top; y <= 34; y++) pixel(x, y, treeColor);
    }
    // The daytime landscape is softly fogged; clouded nights obscure the distant trees.
    const fogColor = rgb(mix([63, 70, 92], [166, 181, 177], light));
    for (let row = 0; row < 3; row++) {
      const y = 21 + row * 5, shift = (phase + row * 3) % 9;
      for (let x = 8; x < 20; x++) if ((x + shift) % 9 < (variant === 'clouded' || light > .4 ? 7 : 3)) pixel(x, y, fogColor);
    }
    this.texture.refresh();
  }
}
