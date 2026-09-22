import type Phaser from 'phaser';
export type DoorWall = 'north' | 'west' | 'south' | 'east';
export function doorArt(wall: DoorWall) {
  return { texture: `door-v7-${wall}`, width: wall === 'north' || wall === 'south' ? 86 : 32,
    height: wall === 'north' ? 136 : wall === 'south' ? 36 : 120, closed: 'closed', open: 'open', openFrames: ['open-0', 'open-1', 'open-2', 'open-3'] };
}
export function drawDoor(context: CanvasRenderingContext2D, wall: DoorWall, amount: number) {
  const r = (x: number, y: number, w: number, h: number, color: string) => { context.fillStyle = color; context.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  if (wall === 'north') {
    r(0, 0, 43, 68, '#271f29'); r(1, 1, 41, 67, '#715038'); r(4, 4, 35, 61, '#171923');
    r(1, 1, 41, 2, '#aa8458'); r(2, 4, 2, 61, '#8c6847'); r(39, 4, 2, 61, '#49362e');
    const width = Math.round(31 - amount * 24);
    r(6, 6, width, 58, '#674631'); r(6, 6, width, 2, '#a27b4e'); r(6, 8, 1, 55, '#906a43');
    for (const y of [11, 36]) { r(8, y, Math.max(2, width - 5), 21, '#382a2c'); r(9, y + 1, Math.max(1, width - 7), 18, '#755038'); }
    r(6 + width - 4, 32, 2, 2, '#d0af6c'); r(3, 65, 37, 2, '#a4865c');
  } else if (wall === 'south') {
    r(0, 11, 43, 7, '#29212b'); r(5, 5, 33, 8, '#655044'); r(5, 13, 33, 5, '#181924');
    for (let x = 6; x < 38; x += 8) r(x, 6, 1, 6, '#877058');
    r(5, 11, 33, 2, '#baa17a');
    for (const x of [0, 37]) { r(x, 0, 6, 18, '#30232b'); r(x + 1, 1, 4, 15, '#73533b'); r(x + 1, 1, 4, 2, '#b79160'); }
    const width = Math.round(31 - amount * 26);
    r(6, 8 - amount * 5, width, 6 + amount * 5, '#684a35'); r(6, 8 - amount * 5, width, 2, '#a78252'); r(6 + width - 3, 9 - amount * 5, 2, 1, '#ccb070');
  } else {
    const east = wall === 'east';
    const rect = (x: number, y: number, w: number, h: number, color: string) => r(east ? 16 - x - w : x, y, w, h, color);
    rect(0, 0, 8, 60, '#28212b');
    for (let x = 1; x < 16; x++) {
      const inset = Math.floor(x / 3);
      rect(x, inset, 1, 60 - inset * 2, x < 4 ? '#6b4a35' : '#3a2d30');
      rect(x, inset + 1, 1, 2, east ? '#8b6c49' : '#aa8458'); rect(x, 57 - inset, 1, 2, '#a88960');
    }
    rect(4, 7, 9, 46, '#171923'); rect(2, 3, 2, 54, east ? '#634733' : '#96714b'); rect(13, 6, 2, 48, east ? '#92724e' : '#49362f');
    const width = Math.round(8 - amount * 5);
    rect(4, 8, width, 44, '#684932'); rect(4, 8, 1, 43, east ? '#634632' : '#a07b50');
    for (const y of [12, 33]) { rect(6, y, Math.max(1, width - 3), 16, '#382b2d'); if (width > 4) rect(7, y + 1, width - 4, 14, '#7d583b'); }
    rect(4 + width - 2, 29, 1, 2, '#d0af6c');
  }
}
export function buildDoorTextures(scene: Phaser.Scene) {
  for (const wall of ['north', 'west', 'south', 'east'] as DoorWall[]) {
    const art = doorArt(wall), width = art.width / 2, height = art.height / 2;
    const texture = scene.textures.createCanvas(art.texture, width * 4, height)!;
    for (let i = 0; i < 4; i++) {
      texture.context.save(); texture.context.translate(i * width, 0); drawDoor(texture.context, wall, i / 3); texture.context.restore();
      texture.add(`open-${i}`, 0, i * width, 0, width, height);
    }
    texture.add('closed', 0, 0, 0, width, height); texture.add('open', 0, width * 3, 0, width, height); texture.refresh();
  }
}
export function drawRoomFinish(context: CanvasRenderingContext2D, name: 'hall-floor' | 'hall-wall' | 'kitchen-floor' | 'kitchen-wall', ox: number, oy = 0) {
  const r = (x: number, y: number, w: number, h: number, color: string) => { context.fillStyle = color; context.fillRect(ox + x, oy + y, w, h); };
  if (name === 'hall-floor') {
    r(0, 0, 64, 64, '#4c4650');
    for (let y = 0; y < 64; y += 16) for (let x = -16; x < 64; x += 32) {
      const px = x + (y % 32 ? 16 : 0); r(px + 1, y + 1, 30, 14, y % 32 ? '#726762' : '#85776b');
      r(px + 2, y + 1, 28, 1, '#a1937c'); r(px + 3, y + 4, 2, 1, '#948671'); r(px + 20, y + 11, 3, 1, '#645d58');
    }
  } else if (name === 'kitchen-floor') {
    r(0, 0, 64, 64, '#3c4748');
    for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 16) { r(x + 1, y + 1, 14, 14, (x + y) % 32 ? '#73847c' : '#a1aa93'); r(x + 2, y + 1, 12, 1, '#b5baa2'); r(x + 7, y + 7, 2, 2, '#586b66'); }
  } else {
    const kitchen = name === 'kitchen-wall'; r(0, 0, 64, 90, kitchen ? '#91a193' : '#596873');
    if (kitchen) for (let y = 18; y < 70; y += 10) for (let x = 0; x < 64; x += 16) { r(x, y, 15, 9, '#c6c8af'); r(x + 1, y + 1, 13, 1, '#e0dbc0'); }
    else for (let y = 8; y < 58; y += 18) for (let x = 8; x < 64; x += 24) { r(x, y, 1, 5, '#77868a'); r(x - 2, y + 2, 5, 1, '#77868a'); }
    r(0, 69, 64, 21, kitchen ? '#486155' : '#514137'); r(0, 68, 64, 2, '#b09365'); r(0, 88, 64, 2, '#2f2a30');
    for (let x = 0; x < 64; x += 16) { r(x, 72, 2, 16, kitchen ? '#708775' : '#896646'); r(x + 4, 73, 9, 1, kitchen ? '#819480' : '#9d7d52'); }
  }
}
