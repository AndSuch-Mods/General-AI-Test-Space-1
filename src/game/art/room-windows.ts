import type Phaser from 'phaser';
import type { World } from '../model';
import { daylight, nightVariant } from '../time';
import { inWindowPane, WINDOW_NATIVE } from './room-window-art';

const mix = (a: number[], b: number[], amount: number) => a.map((value, index) => Math.round(value + (b[index] - value) * amount));
const rgb = (color: number[]) => `rgb(${color.join(',')})`;
/** The window frame is static; every visible outdoor pixel belongs to the shared clock. */
export class RoomWindowSky {
  private texture: Phaser.Textures.CanvasTexture;
  private key = '';
  constructor(scene: Phaser.Scene) { this.texture = scene.textures.createCanvas('window-sky-native', WINDOW_NATIVE.width, WINDOW_NATIVE.height)!; }
  update(world: World, reducedMotion: boolean) {
    const minute = world.clock.totalMinutes, light = daylight(minute), variant = nightVariant(world);
    const phase = reducedMotion ? 0 : Math.floor(minute / 2);
    const key = `${Math.floor(minute)}:${variant}:${world.weather}:${phase}`;
    if (key === this.key) return;
    this.key = key;
    const context = this.texture.context; context.clearRect(0, 0, 52, 80);
    const pixel = (x: number, y: number, color: string) => { if (inWindowPane(x, y)) { context.fillStyle = color; context.fillRect(x, y, 1, 1); } };
    const skyTop = mix([28, 33, 62], [144, 165, 176], light), skyBottom = mix([53, 54, 78], [171, 182, 179], light);
    for (let y = 0; y < 80; y++) for (let x = 0; x < 52; x++) pixel(x, y, rgb(mix(skyTop, skyBottom, Math.min(1, Math.max(0, (y - 8) / 60)))));
    if (light < .45) {
      if (variant === 'moonlit') {
        for (let y = 19; y < 26; y++) for (let x = 31; x < 38; x++) if ((x - 34) ** 2 + (y - 22) ** 2 < 12 && (x - 36) ** 2 + (y - 20) ** 2 > 8) pixel(x, y, '#c6ceb5');
        for (const [x, y] of [[18, 26], [37, 31], [22, 15]]) pixel(x, y, '#aeb7c7');
      } else if (variant === 'drifting-lights') {
        for (let i = 0; i < 3; i++) pixel(12 + (phase + i * 7) % 28, 34 + (i * 11 + phase) % 29, i % 2 ? '#a9bdc5' : '#b6c9a8');
      }
    }
    const treeColor = rgb(mix([21, 31, 45], [66, 88, 91], light));
    for (let x = 8; x < 44; x++) {
      const top = 43 + Math.abs((x + world.seed % 5) % 12 - 6);
      for (let y = top; y <= 69; y++) pixel(x, y, treeColor);
    }
    // The daytime landscape is softly fogged; clouded nights obscure the distant trees.
    const fogColor = rgb(mix([63, 70, 92], [166, 181, 177], light));
    for (let row = 0; row < 3; row++) {
      const y = 42 + row * 9, shift = (phase + row * 7) % 23;
      for (let x = 8; x < 44; x++) if ((x + shift) % 23 < (variant === 'clouded' || light > .4 ? 17 : 7)) { pixel(x, y, fogColor); pixel(x, y + 1, fogColor); }
    }
    this.texture.refresh();
  }
}
