import Phaser from 'phaser';
import type { World } from '../model';
import { RESIDENT_FRAMES, RESIDENT_ORIGIN } from '../art/resident-atlas';

type Facing = 'down' | 'left' | 'right' | 'up';
type Resident = { container: Phaser.GameObjects.Container; sprite: Phaser.GameObjects.Image; x: number; y: number; facing: Facing; walkingUntil: number };

export async function mountArrival(parent: HTMLElement, state: () => { world: World; localId: string; activeIds: string[] }, direction: (dx: number, dy: number) => void, interact: () => void, paused: () => boolean) {
  const reducedMotion = document.documentElement.classList.contains('reduced-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  class ArrivalScene extends Phaser.Scene {
    private actors = new Map<string, Resident>();
    private fire!: Phaser.GameObjects.Graphics;
    private motes!: Phaser.GameObjects.Graphics;
    private keys!: Record<string, Phaser.Input.Keyboard.Key>;
    private cooldown = 0;
    preload() {
      this.load.image('arrival-hall', './art/arrival-hall.png');
      this.load.image('residents', './art/residents.png');
    }
    create() {
      this.add.image(480, 270, 'arrival-hall').setDisplaySize(960, 540).setDepth(-1000);
      const texture = this.textures.get('residents');
      for (const frame of RESIDENT_FRAMES) texture.add(frame.name, 0, frame.x, frame.y, frame.width, frame.height);
      this.fire = this.add.graphics().setDepth(255);
      this.motes = this.add.graphics().setDepth(900);
      this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E') as Record<string, Phaser.Input.Keyboard.Key>;
      this.input.keyboard!.on('keydown-E', () => { if (!paused()) interact(); });
    }
    update(time: number, delta: number) {
      const current = state();
      this.fire.clear();
      if (current.world.story.flags.hearth) {
        // Fire stays inside the original dark firebox; its light reaches onto the floor.
        const clock = reducedMotion ? 0 : time;
        for (let radius = 95; radius > 20; radius -= 12) {
          this.fire.fillStyle(0xffa64e, 0.012); this.fire.fillEllipse(551, 259, radius * 2, radius);
        }
        for (let flame = 0; flame < 7; flame++) {
          const x = 521 + flame * 10, y = 239;
          const height = 17 + Math.sin(flame * 1.8 + clock / 210) * 4 + Math.sin(flame * .9) * 8;
          const sway = Math.round(Math.sin(clock / 240 + flame) * 3);
          this.fire.fillStyle(0xd5702d);
          this.fire.fillPoints([{ x: x - 7, y }, { x: x - 6, y: y - height * .35 }, { x: x - 2, y: y - height * .65 }, { x: x + sway, y: y - height }, { x: x + 4, y: y - height * .55 }, { x: x + 7, y: y - height * .2 }, { x: x + 5, y }], true);
          this.fire.fillStyle(0xffca66);
          this.fire.fillPoints([{ x: x - 4, y }, { x: x - 2, y: y - height * .3 }, { x: x + sway, y: y - height * .6 }, { x: x + 3, y: y - height * .2 }, { x: x + 4, y }], true);
        }
        this.fire.lineStyle(3, 0x423130); this.fire.lineBetween(516, 240, 582, 243); this.fire.lineBetween(534, 243, 586, 238);
        if (!reducedMotion) for (let i = 0; i < 6; i++) {
          const rise = (time / 35 + i * 11) % 43;
          this.fire.fillStyle(0xffce79, 1 - rise / 43); this.fire.fillRect(527 + i * 8 + Math.sin(time / 500 + i) * 3, 228 - rise, 1, 2);
        }
      }
      this.motes.clear();
      if (!reducedMotion) for (let i = 0; i < 16; i++) {
        const x = 240 + (i * 77) % 540 + Math.sin(time / 3500 + i) * 9;
        const y = 165 + (i * 53 + time / 150) % 295;
        this.motes.fillStyle(i % 3 ? 0xe7cba0 : 0xabc9ef, .12 + Math.sin(time / 900 + i) * .08);
        this.motes.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
      for (const [id, actor] of this.actors) actor.container.setVisible(current.activeIds.includes(id));
      for (const id of current.activeIds) {
        const p = current.world.players[id]; if (!p) continue;
        let actor = this.actors.get(id);
        if (!actor) {
          const shadow = this.add.ellipse(0, -1, 25, 8, 0x0b0b15, .32);
          const sprite = this.add.image(0, 0, 'residents', 'down-idle').setOrigin(RESIDENT_ORIGIN.x, RESIDENT_ORIGIN.y).setScale(.19);
          if (p.appearance === 'moss') sprite.setTint(0xb6d8bb);
          if (p.appearance === 'violet') sprite.setTint(0xd0b6ed);
          const name = this.add.text(0, -68, p.name, { fontSize: '11px', fontFamily: 'Georgia', color: id === current.localId ? '#f5dba3' : '#b7ded3', stroke: '#211b24', strokeThickness: 3 }).setOrigin(.5);
          const container = this.add.container(p.x, p.y, [shadow, sprite, name]);
          actor = { container, sprite, x: p.x, y: p.y, facing: 'down', walkingUntil: 0 }; this.actors.set(id, actor);
        }
        const dx = p.x - actor.x, dy = p.y - actor.y;
        if (Math.abs(dx) + Math.abs(dy) > .1) {
          actor.facing = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
          actor.walkingUntil = time + 140; actor.x = p.x; actor.y = p.y;
        }
        const pose = time < actor.walkingUntil ? (Math.floor(time / 140) % 2 ? 'step-right' : 'step-left') : 'idle';
        actor.sprite.setFrame(`${actor.facing}-${pose}`);
        actor.container.setPosition(Phaser.Math.Linear(actor.container.x, p.x, Math.min(1, delta / 65)), Phaser.Math.Linear(actor.container.y, p.y, Math.min(1, delta / 65))).setDepth(p.y);
      }
      this.cooldown -= delta;
      if (!paused() && this.cooldown <= 0) {
        const dx = Number(this.keys.D.isDown || this.keys.RIGHT.isDown) - Number(this.keys.A.isDown || this.keys.LEFT.isDown);
        const dy = Number(this.keys.S.isDown || this.keys.DOWN.isDown) - Number(this.keys.W.isDown || this.keys.UP.isDown);
        if (dx || dy) { direction(dx, dy); this.cooldown = 110; }
      }
    }
  }
  const canvasDiagnostic = new URLSearchParams(location.search).get('renderer') === 'canvas';
  const game = new Phaser.Game({ type: canvasDiagnostic ? Phaser.CANVAS : Phaser.AUTO, parent, width: 960, height: 540, backgroundColor: '#101018',
    pixelArt: true, roundPixels: true, render: { antialias: false }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: ArrivalScene, audio: { noAudio: true } });
  return () => game.destroy(true);
}
