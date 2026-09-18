import Phaser from 'phaser';
import type { World } from '../model';
import { arrival } from '../../content/arrival';

export async function mountArrival(parent: HTMLElement, state: () => { world: World; localId: string; activeIds: string[] }, direction: (dx: number, dy: number) => void, interact: () => void, paused: () => boolean) {
  class ArrivalScene extends Phaser.Scene {
    private actors = new Map<string, Phaser.GameObjects.Container>();
    private fire!: Phaser.GameObjects.Graphics;
    private keys!: Record<string, Phaser.Input.Keyboard.Key>;
    private cooldown = 0;
    create() {
      const g = this.add.graphics();
      const rect = (x: number, y: number, w: number, h: number, color: number) => { g.fillStyle(color); g.fillRect(x, y, w, h); };
      rect(0, 0, 960, 540, 0x101b25);
      rect(30, 85, 900, 430, 0x0b1219);
      rect(48, 120, 864, 364, 0x392c37);
      for (let row = 0; row < 11; row++) for (let col = 0; col < 14; col++) {
        rect(48 + col * 64, 160 + row * 32, 62, 30, [0x514049, 0x4b3a43, 0x493941][(row * 7 + col * 3) % 3]);
        rect(53 + col * 64, 175 + row * 32, 38, 1, 0x604b51);
      }
      rect(48, 64, 864, 127, 0x30383e);
      for (let row = 0; row < 4; row++) for (let col = 0; col < 18; col++) rect(48 + col * 48 + (row % 2) * 24, 64 + row * 27, 45, 24, (col + row) % 3 ? 0x38414a : 0x3d454d);
      rect(48, 172, 864, 10, 0x88765d); rect(48, 182, 864, 12, 0x202c36);
      // Tall windows overlook the quiet hill, wholly original temporary geometry.
      for (const x of [175, 690]) {
        rect(x - 8, 51, 91, 119, 0x18222d); rect(x, 59, 75, 96, 0x455a78);
        rect(x + 4, 66, 67, 86, 0x263b5b); rect(x + 49, 73, 13, 13, 0xc4cbaf);
        rect(x + 35, 60, 5, 100, 0x192535); rect(x, 104, 75, 5, 0x192535);
        rect(x - 14, 154, 105, 12, 0x8f7d67);
        rect(x - 25, 45, 17, 115, 0x573343); rect(x + 82, 45, 17, 115, 0x573343);
      }
      // Pantry, table, shelves, and hearth are replaced by atlas art in Phase 11.
      rect(736, 192, 140, 56, 0x302a31); rect(746, 190, 120, 50, 0x745244);
      for (let n = 0; n < 5; n++) { rect(755 + n * 21, 201, 14, 29, n % 2 ? 0x8a7957 : 0x425d62); rect(757 + n * 21, 197, 10, 5, 0xba9c62); }
      rect(764, 290, 63, 28, 0x251f2c); rect(764, 282, 63, 24, 0x916940); rect(789, 282, 11, 26, 0xc3a166);
      rect(282, 246, 104, 25, 0x211f2b); rect(279, 231, 110, 24, 0x946b4e);
      rect(290, 255, 10, 27, 0x593e36); rect(367, 255, 10, 27, 0x593e36);
      rect(315, 226, 33, 20, 0xd5c5a0); rect(327, 230, 9, 9, 0x91483f);
      rect(513, 101, 155, 148, 0x29262e); rect(525, 112, 131, 130, 0x747279);
      rect(542, 142, 95, 96, 0x18212b); rect(513, 128, 155, 13, 0xa39989);
      rect(507, 240, 167, 15, 0x66616a);
      rect(417, 319, 168, 117, 0x29313b); rect(423, 325, 156, 105, 0x804851); rect(433, 335, 136, 85, 0x653d4b);
      for (const x of [435, 557]) for (let y = 341; y < 421; y += 14) rect(x, y, 7, 7, 0xb49167);
      rect(65, 223, 102, 76, 0x332938); rect(68, 218, 96, 60, 0x5f5361); rect(70, 234, 92, 37, 0x824f5e);
      rect(77, 222, 29, 20, 0xbcb9aa); rect(128, 220, 9, 61, 0xb49d80);
      for (const x of [405, 889]) {
        rect(x, 190, 6, 34, 0x9f8257); rect(x - 8, 181, 22, 15, 0xdab276);
        g.fillStyle(0xefbf72, 0.07); g.fillCircle(x + 3, 195, 45);
      }
      this.fire = this.add.graphics();
      this.add.text(480, 35, 'THE CASTLE  /  ARRIVAL HALL', { fontFamily: 'Georgia', fontSize: '17px', color: '#c6bdac', letterSpacing: 3 }).setOrigin(0.5);
      for (const event of arrival) {
        this.add.circle(event.x, event.y + 10, 4, 0xe9c583, 0.8);
      }
      this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E') as Record<string, Phaser.Input.Keyboard.Key>;
      this.input.keyboard!.on('keydown-E', () => { if (!paused()) interact(); });
    }
    update(_time: number, delta: number) {
      const current = state();
      this.fire.clear();
      if (current.world.story.flags.hearth) {
        this.fire.fillStyle(0xe1a65e, 0.09); this.fire.fillCircle(591, 242, 110);
        this.fire.fillStyle(0xbc6443); this.fire.fillRect(560, 197, 63, 36);
        this.fire.fillStyle(0xeeba72); this.fire.fillRect(572, 182 + Math.floor(Math.sin(_time / 260) * 3), 13, 49); this.fire.fillRect(599, 190, 14, 41);
      }
      for (const [id, actor] of this.actors) actor.setVisible(current.activeIds.includes(id));
      for (const id of current.activeIds) {
        const p = current.world.players[id];
        if (!p) continue;
        let actor = this.actors.get(id);
        if (!actor) {
          const body = this.add.graphics();
          body.fillStyle(0x0a1220, 0.35); body.fillEllipse(0, 5, 32, 12);
          body.fillStyle(0x202331); body.fillRect(-9, -7, 7, 15); body.fillRect(3, -7, 7, 15);
          body.fillStyle({ amber: 0xc78b55, moss: 0x679a83, violet: 0x9a80b7 }[p.appearance]); body.fillRect(-13, -28, 26, 23);
          body.fillStyle(0xd8b196); body.fillRect(-9, -43, 18, 17);
          body.fillStyle(0x342633); body.fillRect(-10, -46, 21, 8); body.fillRect(-10, -41, 5, 8);
          body.fillStyle(0xf0d99a); body.fillRect(-12, -27, 24, 4);
          const name = this.add.text(0, -62, p.name, { fontSize: '13px', fontFamily: 'system-ui', color: id === current.localId ? '#ffdea2' : '#a6d7d0', backgroundColor: '#14212c' }).setOrigin(0.5);
          actor = this.add.container(p.x, p.y, [body, name]); this.actors.set(id, actor);
        }
        actor.setPosition(Phaser.Math.Linear(actor.x, p.x, Math.min(1, delta / 65)), Phaser.Math.Linear(actor.y, p.y, Math.min(1, delta / 65))).setDepth(p.y);
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
  const game = new Phaser.Game({ type: canvasDiagnostic ? Phaser.CANVAS : Phaser.AUTO, parent, width: 960, height: 540, backgroundColor: '#101b25',
    pixelArt: true, roundPixels: true, render: { antialias: false }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: ArrivalScene, audio: { noAudio: true } });
  return () => game.destroy(true);
}
