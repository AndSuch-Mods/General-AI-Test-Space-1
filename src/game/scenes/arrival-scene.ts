import Phaser from 'phaser';
import type { World } from '../model';
import { ROOM_SIZE, getRoomObjects, objectColliders, canInteract, nearestInteractable, moveInRoom, objectOffset, roomLayout, roomFlag, type RoomLayout, type FurnitureId, type RoomMap, type RoomObject } from '../../content/room';
import { RESIDENT_FRAMES, RESIDENT_IMAGE, RESIDENT_ORIGIN, RESIDENT_NATIVE_WIDTH, RESIDENT_NATIVE_HEIGHT, RESIDENT_DISPLAY_WIDTH, RESIDENT_DISPLAY_HEIGHT, type ResidentFacing } from '../art/resident-atlas';
import { residentFrame } from '../art/resident-animation';
import { residentCanvas, type ResidentAppearance } from '../art/resident-appearance';
import { ROOM_DOOR_IMAGE, ROOM_FLAME_IMAGE, ROOM_IMAGE, ROOM_MATERIAL_IMAGE, ROOM_TEXTURE } from '../art/room-atlas';
import { buildRoomTextures } from '../art/room-textures';
import { RoomWindowSky } from '../art/room-windows';
import { daylight, dayPhase, nightVariant } from '../time';

import type { RoomPresentation } from '../presentation';

type Resident = {
  container: Phaser.GameObjects.Container; sprite: Phaser.GameObjects.Image;
  facing: ResidentFacing; distance: number; lastTravel: number; map: RoomMap; sleeping: boolean;
  settlingAt: number; settleFrom: { x: number; y: number };
};
type Furnishing = { object: RoomObject; amount: number; base?: Phaser.GameObjects.Image; parts: Phaser.GameObjects.Image[]; shade: Phaser.GameObjects.Graphics };

export async function mountArrival(parent: HTMLElement, state: () => { world: World; localId: string; activeIds: string[]; arranging?: { id: FurnitureId; x: number; y: number; error: string | null } }, direction: (dx: number, dy: number) => void, interact: () => void, paused: () => boolean, presentation: RoomPresentation) {
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
    private candleFlames = new Map<string, Phaser.GameObjects.Graphics>();
    private layout: RoomLayout = {};
    private layoutKey = '';
    private wasArranging = false;
    private motes!: Phaser.GameObjects.Graphics;
    private keys!: Record<string, Phaser.Input.Keyboard.Key>;
    private cooldown = 0;
    private effectFrame = -1;
    private followed = '';
    private roomMap: RoomMap = 'castle';
    private roomDisplay: Phaser.GameObjects.GameObject[] = [];
    private furnishings: Furnishing[] = [];
    private windowSky!: RoomWindowSky;
    private ambience!: Phaser.GameObjects.Rectangle;
    private blockedKeys = new Set<string>();
    private outdoorLight = -1;
    preload() {
      this.load.image(ROOM_TEXTURE, ROOM_IMAGE);
      this.load.image('room-materials', ROOM_MATERIAL_IMAGE);
      this.load.image('room-flames', ROOM_FLAME_IMAGE);
      this.load.image('room-doors', ROOM_DOOR_IMAGE);
      this.load.image('resident-source', `./${RESIDENT_IMAGE}`);
    }
    create() {
      buildRoomTextures(this);

      // Resolve source art to a single native character grid once, never per animation frame.
      const source = this.textures.get('resident-source').getSourceImage() as HTMLImageElement;
      for (const appearance of ['amber', 'moss', 'violet'] as ResidentAppearance[]) {
        const texture = this.textures.createCanvas(`resident-${appearance}`, RESIDENT_NATIVE_WIDTH * (RESIDENT_FRAMES.length + 1), RESIDENT_NATIVE_HEIGHT)!;
        texture.context.imageSmoothingEnabled = false;
        RESIDENT_FRAMES.forEach((frame, index) => {
          texture.context.drawImage(residentCanvas(source, frame.name, appearance), index * RESIDENT_NATIVE_WIDTH, 0);
          texture.add(frame.name, 0, index * RESIDENT_NATIVE_WIDTH, 0, RESIDENT_NATIVE_WIDTH, RESIDENT_NATIVE_HEIGHT);
        });
        // Keep the resident's authored face and close only the eye clusters for rest.
        const restX = RESIDENT_FRAMES.length * RESIDENT_NATIVE_WIDTH;
        texture.context.drawImage(residentCanvas(source, 'down-idle', appearance), restX, 0);
        for (const x of [13, 18]) {
          texture.context.fillStyle = '#cfaa83'; texture.context.fillRect(restX + x, 14, 2, 2);
          texture.context.fillStyle = '#57403b'; texture.context.fillRect(restX + x, 15, 2, 1);
        }
        texture.add('down-rest', 0, restX, 0, RESIDENT_NATIVE_WIDTH, RESIDENT_NATIVE_HEIGHT);
        texture.refresh();
      }
      this.windowSky = new RoomWindowSky(this);
      const current = state();
      this.roomMap = current.world.players[current.localId].map;
      this.layout = roomLayout(current.world, this.roomMap); this.layoutKey = JSON.stringify(this.layout);
      this.buildRoom();
      this.illumination = this.add.graphics().setDepth(800);
      this.fire = this.add.image(556, 232, 'flames-native', 'fire-0').setOrigin(.5, 1).setScale(2).setTint(0xe9cfad).setDepth(243);
      this.motes = this.add.graphics().setDepth(900);
      this.ambience = this.add.rectangle(0, 0, ROOM_SIZE.width, ROOM_SIZE.height, 0x14152b, .1).setOrigin(0).setDepth(700);
      this.cameras.main.setBounds(0, 38, ROOM_SIZE.width, 464).setRoundPixels(true);
      this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE') as Record<string, Phaser.Input.Keyboard.Key>;
      this.input.keyboard!.on('keyup', (event: KeyboardEvent) => {
        for (const [name, key] of Object.entries(this.keys)) if (key.keyCode === event.keyCode) this.blockedKeys.delete(name);
      });
      for (const key of ['E', 'SPACE']) this.input.keyboard!.on(`keydown-${key}`, (event: KeyboardEvent) => {
        if (!event.repeat && !paused()) interact();
      });
    }
    private buildRoom() {
      for (const item of this.roomDisplay) item.destroy();
      const previous = new Set(this.children.list);
      this.furnishings = []; this.candleFlames.clear(); presentation.clear();
      this.add.rectangle(64, 58, 832, 444, 0x17151f).setOrigin(0).setDepth(-100);
      this.add.tileSprite(80, 210, 800, 266, 'materials-native', 'floor').setOrigin(0).setTileScale(2).setDepth(-99);
      this.add.tileSprite(80, 74, 800, 136, 'materials-native', 'wall').setOrigin(0).setTileScale(2).setDepth(-98);
      const trim = this.add.graphics().setDepth(-97);
      trim.fillStyle(0x1e1924); trim.fillRect(76, 68, 808, 8); trim.fillRect(76, 204, 808, 8);
      trim.fillStyle(0x67483c); trim.fillRect(80, 75, 800, 3); trim.fillRect(80, 203, 800, 2);
      trim.fillStyle(0x37262b); trim.fillRect(64, 70, 16, 418); trim.fillRect(880, 70, 16, 418); trim.fillRect(64, 476, 832, 14);
      trim.fillStyle(0x87624b); trim.fillRect(78, 76, 2, 401); trim.fillRect(880, 76, 2, 401); trim.fillRect(80, 476, 800, 2);
      // A woven floor layer remains walkable, distinct from the furniture above it.
      if (getRoomObjects(this.roomMap, this.layout).some(object => object.id === 'carpet')) {
      const rugOffset = objectOffset('carpet', this.layout);
      const rug = this.add.graphics().setDepth(-90).setPosition(rugOffset.x, rugOffset.y);
      rug.fillStyle(0x342435); rug.fillRect(338, 316, 318, 132);
      rug.fillStyle(0x77434b); rug.fillRect(342, 320, 310, 124);
      rug.fillStyle(0xb18b67); rug.fillRect(347, 325, 300, 2); rug.fillRect(347, 437, 300, 2); rug.fillRect(347, 325, 2, 114); rug.fillRect(645, 325, 2, 114);
      rug.fillStyle(0x57303e); rug.fillRect(354, 332, 286, 100);
      for (let x = 365; x < 635; x += 18) {
        rug.fillStyle(0x87545c); rug.fillRect(x, 335, 4, 4); rug.fillRect(x, 425, 4, 4);
        rug.fillStyle(0x9e7b5b); rug.fillRect(x, 313, 1, 3); rug.fillRect(x, 448, 1, 3);
      }
      for (const center of [418, 497, 576]) {
        for (let y = -28; y <= 28; y += 2) {
          const edge = Math.floor((28 - Math.abs(y)) * 1.1 / 2) * 2;
          rug.fillStyle(0x8d5961); rug.fillRect(center - edge, 382 + y, 2, 2); rug.fillRect(center + edge - 2, 382 + y, 2, 2);
          if (Math.abs(y) < 20) {
            const inner = 20 - Math.abs(y);
            rug.fillStyle(0xa47e62); rug.fillRect(center - inner, 382 + y, 2, 2); rug.fillRect(center + inner, 382 + y, 2, 2);
          }
        }
        rug.fillStyle(0x8d5961); rug.fillRect(center - 5, 381, 11, 3); rug.fillRect(center - 1, 377, 3, 11);
      }
      } else {
        this.add.rectangle(444, 262, 72, 208, 0x543746).setOrigin(0).setDepth(-90);
        this.add.rectangle(448, 262, 2, 208, 0x9b7658).setOrigin(0).setDepth(-89);
        this.add.rectangle(510, 262, 2, 208, 0x9b7658).setOrigin(0).setDepth(-89);
      }
      for (const object of getRoomObjects(this.roomMap, this.layout)) {
        const { x, y, width, height } = object.bounds;
        const colliders = objectColliders(object);
        if (colliders.length) this.add.ellipse(x + width / 2, object.depth - 1, width * .9, 10, 0x120f1d, .25).setDepth(-80);
        const image = (frame: string, texture = 'props-native') => this.add.image(x, y, texture, frame).setOrigin(0).setDisplaySize(width, height).setDepth(object.depth);
        if (object.id === 'carpet') continue;
        if (object.id.startsWith('candle-')) {
          image('candle'); this.candleFlames.set(object.id, this.add.graphics().setDepth(object.depth + .1));
        } else if (object.id === 'bed') {
          image('bed-back').setDisplaySize(width, 54).setDepth(y + 34);
          image('bed-front').setPosition(x, y + 54).setDisplaySize(width, height - 54).setDepth(y + height);
        } else if (object.id.startsWith('window')) {
          image('__BASE', 'window-sky-native'); image('window').setDepth(object.depth + .1);
        } else if (object.id.startsWith('door')) {
          const base = image('closed', 'wood-door');
          const open = image('open', 'wood-door').setAlpha(0).setDepth(object.depth + .1);
          this.furnishings.push({ object, base, parts: [open], amount: 0, shade: this.add.graphics().setDepth(object.depth + .05) });
        } else if (object.id === 'landing-stairs') image('stairs', 'doors-native');
        else if (object.id === 'chest') {
          image('chest-base').setPosition(x, y + 24).setDisplaySize(width, height - 24);
          const lid = image('chest-lid').setDisplaySize(width, 24).setDepth(object.depth + .1);
          this.furnishings.push({ object, parts: [lid], amount: 0, shade: this.add.graphics().setDepth(object.depth - .1) });
        } else {
          image(object.id);
          if (object.id === 'pantry' || object.id === 'desk') {
            const parts = ['left', 'right'].map(side => this.add.image(x, y, 'props-native', `${object.id}-${side}`).setOrigin(0).setScale(2).setDepth(object.depth + .2).setVisible(false));
            this.furnishings.push({ object, parts, amount: 0, shade: this.add.graphics().setDepth(object.depth + .1) });
          }
        }
      }
      const pantry = getRoomObjects(this.roomMap, this.layout).find(o => o.id === 'pantry');
      if (pantry) {
        this.add.image(pantry.bounds.x + 49, pantry.bounds.y + 85, 'props-native', 'parcel').setScale(2).setDepth(pantry.depth + 1);
      }
      const arrangement = state().arranging;
      const arrangedObject = arrangement && getRoomObjects(this.roomMap, this.layout).find(o => o.id === arrangement.id);
      if (arrangement && arrangedObject) {
        const object = arrangedObject;
        const outline = this.add.graphics().setDepth(1000);
        outline.lineStyle(2, arrangement.error ? 0xd88872 : 0xc9cc91, 1);
        outline.strokeRect(object.bounds.x - 2, object.bounds.y - 2, object.bounds.width + 4, object.bounds.height + 4);
      }
      this.roomDisplay = this.children.list.filter(item => !previous.has(item));
      this.effectFrame = -1;
    }
    private animateFurnishings(current: ReturnType<typeof state>, delta: number) {
      const residents = current.activeIds.map(id => current.world.players[id]).filter(player => player?.map === this.roomMap);
      for (const furnishing of this.furnishings) {
        const { object, parts, shade } = furnishing;
        const target = residents.some(player => object.id.startsWith('door') ? canInteract(player, object, this.layout) : player.interaction === object.id) ? 1 : 0;
        furnishing.amount += Math.sign(target - furnishing.amount) * Math.min(Math.abs(target - furnishing.amount), delta / 240);
        const amount = reducedMotion ? target : furnishing.amount;
        presentation.update(object.id, amount);
        const { x, y, width } = object.bounds;
        shade.clear();
        if (object.id.startsWith('door')) {
          furnishing.base!.setAlpha(1 - amount); parts[0].setAlpha(amount);

        }
        else if (object.id === 'chest') {
          shade.fillStyle(0x19171f, amount); shade.fillRect(x + 6, y + 14, width - 12, 18);
          parts[0].setY(y - Math.round(amount * 7) * 2).setDisplaySize(width, 24 + Math.round(amount * 3) * 2);
        } else if (object.id === 'pantry') {
          shade.fillStyle(0x211b24, amount); shade.fillRect(x + 8, y + 78, 78, 50);
          const doorWidth = 36 - Math.round(amount * 12) * 2;
          parts[0].setVisible(amount > 0).setPosition(x + 8 - Math.round(amount * 6) * 2, y + 78).setDisplaySize(doorWidth, 50);
          parts[1].setVisible(amount > 0).setPosition(x + 50 + Math.round(amount * 18) * 2, y + 78).setDisplaySize(doorWidth, 50);
        } else if (object.id === 'desk') {
          for (const [index, part] of parts.entries()) {
            const offset = index ? 78 : 10;
            shade.fillStyle(0x211b24, amount); shade.fillRect(x + offset, y + 34, 22, 16);
            part.setVisible(amount > 0).setPosition(x + offset, y + 34 + Math.round(amount * 5) * 2);
          }
        }
      }
      telemetry('containerPoses', JSON.stringify(Object.fromEntries(this.furnishings.map(item => [item.object.id, item.amount]))));
      telemetry('openObjects', this.furnishings.filter(item => item.amount > .5).map(item => item.object.id).join(','));
    }
    private effects(time: number, world: World) {
      const clock = reducedMotion ? 0 : time;
      const frame = Math.floor(clock / 115);
      if (frame === this.effectFrame) return;
      this.effectFrame = frame;
      const hearth = getRoomObjects(this.roomMap, this.layout).find(object => object.id === 'hearth');
      const hearthLit = !!hearth && roomFlag(world, this.roomMap, 'hearth');
      this.fire.setVisible(hearthLit).setFrame(`fire-${frame % 6}`);
      if (hearth) this.fire.setPosition(hearth.bounds.x + 56, hearth.bounds.y + 102).setDepth(hearth.depth + 1);
      this.illumination.clear();
      // Pixel-stepped light pools stay restrained enough to keep all furniture readable.
      const pool = (x: number, y: number, radius: number, color: number, strength: number) => {
        for (let band = 5; band >= 1; band--) {
          this.illumination.fillStyle(color, strength * (1 + Math.sin(frame * .7) * .09));
          const rx = radius * band / 10, ry = radius * band / 16;
          for (let row = -Math.floor(ry / 2) * 2; row <= ry; row += 2) {
            const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - row * row / (ry * ry))) / 2) * 2;
            this.illumination.fillRect(Math.round((x - half) / 2) * 2, Math.round((y + row) / 2) * 2, half * 2, 2);
          }
        }
      };
      for (const window of getRoomObjects(this.roomMap, this.layout).filter(object => object.id.startsWith('window'))) pool(window.bounds.x + 26, 243, 145, daylight(world.clock.totalMinutes) > .5 ? 0xb5c4ba : 0x859ccb, .022);
      if (hearth && hearthLit) pool(hearth.bounds.x + 56, hearth.bounds.y + 128, 202, 0xf1a147, .028);
      const candles = getRoomObjects(this.roomMap, this.layout).filter(object => object.id.startsWith('candle-'));
      for (const [index, candle] of candles.entries()) {
        const flames = this.candleFlames.get(candle.id)!; flames.clear();
        if (!roomFlag(world, this.roomMap, candle.id, true)) continue;
        const sway = reducedMotion ? 0 : [0, 0, 1, 0, -1, 0][(frame + index * 2) % 6];
        const x = Math.round((candle.bounds.x + 5) / 2) * 2 + sway * 2, y = candle.bounds.y;
        flames.fillStyle(0xb84e31); flames.fillRect(x - 2, y - 8, 4, 8);
        flames.fillStyle(0xf09d46); flames.fillRect(x, y - 10, 2, 8); flames.fillRect(x - 2, y - 6, 4, 4);
        flames.fillStyle(0xffd886); flames.fillRect(x, y - 6, 2, 6);
        flames.fillStyle(0xffedb0); flames.fillRect(x, y - 4, 2, 2);
        pool(x, y + 32, 108, 0xffbf6c, .019);
      }
      this.motes.clear();
      if (!reducedMotion) for (let i = 0; i < 10; i++) {
        const x = 225 + (i * 73) % 520 + Math.sin(clock / 3500 + i) * 6;
        const y = 168 + (i * 41 + clock / 230) % 260;
        this.motes.fillStyle(i % 3 ? 0xe7cba0 : 0xabc9ef, .10 + Math.sin(clock / 900 + i) * .06);
        this.motes.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, 2, 2);
      }
      // State can change between effect ticks, including reduced-motion mode.
    }
    update(time: number, delta: number) {
      const current = state();
      const local = current.world.players[current.localId];
      const savedLayout = roomLayout(current.world, local.map);
      const previewLayout = current.arranging ? { ...savedLayout, [current.arranging.id]: { x: current.arranging.x, y: current.arranging.y } } : savedLayout;
      const layoutKey = JSON.stringify(previewLayout) + (current.arranging?.error ?? '');
      if (local.map !== this.roomMap || layoutKey !== this.layoutKey || !!current.arranging !== this.wasArranging) {
        this.roomMap = local.map; this.layout = previewLayout; this.layoutKey = layoutKey; this.wasArranging = !!current.arranging;
        this.buildRoom(); this.followed = '';
      }
      this.windowSky.update(current.world, reducedMotion);
      const outdoorLight = Math.round(daylight(current.world.clock.totalMinutes) * 20);
      if (outdoorLight !== this.outdoorLight) { this.outdoorLight = outdoorLight; this.effectFrame = -1; }
      this.ambience.setAlpha(.14 - outdoorLight / 20 * .12);
      this.animateFurnishings(current, delta);
      // Always respond to shared switches even if animation is reduced or the room is paused.
      const lightState = `${roomFlag(current.world, this.roomMap, 'hearth')}:${roomFlag(current.world, this.roomMap, 'candle-desk', true)}:${roomFlag(current.world, this.roomMap, 'candle-table', true)}`;
      if (parent.dataset.lightState !== lightState) { parent.dataset.lightState = lightState; this.effectFrame = -1; }
      this.effects(time, current.world);
      for (const [id, actor] of this.actors) actor.container.setVisible(current.activeIds.includes(id) && current.world.players[id]?.map === this.roomMap);
      for (const id of current.activeIds) {
        const p = current.world.players[id]; if (!p) continue;
        if (p.map !== this.roomMap) continue;
        let actor = this.actors.get(id);
        if (!actor) {
          const shadow = this.add.ellipse(0, -1, 38, 10, 0x100e1b, .38);
          const initial = residentFrame('down', 0, false);
          const sprite = this.add.image(0, 0, `resident-${p.appearance}`, initial.frame).setOrigin(RESIDENT_ORIGIN.x, RESIDENT_ORIGIN.y).setDisplaySize(RESIDENT_DISPLAY_WIDTH, RESIDENT_DISPLAY_HEIGHT);
          const parts: Phaser.GameObjects.GameObject[] = [shadow, sprite];
          if (id !== current.localId) parts.push(this.add.text(0, -102, p.name, { fontSize: '9px', fontFamily: 'sans-serif', color: '#d7e5d7', stroke: '#211b24', strokeThickness: 3 }).setOrigin(.5));
          const container = this.add.container(p.x, p.y, parts);
          actor = { container, sprite, facing: 'down', distance: 0, lastTravel: -Infinity, map: p.map, sleeping: p.fatigue.sleeping, settlingAt: -Infinity, settleFrom: { x: p.x, y: p.y } }; this.actors.set(id, actor);
        }
        if (actor.map !== p.map || actor.sleeping !== p.fatigue.sleeping) {
          if (id === current.localId && p.fatigue.sleeping && !actor.sleeping) {
            for (const [name, key] of Object.entries(this.keys)) if (key.isDown) this.blockedKeys.add(name);
            this.input.keyboard!.resetKeys();
          }
          if (p.fatigue.sleeping && !actor.sleeping && actor.map === p.map && !reducedMotion) {
            actor.settlingAt = time; actor.settleFrom = { x: actor.container.x, y: actor.container.y };
          } else {
            actor.container.setPosition(p.x, p.y); actor.settlingAt = -Infinity;
          }
          actor.map = p.map; actor.sleeping = p.fatigue.sleeping; actor.lastTravel = -Infinity;
        }
        const dx = p.x - actor.container.x, dy = p.y - actor.container.y;
        const remaining = Math.hypot(dx, dy);
        const moving = remaining > .35 && !p.fatigue.sleeping;
        if (moving) {
          actor.facing = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
          const amount = Math.min(remaining, Math.max(0, delta) * .14);
          const next = moveInRoom(actor.container, dx / remaining, dy / remaining, amount, p.map, roomLayout(current.world, p.map));
          const travelled = Math.hypot(next.x - actor.container.x, next.y - actor.container.y);
          actor.distance += travelled;
          if (travelled > .01) actor.lastTravel = time;
          actor.container.setPosition(next.x, next.y);
        } else if (remaining <= .35) actor.container.setPosition(p.x, p.y);
        const sleepProgress = p.fatigue.sleeping ? Math.min(1, Math.max(0, (time - actor.settlingAt) / 420)) : 0;
        const settled = sleepProgress * sleepProgress * (3 - 2 * sleepProgress);
        if (p.fatigue.sleeping) {
          actor.facing = 'down';
          // Each resident settles into the personal side saved by the host, under the quilt.
          actor.container.setPosition(actor.settleFrom.x + (p.x - actor.settleFrom.x) * settled, actor.settleFrom.y + (p.y - actor.settleFrom.y) * settled);
        }
        const pose = residentFrame(actor.facing, actor.distance, !p.fatigue.sleeping && time - actor.lastTravel < 115 && !(id === current.localId && paused()));
        actor.sprite.setFrame(sleepProgress > .45 ? 'down-rest' : pose.frame).setFlipX(pose.flipX).setY(-Math.round(8 * settled) * 2);
        actor.container.setDepth(p.fatigue.sleeping ? 300 + objectOffset('bed', roomLayout(current.world, p.map)).y : actor.container.y);
        if (id === current.localId) {
          const arrangedObject = current.arranging && getRoomObjects(this.roomMap, this.layout).find(o => o.id === current.arranging!.id);
          if (arrangedObject) {
            const object = arrangedObject;
            this.cameras.main.stopFollow(); this.cameras.main.centerOn(object.bounds.x + object.bounds.width / 2, object.bounds.y + object.bounds.height / 2 + 60); this.followed = '';
          } else if (this.followed !== id) { this.cameras.main.startFollow(actor.container, true, .15, .15, 0, 90); this.followed = id; }
          telemetry('playerX', Number(p.x.toFixed(2))); telemetry('playerY', Number(p.y.toFixed(2)));
          telemetry('playerFacing', actor.facing); telemetry('playerFrame', actor.sprite.frame.name); telemetry('playerFlipX', String(pose.flipX));
          telemetry('nearestObject', nearestInteractable(p, savedLayout)?.id ?? '');
          telemetry('residentWidth', actor.sprite.displayWidth); telemetry('residentHeight', actor.sprite.displayHeight);
          telemetry('playerMap', p.map); telemetry('renderedMap', this.roomMap); telemetry('playerSleeping', String(p.fatigue.sleeping));
          telemetry('playerHeight', actor.sprite.displayHeight); telemetry('sleeping', String(p.fatigue.sleeping));
          telemetry('sleepPoseProgress', Number(sleepProgress.toFixed(2)));
        }
      }
      telemetry('layout', JSON.stringify(savedLayout));
      telemetry('arranging', current.arranging?.id ?? '');
      telemetry('placementX', current.arranging?.x ?? 0);
      const deskCandle = getRoomObjects(this.roomMap, this.layout).find(o => o.id === 'candle-desk');
      telemetry('candleDeskDepth', deskCandle ? deskCandle.depth + .1 : 0);
      telemetry('cameraX', Math.round(this.cameras.main.scrollX)); telemetry('cameraY', Math.round(this.cameras.main.scrollY));
      telemetry('renderScale', Number((parent.clientWidth / this.scale.width).toFixed(3)));
      telemetry('totalMinutes', current.world.clock.totalMinutes);
      telemetry('dayPhase', dayPhase(current.world.clock.totalMinutes)); telemetry('nightVariant', nightVariant(current.world));
      telemetry('daylight', Number(daylight(current.world.clock.totalMinutes).toFixed(3)));
      telemetry('visiblePlayers', [...this.actors].filter(([, actor]) => actor.container.visible).map(([id]) => id).sort().join(','));
      this.cooldown -= delta;
      if (!paused() && !local.fatigue.sleeping && this.cooldown <= 0) {
        const down = (name: string) => this.keys[name].isDown && !this.blockedKeys.has(name);
        const dx = Number(down('D') || down('RIGHT')) - Number(down('A') || down('LEFT'));
        const dy = Number(down('S') || down('DOWN')) - Number(down('W') || down('UP'));
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
