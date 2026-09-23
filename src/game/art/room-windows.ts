import type Phaser from 'phaser';
import type { World } from '../model';
import { daylight, nightVariant } from '../time';
import { ROOM_TEXTURE } from './room-atlas';
import { inWindowPane, WINDOW_NATIVE, WINDOW_SOURCE } from './room-window-art';

const mix = (a: number[], b: number[], amount: number) => a.map((value, index) => Math.round(value + (b[index] - value) * amount));
const rgb = (color: number[]) => `rgb(${color.join(',')})`;
/** The window frame is static; every visible outdoor pixel belongs to the shared clock. */
export class RoomWindowSky {
  private texture: Phaser.Textures.CanvasTexture;
  private original: Uint8ClampedArray;
  private key = '';
  constructor(scene: Phaser.Scene) {
    this.texture = scene.textures.createCanvas('window-sky-native', WINDOW_NATIVE.width, WINDOW_NATIVE.height)!;
    const context = this.texture.context;
    context.imageSmoothingEnabled = false;
    context.drawImage(scene.textures.get(ROOM_TEXTURE).getSourceImage() as CanvasImageSource,
      WINDOW_SOURCE.x, WINDOW_SOURCE.y, WINDOW_SOURCE.width, WINDOW_SOURCE.height, 0, 0, WINDOW_NATIVE.width, WINDOW_NATIVE.height);
    this.original = context.getImageData(0, 0, WINDOW_NATIVE.width, WINDOW_NATIVE.height).data;
    context.clearRect(0, 0, WINDOW_NATIVE.width, WINDOW_NATIVE.height);
  }
  update(world: World, reducedMotion: boolean) {
    const minute = world.clock.totalMinutes, light = daylight(minute), variant = nightVariant(world);
    const phase = reducedMotion ? 0 : minute;
    const key = `${Math.floor(minute)}:${variant}:${world.weather}:${phase}`;
    if (key === this.key) return;
    this.key = key;
    const context = this.texture.context; context.clearRect(0, 0, WINDOW_NATIVE.width, WINDOW_NATIVE.height);
    const pixel = (x: number, y: number, color: string) => { if (inWindowPane(x, y)) { context.fillStyle = color; context.fillRect(x, y, 1, 1); } };
    for (let y = 0; y < WINDOW_NATIVE.height; y++) for (let x = 0; x < WINDOW_NATIVE.width; x++) {
      if (!inWindowPane(x, y)) continue;
      const at = (y * WINDOW_NATIVE.width + x) * 4;
      let source = Array.from(this.original.subarray(at, at + 3));
      // The painted moon and its halo occupy this small authored patch. Replace
      // its bright pixels with mirrored sky detail from the opposite pane, then
      // crossfade the real moon back only on clear moonlit nights.
      if (x >= 19 && x <= 24 && y >= 25 && y <= 33) {
        const backgroundAt = (y * WINDOW_NATIVE.width + 51 - x) * 4;
        const background = Array.from(this.original.subarray(backgroundAt, backgroundAt + 3));
        const moonMask = Math.max(0, Math.min(1, (Math.min(source[0], source[1]) - 40) / 65));
        const hideMoon = variant === 'moonlit' ? Math.min(1, light * 3) : 1;
        source = mix(source, background, moonMask * hideMoon);
      }
      const luminance = source[0] * .21 + source[1] * .71 + source[2] * .08;
      const day = [34 + luminance * .95, 65 + luminance, 76 + luminance * 1.05];
      const night = source.map(value => value * (variant === 'clouded' ? .72 : 1));
      let color = mix(night, day, light);
      // Broad, slowly moving mist preserves the atlas's trees and painted grain.
      // It has no hard horizontal stripes or new geometric tree silhouettes.
      const drift = Math.pow(.5 + .5 * Math.sin(x * .18 + y * .11 - phase * .32), 2);
      const fog = (world.weather === 'fog' ? .40 : world.weather === 'rain' ? .28 : .21) * drift;
      color = mix(color, mix([55, 65, 94], [154, 173, 174], light), fog);
      if (light < .45 && variant === 'drifting-lights') {
        for (let i = 0; i < 3; i++) {
          const px = 25 + Math.sin(phase * .13 + i * 2.1) * 8, py = 43 + Math.sin(phase * .09 + i * 2.7) * 12;
          const distance = (x - px) ** 2 + (y - py) ** 2;
          color = mix(color, i % 2 ? [169, 189, 197] : [182, 201, 168], .75 * Math.exp(-distance / 2));
        }
      }
      pixel(x, y, rgb(color));
    }
    this.texture.refresh();
  }
}
