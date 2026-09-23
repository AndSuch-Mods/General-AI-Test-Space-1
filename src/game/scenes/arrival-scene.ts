import Phaser from 'phaser';
import type { Player, World } from '../model';
import { ROOM_SIZE, getRoomObjects, objectColliders, canInteract, nearestInteractable, moveInRoom, FURNITURE_IDS, roomLayout, roomFlag, type RoomLayout, type FurnitureId, type RoomMap, type RoomObject } from '../../content/room';
import { RESIDENT_FRAMES, RESIDENT_ORIGIN, RESIDENT_NATIVE_WIDTH, RESIDENT_NATIVE_HEIGHT, RESIDENT_DISPLAY_WIDTH, RESIDENT_DISPLAY_HEIGHT, type ResidentFacing } from '../art/resident-atlas';
import { residentFrame } from '../art/resident-animation';
import { residentCanvas, residentTextureKey } from '../art/resident-appearance';
import { ROOM_FLAME_IMAGE, ROOM_IMAGE, ROOM_MATERIAL_IMAGE, ROOM_TEXTURE } from '../art/room-atlas';
import { FURNITURE_IMAGES, furnitureArt, kitchenAnchors } from '../art/room-furniture';
import { ARCHITECTURE_IMAGES, doorArt } from '../art/room-architecture';
import { buildRoomTextures } from '../art/room-textures';
import { RoomWindowSky } from '../art/room-windows';
import { WINDOW_FRAME_OFFSET_Y, WINDOW_FRAME_NATIVE } from '../art/room-window-art';
import { STORAGE_IDS, type StorageId } from '../storage';
import { daylight, dayPhase, nightVariant } from '../time';
import { HotbarDock } from '../../ui/hotbar-dock';
import { bedLocal } from '../../content/room';

import type { RoomPresentation } from '../presentation';

type Resident = {
  container: Phaser.GameObjects.Container; sprite: Phaser.GameObjects.Image;
  facing: ResidentFacing; distance: number; lastTravel: number; map: RoomMap; sleeping: boolean; seated: boolean;
  settlingAt: number; settleFrom: { x: number; y: number };
  seatBlend: number; seatBlendFrom: number; seatId?: string; seatSlot?: number;
  bedDisturbances: number; reactionAt: number; reaction: Phaser.GameObjects.Image;
};
type Furnishing = { object: RoomObject; amount: number; image: Phaser.GameObjects.Image; frames: string[] };
export type RoomDesignView = { layout: RoomLayout; selected?: FurnitureId; invalid: boolean };
export type RoomDesignControls = { select: (id: FurnitureId) => void; drag: (id: FurnitureId, dx: number, dy: number) => void; drop: (id: FurnitureId) => void; rotate: (id: FurnitureId) => void; cancelDrag?: () => void };

export async function mountArrival(parent: HTMLElement, state: () => { world: World; localId: string; activeIds: string[]; design?: RoomDesignView }, direction: (dx: number, dy: number) => void, interact: () => void, paused: () => boolean, presentation: RoomPresentation, designControls?: RoomDesignControls) {
  const hotbar = parent.parentElement?.querySelector<HTMLElement>('.quickbar');
  const hotbarDock = new HotbarDock();
  let hotbarHeld = false;
  const holdHotbar = () => { hotbarHeld = true; };
  const releaseHotbar = () => { hotbarHeld = false; };
  hotbar?.addEventListener('pointerdown', holdHotbar);
  window.addEventListener('pointerup', releaseHotbar);
  window.addEventListener('pointercancel', releaseHotbar);
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
    private drag?: { id: FurnitureId; x: number; y: number; moved: boolean; pointer: number };
    private kitchenEffects = new Map<string, Phaser.GameObjects.Graphics>();
    preload() {
      this.load.image(ROOM_TEXTURE, ROOM_IMAGE);
      this.load.image('room-materials', ROOM_MATERIAL_IMAGE);
      this.load.image('room-flames', ROOM_FLAME_IMAGE);
      for (const image of ARCHITECTURE_IMAGES) this.load.image(image.key, image.path);
      for (const image of FURNITURE_IMAGES) this.load.image(image.key, image.url);
    }
    create() {
      buildRoomTextures(this);

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
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (!state().design || !designControls) return;
        const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const object = [...getRoomObjects(this.roomMap, this.layout)].filter(o => FURNITURE_IDS.includes(o.id as FurnitureId) && p.x >= o.bounds.x && p.x <= o.bounds.x + o.bounds.width && p.y >= o.bounds.y && p.y <= o.bounds.y + o.bounds.height).sort((a, b) => b.depth - a.depth)[0];
        if (!object) return;
        this.drag = { id: object.id as FurnitureId, x: p.x, y: p.y, moved: false, pointer: pointer.id }; designControls.select(this.drag.id);
      });
      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (!this.drag || pointer.id !== this.drag.pointer || !state().design) return;
        const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y), dx = p.x - this.drag.x, dy = p.y - this.drag.y;
        if (Math.hypot(dx, dy) > 3) this.drag.moved = true;
        if (this.drag.moved) designControls?.drag(this.drag.id, dx, dy);
      });
      const finish = (pointer: Phaser.Input.Pointer) => {
        if (!this.drag || pointer.id !== this.drag.pointer) return;
        if (this.drag.moved) designControls?.drop(this.drag.id); else designControls?.rotate(this.drag.id);
        this.drag = undefined;
      };
      this.input.on('pointerup', finish); this.input.on('pointerupoutside', finish);
      this.game.canvas.addEventListener('pointercancel', () => { if (this.drag) { designControls?.cancelDrag?.(); this.drag = undefined; } });
      this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE') as Record<string, Phaser.Input.Keyboard.Key>;
      this.input.keyboard!.on('keyup', (event: KeyboardEvent) => {
        for (const [name, key] of Object.entries(this.keys)) if (key.keyCode === event.keyCode) this.blockedKeys.delete(name);
      });
      for (const key of ['E', 'SPACE']) this.input.keyboard!.on(`keydown-${key}`, (event: KeyboardEvent) => {
        if (!event.repeat && !paused()) interact();
      });
    }
    private residentTexture(player: Player) {
      const key = residentTextureKey(player.appearance, player.look);
      if (this.textures.exists(key)) return key;
      // Cache the complete look, so residents sharing a coat color keep their own face and hair.
      const texture = this.textures.createCanvas(key, RESIDENT_NATIVE_WIDTH * RESIDENT_FRAMES.length, RESIDENT_NATIVE_HEIGHT)!;
      texture.context.imageSmoothingEnabled = false;
      RESIDENT_FRAMES.forEach((frame, index) => {
        texture.context.drawImage(residentCanvas(null, frame.name, player.appearance, player.look), index * RESIDENT_NATIVE_WIDTH, 0);
        texture.add(frame.name, 0, index * RESIDENT_NATIVE_WIDTH, 0, RESIDENT_NATIVE_WIDTH, RESIDENT_NATIVE_HEIGHT);
      });
      texture.refresh();
      return key;
    }
    private buildRoom() {
      for (const item of this.roomDisplay) item.destroy();
      const previous = new Set(this.children.list);
      this.furnishings = []; this.candleFlames.clear(); presentation.clear();
      this.add.rectangle(64, 22, 832, 480, 0x17151f).setOrigin(0).setDepth(-100);
      this.add.tileSprite(80, 210, 800, 266, 'materials-native', this.roomMap === 'landing' ? 'hall-floor' : this.roomMap === 'kitchen' ? 'kitchen-floor' : 'floor').setOrigin(0).setTileScale(2).setDepth(-99);
      this.add.tileSprite(80, 30, 800, 180, 'materials-native', this.roomMap === 'landing' ? 'hall-wall' : this.roomMap === 'kitchen' ? 'kitchen-wall' : 'wall').setOrigin(0).setTileScale(2).setDepth(-98);
      const trim = this.add.graphics().setDepth(-97);
      trim.fillStyle(0x1e1924); trim.fillRect(76, 24, 808, 8); trim.fillRect(76, 204, 808, 8);
      trim.fillStyle(0x67483c); trim.fillRect(80, 31, 800, 3); trim.fillRect(80, 203, 800, 2);
      trim.fillStyle(0x37262b); trim.fillRect(64, 26, 16, 462); trim.fillRect(880, 26, 16, 462); trim.fillRect(64, 476, 832, 14);
      trim.fillStyle(0x87624b); trim.fillRect(78, 32, 2, 445); trim.fillRect(880, 32, 2, 445); trim.fillRect(80, 476, 800, 2);
      for (const object of getRoomObjects(this.roomMap, this.layout)) {
        const { x, y, width, height } = object.bounds;
        if (objectColliders(object).length) this.add.ellipse(x + width / 2, object.depth - 1, width * .9, 10, 0x120f1d, .25).setDepth(-80);
        const image = (frame: string, texture = 'props-native') => this.add.image(x, y, texture, frame).setOrigin(0).setDisplaySize(width, height).setDepth(object.depth);
        const art = furnitureArt(object.id, object.rotation);
        if (object.id.startsWith('candle-')) {
          image('candle'); this.candleFlames.set(object.id, this.add.graphics().setDepth(object.depth + .1));
        } else if (object.id.startsWith('window')) {
          image('__BASE', 'window-sky-native'); image('window').setPosition(x, y + WINDOW_FRAME_OFFSET_Y).setDisplaySize(WINDOW_FRAME_NATIVE.width * 2, WINDOW_FRAME_NATIVE.height * 2).setDepth(object.depth + .1);
        } else if (object.door) {
          const art = doorArt(object.door.wall);
          this.furnishings.push({ object, image: image(art.openFrames[0], art.texture).setPosition(x + art.offsetX, y + art.offsetY).setDisplaySize(art.width, art.height), frames: art.openFrames, amount: 0 });
        } else if (art) {
          if (['bed', 'sofa', 'armchair'].includes(object.id)) {
            image(art.base, art.texture).setDepth(object.id === 'bed' ? object.floor!.y : object.depth); image(art.foreground, art.texture).setDepth(object.depth + .4);
          } else {
            const base = image(art.full, art.texture);
            if (STORAGE_IDS.includes(object.id as StorageId)) this.furnishings.push({ object, image: base, frames: art.openFrames, amount: 0 });
          }
        } else if (object.id !== 'letter' || !roomFlag(state().world, this.roomMap, 'letter-filed')) image(object.id);
      }
      const design = state().design, selected = design && getRoomObjects(this.roomMap, this.layout).find(o => o.id === design.selected);
      if (design && selected) {
        const outline = this.add.graphics().setDepth(1000);
        outline.lineStyle(3, design.invalid ? 0xef6b68 : 0x6ade85, 1);
        outline.strokeRect(selected.bounds.x - 2, selected.bounds.y - 2, selected.bounds.width + 4, selected.bounds.height + 4);
      }
      telemetry('roomObjects', JSON.stringify(getRoomObjects(this.roomMap, this.layout).map(o => ({ id: o.id, bounds: o.bounds, rotation: o.rotation ?? 0, depth: o.depth }))));
      this.roomDisplay = this.children.list.filter(item => !previous.has(item));
      telemetry('doorways', JSON.stringify(getRoomObjects(this.roomMap, this.layout).filter(object => object.door).map(object => ({ id: object.id, wall: object.door!.wall, to: object.door!.to, bounds: object.bounds }))));
      this.effectFrame = -1;
    }
    private animateFurnishings(current: ReturnType<typeof state>, delta: number) {
      const residents = current.activeIds.map(id => current.world.players[id]).filter(player => player?.map === this.roomMap);
      for (const furnishing of this.furnishings) {
        const { object } = furnishing;
        if (object.id === 'desk') {
          const user = residents.find(player => player.interaction === 'desk');
          if (user) furnishing.frames = furnitureArt('desk', object.rotation)!.drawerFrames[user.drawer];
        }
        const target = residents.some(player => object.door ? canInteract(player, object, this.layout) : player.interaction === object.id) ? 1 : 0;
        furnishing.amount += Math.sign(target - furnishing.amount) * Math.min(Math.abs(target - furnishing.amount), delta / 240);
        const amount = reducedMotion ? target : furnishing.amount;
        presentation.update(object.id, amount);
        furnishing.image.setFrame(furnishing.frames[Math.min(3, Math.floor(amount * 3.99))]);
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
      for (const window of getRoomObjects(this.roomMap, this.layout).filter(object => object.id.startsWith('window'))) pool(window.bounds.x + window.bounds.width / 2, 243, 145, daylight(world.clock.totalMinutes) > .5 ? 0xb5c4ba : 0x859ccb, .022);
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
      for (const graphics of this.kitchenEffects.values()) graphics.clear();
      for (const item of getRoomObjects(this.roomMap, this.layout).filter(o => ['stove', 'sink'].includes(o.id))) {
        if (!roomFlag(world, this.roomMap, item.id)) continue;
        let effect = this.kitchenEffects.get(item.id);
        if (!effect) { effect = this.add.graphics(); this.kitchenEffects.set(item.id, effect); }
        effect.setDepth(item.depth + .1);
        const anchors = kitchenAnchors(item.id as 'stove' | 'sink', item.rotation);
        const x = item.bounds.x, y = item.bounds.y;
        if (item.id === 'stove') {
          for (const [index, burner] of anchors.burners.entries()) {
            const bx = Math.round((x + burner.x) / 2) * 2, by = Math.round((y + burner.y) / 2) * 2;
            // A dark burner cap surrounded by separate tapering gas jets.
            // Violet bases and warm tips distinguish fire from the sink stream.
            effect.fillStyle(0x30264d); effect.fillRect(bx - 6, by - 2, 12, 4);
            for (const [jet, offset] of [-6, 0, 6].entries()) {
              const height = 4 + ((frame + index * 2 + jet) % 3 === 0 ? 2 : 0);
              effect.fillStyle(0x7061d9); effect.fillRect(bx + offset - 2, by - 2, 4, 2);
              effect.fillStyle(0xe5a84d); effect.fillRect(bx + offset, by - height, 2, height - 2);
              effect.fillStyle(0xffe5a0); effect.fillRect(bx + offset, by - height, 2, 2);
            }
          }
        } else if (anchors.spout) {
          const sx = x + anchors.spout.x, sy = y + anchors.spout.y, bottom = y + anchors.waterEnd!;
          effect.fillStyle(0x638d9c, .85); effect.fillRect(sx - 1, sy, 3, bottom - sy);
          effect.fillStyle(0xbce5e5, .85);
          for (let stream = sy + frame % 3 * 2; stream < bottom; stream += 6) effect.fillRect(sx, stream, 1, Math.min(4, bottom - stream));
          effect.fillStyle(0xc1e0dc, .6); effect.fillRect(sx - 4 + frame % 3 * 2, bottom, 2, 2);
        }
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
      const previewLayout = current.design?.layout ?? savedLayout;
      const layoutKey = JSON.stringify(previewLayout) + (current.design?.selected ?? '') + !!current.design?.invalid + roomFlag(current.world, local.map, 'letter-filed');
      if (local.map !== this.roomMap || layoutKey !== this.layoutKey || !!current.design !== this.wasArranging) {
        this.roomMap = local.map; this.layout = previewLayout; this.layoutKey = layoutKey; this.wasArranging = !!current.design;
        this.buildRoom(); this.followed = '';
      }
      this.windowSky.update(current.world, reducedMotion);
      const outdoorLight = Math.round(daylight(current.world.clock.totalMinutes) * 20);
      if (outdoorLight !== this.outdoorLight) { this.outdoorLight = outdoorLight; this.effectFrame = -1; }
      this.ambience.setAlpha(.14 - outdoorLight / 20 * .12);
      this.animateFurnishings(current, delta);
      // Always respond to shared switches even if animation is reduced or the room is paused.
      const lightState = `${roomFlag(current.world, this.roomMap, 'hearth')}:${roomFlag(current.world, this.roomMap, 'candle-desk', true)}:${roomFlag(current.world, this.roomMap, 'candle-table', true)}:${roomFlag(current.world, this.roomMap, 'stove')}:${roomFlag(current.world, this.roomMap, 'sink')}`;
      if (parent.dataset.lightState !== lightState) { parent.dataset.lightState = lightState; this.effectFrame = -1; }
      this.effects(time, current.world);
      for (const [id, actor] of this.actors) {
        const p = current.world.players[id];
        const visible = current.activeIds.includes(id) && p?.map === this.roomMap;
        // Events received while absent are history, never a fresh reaction on returning.
        if (!visible || !actor.container.visible) { actor.bedDisturbances = p?.bedDisturbances ?? 0; actor.reactionAt = -Infinity; }
        actor.container.setVisible(visible);
      }
      for (const id of current.activeIds) {
        const p = current.world.players[id]; if (!p || p.map !== this.roomMap) continue;
        const texture = this.residentTexture(p), objects = getRoomObjects(p.map, savedLayout);
        const bed = objects.find(o => o.id === 'bed');
        const target = { x: p.x, y: p.y - (p.seated ? p.seated.id === 'sofa' ? 2 : 10 : 0) };
        const sleepTurn = p.fatigue.sleeping ? bed?.rotation ?? 0 : 0;
        if (sleepTurn && bed) {
          // Project the resident's actual mattress coordinate continuously into
          // the side/rear pillow plane. No host/guest slot selects their side.
          const art = furnitureArt('bed', sleepTurn)!, t = (bedLocal(p, savedLayout).x - 153) / 54;
          const a = art.pillows[0], b = art.pillows[1], angle = sleepTurn * Math.PI / 2;
          target.x = bed.bounds.x + a.x + (b.x - a.x) * t - Math.sin(angle) * 66;
          target.y = bed.bounds.y + a.y + (b.y - a.y) * t + Math.cos(angle) * 66;
        }
        let actor = this.actors.get(id);
        if (!actor) {
          const shadow = this.add.ellipse(0, -1, 38, 10, 0x100e1b, .38);
          const sprite = this.add.image(0, 0, texture, 'down-idle').setOrigin(RESIDENT_ORIGIN.x, RESIDENT_ORIGIN.y).setDisplaySize(RESIDENT_DISPLAY_WIDTH, RESIDENT_DISPLAY_HEIGHT);
          const reaction = this.add.image(24, -108, 'resident-reaction').setScale(2).setVisible(false);
          const parts: Phaser.GameObjects.GameObject[] = [shadow, sprite, reaction];
          if (id !== current.localId) parts.push(this.add.text(0, -102, p.name, { fontSize: '9px', fontFamily: 'sans-serif', color: '#d7e5d7', stroke: '#211b24', strokeThickness: 3 }).setOrigin(.5));
          const container = this.add.container(target.x, target.y, parts);
          actor = { container, sprite, reaction, facing: p.facing, distance: 0, lastTravel: -Infinity, map: p.map, sleeping: p.fatigue.sleeping, seated: !!p.seated, seatBlend: p.seated ? 1 : 0, seatBlendFrom: p.seated ? 1 : 0, seatId: p.seated?.id, seatSlot: p.seated?.slot, settlingAt: -Infinity, settleFrom: target, bedDisturbances: p.bedDisturbances, reactionAt: -Infinity }; this.actors.set(id, actor);
        }
        actor.sprite.setTexture(texture); actor.facing = p.facing;
        for (const part of actor.container.list) if (part instanceof Phaser.GameObjects.Text) part.setVisible(!p.fatigue.sleeping);
        if (p.bedDisturbances > actor.bedDisturbances && p.fatigue.sleeping && actor.sleeping && actor.map === p.map) {
          actor.reactionAt = time; actor.settlingAt = time; actor.settleFrom = { x: actor.container.x, y: actor.container.y };
        }
        actor.bedDisturbances = p.bedDisturbances;
        if (!p.fatigue.sleeping && !p.seated || actor.map !== p.map) actor.reactionAt = -Infinity;
        if (p.seated && actor.seated && actor.map === p.map && actor.seatId === p.seated.id && actor.seatSlot !== p.seated.slot) {
          actor.reactionAt = time; actor.settlingAt = time; actor.settleFrom = { x: actor.container.x, y: actor.container.y };
          actor.seatBlendFrom = actor.seatBlend;
        }
        if (actor.map !== p.map || actor.sleeping !== p.fatigue.sleeping || actor.seated !== !!p.seated) {
          if (id === current.localId && p.fatigue.sleeping && !actor.sleeping) {
            for (const [name, key] of Object.entries(this.keys)) if (key.isDown) this.blockedKeys.add(name);
            this.input.keyboard!.resetKeys();
          }
          if (actor.map === p.map && !reducedMotion) {
            actor.settlingAt = time; actor.settleFrom = { x: actor.container.x, y: actor.container.y };
          } else { actor.container.setPosition(target.x, target.y); actor.settlingAt = -Infinity; }
          actor.seatBlendFrom = actor.seatBlend;
          actor.map = p.map; actor.sleeping = p.fatigue.sleeping; actor.seated = !!p.seated; actor.lastTravel = -Infinity;
        }
        if (p.seated) { actor.seatId = p.seated.id; actor.seatSlot = p.seated.slot; }
        const dx = target.x - actor.container.x, dy = target.y - actor.container.y, remaining = Math.hypot(dx, dy);
        const settling = Math.min(1, Math.max(0, (time - actor.settlingAt) / 420));
        const ease = settling * settling * (3 - 2 * settling);
        actor.seatBlend = actor.seatBlendFrom + ((p.seated ? 1 : 0) - actor.seatBlendFrom) * ease;
        if (settling < 1) actor.container.setPosition(actor.settleFrom.x + (target.x - actor.settleFrom.x) * ease, actor.settleFrom.y + (target.y - actor.settleFrom.y) * ease);
        else if (!p.fatigue.sleeping && !p.seated && remaining > .35) {
          const amount = Math.min(remaining, Math.max(0, delta) * .14);
          const next = moveInRoom(actor.container, dx / remaining, dy / remaining, amount, p.map, savedLayout);
          const travelled = Math.hypot(next.x - actor.container.x, next.y - actor.container.y);
          actor.distance += travelled; if (travelled > .01) actor.lastTravel = time;
          actor.container.setPosition(next.x, next.y);
        } else if (!p.fatigue.sleeping) actor.container.setPosition(target.x, target.y);
        const sleepProgress = p.fatigue.sleeping ? settling : 0;
        const settled = sleepProgress * sleepProgress * (3 - 2 * sleepProgress);
        if (p.fatigue.sleeping) actor.container.setPosition(actor.settleFrom.x + (target.x - actor.settleFrom.x) * settled, actor.settleFrom.y + (target.y - actor.settleFrom.y) * settled);
        const pose = residentFrame(actor.facing, actor.distance, !p.seated && !p.fatigue.sleeping && time - actor.lastTravel < 115 && !(id === current.localId && paused()));
        const reactionElapsed = time - actor.reactionAt, reacting = (p.fatigue.sleeping || !!p.seated) && reactionElapsed < 900;
        const toss = reacting && !reducedMotion ? [0, -2, -4, -2, 0, 2, 4, 2, 0, 0][Math.floor(reactionElapsed / 90)] : 0;
        actor.sprite.setFrame(reacting && p.fatigue.sleeping ? 'down-grumpy' : p.fatigue.sleeping ? (sleepProgress < .3 ? 'down-idle' : 'down-rest') : actor.seatBlend > .5 ? p.facing + '-sit' : pose.frame)
          .setFlipX(!p.fatigue.sleeping && !p.seated && pose.flipX).setPosition(toss, 0)
          .setOrigin(.5, (47 - 15 * actor.seatBlend) / 48).setAngle(sleepTurn * 90 * (reducedMotion ? 1 : settled));
        actor.reaction.setVisible(reacting).setPosition(24, -94)
          .setAlpha(reacting ? Math.min(1, (900 - reactionElapsed) / 250) : 0);
        // Keep the resident above the furniture throughout standing up.
        const seat = (p.seated || actor.seatBlend > 0) && objects.find(o => o.id === actor.seatId);
        actor.container.setDepth(p.fatigue.sleeping ? (bed?.depth ?? p.y) + .2 : seat ? seat.depth + .2 : actor.container.y);
        if (id === current.localId) {
          const camera = this.cameras.main;
          if (current.design) {
            camera.stopFollow(); camera.removeBounds(); camera.setZoom(Math.min((this.scale.width - 16) / 960, (this.scale.height - 48) / 500)); camera.centerOn(480, 268); this.followed = '';
          } else if (this.followed !== id) { camera.setZoom(1).setBounds(0, 38, ROOM_SIZE.width, 464); camera.startFollow(actor.container, true, .15, .15, 0, 90); this.followed = id; }
          if (!current.design && !hotbarHeld && hotbar) {
            const height = camera.height / camera.zoom;
            const edge = hotbarDock.update(p.map, actor.container.y, camera.scrollY + height, height);
            if (hotbar.dataset.dock !== edge) hotbar.dataset.dock = edge;
            telemetry('hotbarDock', edge);
          }
          telemetry('playerX', Number(p.x.toFixed(2))); telemetry('playerY', Number(p.y.toFixed(2)));
          telemetry('playerVisualX', actor.container.x); telemetry('playerVisualY', actor.container.y);
          telemetry('playerOriginY', actor.sprite.originY); telemetry('playerDepth', actor.container.depth);
          telemetry('playerFacing', actor.facing); telemetry('playerFrame', actor.sprite.frame.name); telemetry('playerFlipX', String(actor.sprite.flipX));
          telemetry('nearestObject', nearestInteractable(p, savedLayout, roomFlag(current.world, p.map, 'letter-filed') ? ['letter'] : [])?.id ?? '');
          telemetry('residentWidth', actor.sprite.displayWidth); telemetry('residentHeight', actor.sprite.displayHeight);
          telemetry('playerMap', p.map); telemetry('renderedMap', this.roomMap); telemetry('playerSleeping', String(p.fatigue.sleeping));
          telemetry('playerHeight', actor.sprite.displayHeight); telemetry('sleeping', String(p.fatigue.sleeping)); telemetry('playerSeated', p.seated?.id ?? '');
          telemetry('sleepPoseProgress', Number(sleepProgress.toFixed(2)));
          telemetry('bedReactionCount', p.bedDisturbances); telemetry('bedReactionActive', String(reacting)); telemetry('residentTexture', texture);
        }
      }
      telemetry('layout', JSON.stringify(savedLayout)); telemetry('previewLayout', JSON.stringify(this.layout));
      telemetry('arranging', current.design ? current.design.selected ?? 'room' : ''); telemetry('placementInvalid', String(current.design?.invalid ?? false));
      telemetry('placementX', current.design?.selected ? this.layout[current.design.selected]?.x ?? 0 : 0);
      telemetry('cameraZoom', this.cameras.main.zoom); telemetry('logicalWidth', this.scale.width); telemetry('logicalHeight', this.scale.height);
      const deskCandle = getRoomObjects(this.roomMap, this.layout).find(o => o.id === 'candle-desk');
      telemetry('candleDeskDepth', deskCandle ? deskCandle.depth + .1 : 0);
      telemetry('cameraX', Math.round(this.cameras.main.scrollX)); telemetry('cameraY', Math.round(this.cameras.main.scrollY));
      telemetry('renderScale', Number((parent.clientWidth / this.scale.width).toFixed(3)));
      telemetry('totalMinutes', current.world.clock.totalMinutes);
      telemetry('dayPhase', dayPhase(current.world.clock.totalMinutes)); telemetry('nightVariant', nightVariant(current.world));
      telemetry('daylight', Number(daylight(current.world.clock.totalMinutes).toFixed(3)));
      telemetry('visiblePlayers', [...this.actors].filter(([, actor]) => actor.container.visible).map(([id]) => id).sort().join(','));
      telemetry('bedReactions', JSON.stringify(Object.fromEntries([...this.actors].filter(([, actor]) => actor.container.visible).map(([id, actor]) => [id, { count: actor.bedDisturbances, active: actor.reaction.visible }]))));
      this.cooldown -= delta;
      if (!paused() && !current.design && !local.fatigue.sleeping && this.cooldown <= 0) {
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
  return () => { resize.disconnect(); hotbar?.removeEventListener('pointerdown', holdHotbar); window.removeEventListener('pointerup', releaseHotbar); window.removeEventListener('pointercancel', releaseHotbar); game.destroy(true); };
}
