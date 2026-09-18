import Phaser from 'phaser';
import type { World } from '../model';
import { ROOM_SIZE, roomObjects, nearestInteractable, moveInRoom } from '../../content/room';
import { RESIDENT_FRAMES, RESIDENT_IMAGE, RESIDENT_ORIGIN, RESIDENT_DISPLAY_WIDTH, RESIDENT_DISPLAY_HEIGHT, type ResidentFacing } from '../art/resident-atlas';
import { residentFrame } from '../art/resident-animation';
import { CANDLES, ROOM_FIRE_SIZE, ROOM_FLAME_FRAMES, ROOM_FLAME_IMAGE, ROOM_FRAMES, ROOM_IMAGE, ROOM_MATERIAL_IMAGE, ROOM_TEXTURE } from '../art/room-atlas';

type Resident = {
  container: Phaser.GameObjects.Container; sprite: Phaser.GameObjects.Image;
  facing: ResidentFacing; distance: number; lastTravel: number;
};

export async function mountArrival(parent: HTMLElement, state: () => { world: World; localId: string; activeIds: string[] }, direction: (dx: number, dy: number) => void, interact: () => void, paused: () => boolean) {
  const reducedMotion = document.documentElement.classList.contains('reduced-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const logicalSize = () => ({ width: 640, height: Math.max(280, Math.min(480, Math.round(640 * parent.clientHeight / Math.max(1, parent.clientWidth)))) });
  const telemetry = (key: string, value: string | number) => {
    const text = String(value);
    if (parent.dataset[key] !== text) parent.dataset[key] = text;
  };
  class ArrivalScene extends Phaser.Scene {
    private actors = new Map<string, Resident>();
    private fire!: Phaser.GameObjects.Image;
    private illumination!: Phaser.GameObjects.Graphics;
    private candleFlames!: Phaser.GameObjects.Graphics;
    private motes!: Phaser.GameObjects.Graphics;
    private keys!: Record<string, Phaser.Input.Keyboard.Key>;
    private cooldown = 0;
    private effectFrame = -1;
    private followed = '';
    preload() {
      this.load.image(ROOM_TEXTURE, ROOM_IMAGE);
      this.load.image('room-materials', ROOM_MATERIAL_IMAGE);
      this.load.image('room-flames', ROOM_FLAME_IMAGE);
      this.load.image('resident-source', `./${RESIDENT_IMAGE}`);
    }
    create() {
      this.buildNativeTextures();

      // Resolve source art to a single native character grid once, never per animation frame.
      const residentTexture = this.textures.createCanvas('residents-native', RESIDENT_DISPLAY_WIDTH * RESIDENT_FRAMES.length, RESIDENT_DISPLAY_HEIGHT)!;
      residentTexture.context.imageSmoothingEnabled = false;
      const source = this.textures.get('resident-source').getSourceImage() as HTMLImageElement;
      RESIDENT_FRAMES.forEach((frame, index) => {
        residentTexture.context.drawImage(source, frame.x, frame.y, frame.width, frame.height, index * RESIDENT_DISPLAY_WIDTH, 0, RESIDENT_DISPLAY_WIDTH, RESIDENT_DISPLAY_HEIGHT);
        residentTexture.add(frame.name, 0, index * RESIDENT_DISPLAY_WIDTH, 0, RESIDENT_DISPLAY_WIDTH, RESIDENT_DISPLAY_HEIGHT);
      });
      residentTexture.refresh();
      this.buildRoom();
      this.illumination = this.add.graphics().setDepth(800);
      this.fire = this.add.image(556, 232, 'flames-native', 'fire-0').setOrigin(.5, 1).setTint(0xe9cfad).setDepth(243);
      this.candleFlames = this.add.graphics();
      this.motes = this.add.graphics().setDepth(900);
      this.cameras.main.setBounds(0, 38, ROOM_SIZE.width, 464).setRoundPixels(true);
      this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE') as Record<string, Phaser.Input.Keyboard.Key>;
      for (const key of ['E', 'SPACE']) this.input.keyboard!.on(`keydown-${key}`, (event: KeyboardEvent) => {
        if (!event.repeat && !paused()) interact();
      });
    }
    private buildNativeTextures() {
      const props = this.textures.createCanvas('props-native', 512, 480)!;
      props.context.imageSmoothingEnabled = false;
      const source = this.textures.get(ROOM_TEXTURE).getSourceImage() as HTMLImageElement;
      ROOM_FRAMES.forEach((frame, index) => {
        const object = roomObjects.find(object => object.id === frame.name || frame.name === 'window' && object.id === 'window-west');
        const size = object?.bounds ?? ({ candle: { width: 9, height: 24 }, letter: { width: 22, height: 15 }, parcel: { width: 22, height: 25 } }[frame.name as 'candle' | 'letter' | 'parcel']);
        const x = index % 4 * 128, y = Math.floor(index / 4) * 160;
        props.context.drawImage(source, frame.x, frame.y, frame.width, frame.height, x, y, size.width, size.height);
        props.add(frame.name, 0, x, y, size.width, size.height);
      });
      props.refresh();
      const materials = this.textures.createCanvas('materials-native', 256, 136)!;
      materials.context.imageSmoothingEnabled = false;
      const materialSource = this.textures.get('room-materials').getSourceImage() as HTMLImageElement;
      materials.context.drawImage(materialSource, 0, 0, 887, 887, 0, 0, 128, 128);
      materials.context.drawImage(materialSource, 887, 0, 887, 812, 128, 0, 128, 136);
      materials.add('floor', 0, 0, 0, 128, 128); materials.add('wall', 0, 128, 0, 128, 136); materials.refresh();
      const { width, height } = ROOM_FIRE_SIZE;
      const flames = this.textures.createCanvas('flames-native', width * 6, height)!;
      flames.context.imageSmoothingEnabled = false;
      const flameSource = this.textures.get('room-flames').getSourceImage() as HTMLImageElement;
      ROOM_FLAME_FRAMES.forEach((frame, index) => {
        flames.context.drawImage(flameSource, frame.x, frame.y, frame.width, frame.height, index * width, 0, width, height);
        flames.add(frame.name, 0, index * width, 0, width, height);
      });
      flames.refresh();
    }
    private buildRoom() {
      this.add.rectangle(64, 58, 832, 444, 0x17151f).setOrigin(0).setDepth(-100);
      this.add.tileSprite(80, 210, 800, 266, 'materials-native', 'floor').setOrigin(0).setDepth(-99);
      this.add.tileSprite(80, 74, 800, 136, 'materials-native', 'wall').setOrigin(0).setDepth(-98);
      const trim = this.add.graphics().setDepth(-97);
      trim.fillStyle(0x1e1924); trim.fillRect(76, 68, 808, 8); trim.fillRect(76, 204, 808, 8);
      trim.fillStyle(0x67483c); trim.fillRect(80, 75, 800, 3); trim.fillRect(80, 203, 800, 2);
      trim.fillStyle(0x37262b); trim.fillRect(64, 70, 16, 418); trim.fillRect(880, 70, 16, 418); trim.fillRect(64, 476, 832, 14);
      trim.fillStyle(0x87624b); trim.fillRect(78, 76, 2, 401); trim.fillRect(880, 76, 2, 401); trim.fillRect(80, 476, 800, 2);
      // A woven floor layer remains walkable, distinct from the furniture above it.
      const rug = this.add.graphics().setDepth(-90);
      rug.fillStyle(0x342435); rug.fillRect(338, 316, 318, 132);
      rug.fillStyle(0x77434b); rug.fillRect(342, 320, 310, 124);
      rug.fillStyle(0xb18b67); rug.fillRect(347, 325, 300, 2); rug.fillRect(347, 437, 300, 2); rug.fillRect(347, 325, 2, 114); rug.fillRect(645, 325, 2, 114);
      rug.fillStyle(0x57303e); rug.fillRect(354, 332, 286, 100);
      for (let x = 365; x < 635; x += 18) {
        rug.fillStyle(0x87545c); rug.fillRect(x, 335, 4, 4); rug.fillRect(x, 425, 4, 4);
        rug.fillStyle(0x9e7b5b); rug.fillRect(x, 313, 1, 3); rug.fillRect(x, 448, 1, 3);
      }
      for (const center of [418, 497, 576]) {
        for (let y = -28; y <= 28; y++) {
          const edge = Math.floor((28 - Math.abs(y)) * 1.1);
          rug.fillStyle(0x8d5961); rug.fillRect(center - edge, 382 + y, 2, 1); rug.fillRect(center + edge - 1, 382 + y, 2, 1);
          if (Math.abs(y) < 20) {
            const inner = 20 - Math.abs(y);
            rug.fillStyle(0xa47e62); rug.fillRect(center - inner, 382 + y, 1, 1); rug.fillRect(center + inner, 382 + y, 1, 1);
          }
        }
        rug.fillStyle(0x8d5961); rug.fillRect(center - 5, 381, 11, 3); rug.fillRect(center - 1, 377, 3, 11);
      }
      for (const object of roomObjects) {
        const { x, y, width, height } = object.bounds;
        if (object.collision) this.add.ellipse(x + width / 2, object.collision.y + object.collision.height - 1, width * .9, 9, 0x120f1d, .25).setDepth(-80);
        this.add.image(x, y, 'props-native', object.id.startsWith('window') ? 'window' : object.id).setOrigin(0).setDisplaySize(width, height).setDepth(object.depth);
      }
      for (const candle of CANDLES) this.add.image(candle.x, candle.y + 24, 'props-native', 'candle').setOrigin(.5, 1).setDepth(candle.depth);
      this.add.image(368, 234, 'props-native', 'letter').setDepth(284);
      this.add.image(799, 199, 'props-native', 'parcel').setDepth(251);
    }
    private effects(time: number, world: World) {
      const clock = reducedMotion ? 0 : time;
      const frame = Math.floor(clock / 115);
      if (frame === this.effectFrame) return;
      this.effectFrame = frame;
      this.fire.setVisible(Boolean(world.story.flags.hearth)).setFrame(`fire-${frame % 6}`);
      this.illumination.clear();
      // Pixel-stepped light pools stay restrained enough to keep all furniture readable.
      const pool = (x: number, y: number, radius: number, color: number, strength: number) => {
        for (let band = 5; band >= 1; band--) {
          this.illumination.fillStyle(color, strength * (1 + Math.sin(frame * .7) * .09));
          this.illumination.fillEllipse(x, y, radius * band / 5, radius * band / 8);
        }
      };
      pool(277, 243, 145, 0x859ccb, .022); pool(687, 243, 145, 0x859ccb, .022);
      if (world.story.flags.hearth) pool(556, 258, 202, 0xf1a147, .028);
      this.candleFlames.clear();
      for (const [index, candle] of CANDLES.entries()) {
        if (world.story.flags[candle.flag] === false) continue;
        const sway = reducedMotion ? 0 : [0, 0, 1, 0, -1, 0][(frame + index * 2) % 6];
        const x = candle.x + sway, y = candle.y;
        this.candleFlames.fillStyle(0xb84e31); this.candleFlames.fillRect(x - 2, y - 7, 4, 7);
        this.candleFlames.fillStyle(0xf09d46); this.candleFlames.fillRect(x - 1, y - 9, 2, 8); this.candleFlames.fillRect(x - 2, y - 5, 4, 4);
        this.candleFlames.fillStyle(0xffd886); this.candleFlames.fillRect(x - 1, y - 5, 2, 5);
        this.candleFlames.fillStyle(0xffedb0); this.candleFlames.fillRect(x, y - 3, 1, 2);
        pool(candle.x, candle.y + 32, 108, 0xffbf6c, .019);
      }
      this.candleFlames.setDepth(440);
      this.motes.clear();
      if (!reducedMotion) for (let i = 0; i < 10; i++) {
        const x = 225 + (i * 73) % 520 + Math.sin(clock / 3500 + i) * 6;
        const y = 168 + (i * 41 + clock / 230) % 260;
        this.motes.fillStyle(i % 3 ? 0xe7cba0 : 0xabc9ef, .10 + Math.sin(clock / 900 + i) * .06);
        this.motes.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
      // State can change between effect ticks, including reduced-motion mode.
    }
    update(time: number, delta: number) {
      const current = state();
      // Always respond to shared switches even if animation is reduced or the room is paused.
      const lightState = `${Boolean(current.world.story.flags.hearth)}:${current.world.story.flags['candle-desk'] !== false}:${current.world.story.flags['candle-table'] !== false}`;
      if (parent.dataset.lightState !== lightState) { parent.dataset.lightState = lightState; this.effectFrame = -1; }
      this.effects(time, current.world);
      for (const [id, actor] of this.actors) actor.container.setVisible(current.activeIds.includes(id));
      for (const id of current.activeIds) {
        const p = current.world.players[id]; if (!p) continue;
        let actor = this.actors.get(id);
        if (!actor) {
          const shadow = this.add.ellipse(0, -1, 23, 7, 0x100e1b, .38);
          const initial = residentFrame('down', 0, false);
          const sprite = this.add.image(0, 0, 'residents-native', initial.frame).setOrigin(RESIDENT_ORIGIN.x, RESIDENT_ORIGIN.y);
          if (p.appearance === 'moss') sprite.setTint(0xc4d8b6);
          if (p.appearance === 'violet') sprite.setTint(0xd2bde7);
          const parts: Phaser.GameObjects.GameObject[] = [shadow, sprite];
          if (id !== current.localId) parts.push(this.add.text(0, -54, p.name, { fontSize: '9px', fontFamily: 'sans-serif', color: '#d7e5d7', stroke: '#211b24', strokeThickness: 3 }).setOrigin(.5));
          const container = this.add.container(p.x, p.y, parts);
          actor = { container, sprite, facing: 'down', distance: 0, lastTravel: -Infinity }; this.actors.set(id, actor);
        }
        const dx = p.x - actor.container.x, dy = p.y - actor.container.y;
        const remaining = Math.hypot(dx, dy);
        const moving = remaining > .35;
        if (moving) {
          actor.facing = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
          const amount = Math.min(remaining, Math.max(0, delta) * .14);
          const next = moveInRoom(actor.container, dx / remaining, dy / remaining, amount);
          const travelled = Math.hypot(next.x - actor.container.x, next.y - actor.container.y);
          actor.distance += travelled;
          if (travelled > .01) actor.lastTravel = time;
          actor.container.setPosition(next.x, next.y);
        } else if (remaining <= .35) actor.container.setPosition(p.x, p.y);
        const pose = residentFrame(actor.facing, actor.distance, time - actor.lastTravel < 115 && !(id === current.localId && paused()));
        actor.sprite.setFrame(pose.frame).setFlipX(pose.flipX);
        actor.container.setDepth(actor.container.y);
        if (id === current.localId) {
          if (this.followed !== id) { this.cameras.main.startFollow(actor.container, true, .15, .15, 0, 90); this.followed = id; }
          telemetry('playerX', Number(p.x.toFixed(2))); telemetry('playerY', Number(p.y.toFixed(2)));
          telemetry('playerFacing', actor.facing); telemetry('playerFrame', pose.frame); telemetry('playerFlipX', String(pose.flipX));
          telemetry('nearestObject', nearestInteractable(p)?.id ?? '');
        }
      }
      telemetry('cameraX', Math.round(this.cameras.main.scrollX)); telemetry('cameraY', Math.round(this.cameras.main.scrollY));
      telemetry('renderScale', Number((parent.clientWidth / this.scale.width).toFixed(3)));
      this.cooldown -= delta;
      if (!paused() && this.cooldown <= 0) {
        const dx = Number(this.keys.D.isDown || this.keys.RIGHT.isDown) - Number(this.keys.A.isDown || this.keys.LEFT.isDown);
        const dy = Number(this.keys.S.isDown || this.keys.DOWN.isDown) - Number(this.keys.W.isDown || this.keys.UP.isDown);
        if (dx || dy) { direction(dx, dy); this.cooldown = 110; }
      }
    }
  }
  const canvasDiagnostic = new URLSearchParams(location.search).get('renderer') === 'canvas';
  const size = logicalSize();
  const game = new Phaser.Game({ type: canvasDiagnostic ? Phaser.CANVAS : Phaser.AUTO, parent, ...size, backgroundColor: '#101018',
    pixelArt: true, roundPixels: true, render: { antialias: false }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: ArrivalScene, audio: { noAudio: true } });
  const resize = new ResizeObserver(() => { const next = logicalSize(); if (next.height !== game.scale.height) game.scale.resize(next.width, next.height); });
  resize.observe(parent);
  return () => { resize.disconnect(); game.destroy(true); };
}


