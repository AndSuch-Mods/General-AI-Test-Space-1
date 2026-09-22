import type Phaser from 'phaser';

export type ArtTurn = 0 | 1 | 2 | 3;
type Spec = { width: number; depth: number; elevation: number };
export const FURNITURE_ART_SPECS: Record<string, Spec> = {
  bed: { width: 140, depth: 96, elevation: 34 }, desk: { width: 105, depth: 32, elevation: 33 },
  bookshelf: { width: 100, depth: 22, elevation: 82 }, pantry: { width: 94, depth: 36, elevation: 100 },
  chest: { width: 88, depth: 26, elevation: 26 }, 'side-table': { width: 60, depth: 24, elevation: 24 },
  sofa: { width: 146, depth: 44, elevation: 44 }, armchair: { width: 66, depth: 34, elevation: 36 },
  carpet: { width: 226, depth: 132, elevation: 0 }, stove: { width: 96, depth: 38, elevation: 50 },
  sink: { width: 112, depth: 38, elevation: 44 }, worktop: { width: 140, depth: 38, elevation: 38 },
};
export const SEAT_RISE = 24;
type Point = { x: number; y: number };
function groundPoint(spec: Spec, turn: ArtTurn, x: number, y: number): Point {
  return turn === 0 ? { x, y } : turn === 1 ? { x: spec.depth - y, y: x }
    : turn === 2 ? { x: spec.width - x, y: spec.depth - y } : { x: y, y: spec.width - x };
}
/** Anchors are world pixels relative to the object bounds, before any scene placement. */
export function furnitureArt(id: string, turn: ArtTurn = 0) {
  const spec = FURNITURE_ART_SPECS[id]; if (!spec) return undefined;
  const width = turn % 2 ? spec.depth : spec.width, height = (turn % 2 ? spec.width : spec.depth) + spec.elevation;
  const anchor = (x: number, y: number, rise: number) => { const p = groundPoint(spec, turn, x, y); return { x: p.x, y: p.y + spec.elevation - rise }; };
  return {
    texture: `furniture-${id}-${turn}`, width, height, nativeWidth: Math.ceil(width / 2), nativeHeight: Math.ceil(height / 2),
    full: 'open-0', base: 'base', foreground: 'foreground', openFrames: ['open-0', 'open-1', 'open-2', 'open-3'],
    seatRise: SEAT_RISE,
    seats: id === 'sofa' ? [-32, 32].map(offset => anchor(spec.width / 2 + offset, spec.depth / 2, SEAT_RISE))
      : id === 'armchair' ? [anchor(spec.width / 2, spec.depth / 2, SEAT_RISE)] : [],
    pillows: id === 'bed' ? [-27, 27].map(offset => anchor(spec.width / 2 + offset, 17, 14)) : [],
  };
}
type Material = 'wood' | 'cloth' | 'linen' | 'stone' | 'iron' | 'green' | 'dark';
const colors: Record<Material, [string, string, string, string]> = {
  wood: ['#a47a4e', '#745039', '#49312f', '#2b2029'], cloth: ['#9a6673', '#784759', '#4c3043', '#302332'],
  linen: ['#e0d4ae', '#b7af96', '#827c75', '#4b4149'], stone: ['#b6bab0', '#8c9593', '#606e74', '#35464f'],
  iron: ['#818890', '#4d5c68', '#303e4c', '#202a36'], green: ['#849987', '#5f7869', '#3d554d', '#293d39'],
  dark: ['#49434d', '#342d3b', '#24212e', '#17151f'],
};
type Box = { x: number; y: number; width: number; depth: number; z: number; height: number; material: Material; front?: boolean; detail?: 'panel' | 'books' | 'jars' | 'oven' | 'drawer' | 'basin' | 'burners'; order: number };

/** Authored ground plans are projected upward for each view. Bitmap transforms are never used. */
export function drawFurniture(context: CanvasRenderingContext2D, id: string, turn: ArtTurn, part: 'full' | 'base' | 'foreground', opening = 0) {
  const spec = FURNITURE_ART_SPECS[id];
  const art = furnitureArt(id, turn)!;
  const boxes: Box[] = [];
  const add = (x: number, y: number, width: number, depth: number, z: number, height: number, material: Material, front = false, detail?: Box['detail']) => {
    if (part === 'base' && front || part === 'foreground' && !front) return;
    const corners = [groundPoint(spec, turn, x, y), groundPoint(spec, turn, x + width, y + depth)];
    const bx = Math.min(...corners.map(p => p.x)), by = Math.min(...corners.map(p => p.y));
    boxes.push({ x: bx / 2, y: (by + spec.elevation) / 2, width: Math.abs(corners[1].x - corners[0].x) / 2,
      depth: Math.abs(corners[1].y - corners[0].y) / 2, z: z / 2, height: height / 2, material, front, detail,
      order: boxes.length });
  };
  const W = spec.width, D = spec.depth, E = spec.elevation;
  const legs = (height: number) => { for (const x of [4, W - 10]) for (const y of [3, D - 8]) add(x, y, 6, 5, 0, height, 'wood'); };
  if (id === 'carpet') {
    if (part === 'foreground') return;
    const r = (x: number, y: number, w: number, h: number, color: string) => { context.fillStyle = color; context.fillRect(x, y, w, h); };
    const w = art.nativeWidth, h = art.nativeHeight;
    r(1, 1, w - 2, h - 2, '#362638'); r(3, 3, w - 6, h - 6, '#79454e'); r(6, 6, w - 12, h - 12, '#b08a64'); r(7, 7, w - 14, h - 14, '#5b3444');
    for (let x = 10; x < w - 8; x += 6) { r(x, 4, 2, 1, '#c39b70'); r(x, h - 5, 2, 1, '#c39b70'); }
    for (let y = 10; y < h - 8; y += 6) { r(4, y, 1, 2, '#c39b70'); r(w - 5, y, 1, 2, '#c39b70'); }
    const centers = turn % 2 ? [h * .25, h * .5, h * .75].map(y => ({ x: w / 2, y })) : [w * .25, w * .5, w * .75].map(x => ({ x, y: h / 2 }));
    for (const center of centers) for (let row = -11; row <= 11; row++) {
      const d = 11 - Math.abs(row); r(Math.round(center.x - d), Math.round(center.y + row), 1, 1, '#aa7a71'); r(Math.round(center.x + d), Math.round(center.y + row), 1, 1, '#aa7a71');
      if (Math.abs(row) < 5) { r(Math.round(center.x - 4 + Math.abs(row)), Math.round(center.y + row), 1, 1, '#c29c72'); r(Math.round(center.x + 4 - Math.abs(row)), Math.round(center.y + row), 1, 1, '#c29c72'); }
    }
    return;
  }
  if (id === 'sofa' || id === 'armchair') {
    legs(11); add(3, 3, W - 6, D - 6, 8, 8, 'wood');
    add(5, 2, W - 10, 7, 10, E - 10, 'wood', turn === 2, 'panel');
    add(10, 8, W - 20, 5, 21, E - 24, 'cloth', turn === 2);
    const slots = id === 'sofa' ? 2 : 1, inner = (W - 24) / slots;
    for (let i = 0; i < slots; i++) add(12 + i * inner, 13, inner - 2, D - 19, 16, 8, 'cloth');
    for (const x of [2, W - 11]) {
      const near = turn === 0 || turn === 2 || turn === 1 && x > W / 2 || turn === 3 && x < W / 2;
      add(x, 4, 9, D - 8, 11, 20, 'wood', near); add(x + 1, 5, 7, D - 10, 31, 3, 'cloth', near);
    }
    add(10, D - 7, W - 20, 5, 8, 7, 'cloth', true);
  } else if (id === 'bed') {
    legs(12); add(4, 3, W - 8, D - 6, 7, 5, 'wood');
    // The near headboard is cut away so a north-facing sleeper's face remains visible.
    add(2, 1, W - 4, 6, 0, turn === 2 ? 12 : E, 'wood', turn === 2, 'panel');
    add(5, 7, W - 10, D - 14, 10, 4, 'linen');
    for (const x of [19, W - 59]) add(x, 10, 40, 20, 14, 3, 'linen');
    add(8, 34, W - 16, D - 43, 14, 3, 'cloth', true);
    add(8, 30, W - 16, 6, 14, 4, 'linen', true);
    add(3, D - 7, W - 6, 5, 0, 17, 'wood', turn !== 2, 'panel');
  } else if (id === 'desk' || id === 'side-table' || id === 'worktop') {
    legs(E - 5);
    if (id !== 'side-table') {
      for (const x of [5, W - 29]) {
        add(x, 3, 24, D - 6, 5, E - 13, id === 'worktop' ? 'green' : 'wood', false, turn === 0 ? 'drawer' : undefined);
        if (opening) add(x + 2, D - 9, 20, 6, E - 20 - opening * 4, 11, 'wood', false, 'drawer');
      }
    }
    add(1, 0, W - 2, D, E - 5, 5, id === 'worktop' ? 'stone' : 'wood');
  } else if (id === 'bookshelf' || id === 'pantry') {
    add(2, 1, W - 4, D - 2, 0, 8, 'wood'); add(3, 1, W - 6, 5, 5, E - 7, 'wood', turn === 2, 'panel');
    add(2, 1, 6, D - 2, 7, E - 9, 'wood', turn === 3); add(W - 8, 1, 6, D - 2, 7, E - 9, 'wood', turn === 1);
    add(0, 0, W, D, E - 5, 5, 'wood', true);
    for (let level = 12; level < E - 8; level += 23) {
      add(8, 3, W - 16, D - 5, level, 3, 'wood');
      add(10, 5, W - 20, D - 9, level + 3, 17, 'dark', false, id === 'pantry' ? 'jars' : 'books');
    }
    if (id === 'pantry') {
      const doorWidth = (W - 18) / 2, folded = doorWidth * (1 - opening * .85);
      for (const [x, side] of [[8, 0], [W - 8 - folded, 1]]) add(x, D - 5, folded, 4, 8, 45, 'wood', false, side ? 'panel' : 'drawer');
    }
  } else if (id === 'chest') {
    add(3, 2, W - 6, D - 4, 0, 19, 'wood', false, 'panel'); add(7, 5, W - 14, D - 10, 17, 2, 'dark');
    add(1, 1, W - 2, Math.max(5, (D - 2) * (1 - opening * .77)), 19, 7, 'wood');
  } else if (id === 'stove' || id === 'sink') {
    add(2, 2, W - 4, D - 4, 0, E - 5, id === 'stove' ? 'iron' : 'green', false, id === 'stove' ? 'oven' : 'panel');
    add(0, 0, W, D, E - 5, 5, id === 'stove' ? 'iron' : 'stone', false, id === 'stove' ? 'burners' : 'basin');
    if (id === 'sink') { add(W * .62, D / 2 - 4, 5, 4, E, 10, 'iron'); add(W * .62 - 8, D / 2 - 4, 12, 4, E + 8, 2, 'stone'); }
  }
  // Authored stacking keeps top cushions above their broad bases; front rails render last.
  boxes.sort((a, b) => Number(a.front) - Number(b.front) || a.order - b.order);
  const rect = (x: number, y: number, w: number, h: number, color: string) => { context.fillStyle = color; context.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
  for (const box of boxes) {
    const [light, mid, shade, outline] = colors[box.material], x = Math.round(box.x), y = Math.round(box.y - box.z - box.height), w = Math.max(1, Math.round(box.width)), d = Math.max(1, Math.round(box.depth)), h = Math.max(1, Math.round(box.height));
    rect(x, y, w, d + h, outline); rect(x + 1, y + 1, w - 2, d - 1, mid); rect(x + 1, y + d, w - 2, h - 1, shade);
    rect(x + 1, y, w - 2, 1, light); rect(x, y + 1, 1, d + h - 2, mid);
    if (box.material === 'wood') {
      for (let line = 4; line < w - 2; line += 7) { rect(x + line, y + 2, 1, Math.max(1, d - 4), shade); if (d > 5) rect(x + line + 1, y + 4, 2, 1, light); }
    } else if (box.material === 'cloth') {
      rect(x + 2, y + 1, w - 4, 1, light);
      for (let py = 3; py < d - 1; py += 4) for (let px = 3 + py % 8; px < w - 2; px += 8) { rect(x + px, y + py, 1, 1, light); rect(x + px + 1, y + py + 1, 1, 1, shade); }
    } else if (box.material === 'linen') {
      rect(x + 2, y + 1, w - 4, 1, light); rect(x + 1, y + 2, 1, Math.max(1, d - 4), light);
    } else if (box.material === 'stone') {
      for (let px = 9; px < w - 4; px += 13) { rect(x + px, y + 3, 2, 1, light); rect(x + px - 2, y + d - 4, 1, 1, shade); }
    }
    if (box.detail === 'panel' && h > 8 && w > 6) { rect(x + 3, y + d + 2, w - 6, h - 5, mid); rect(x + 4, y + d + 3, w - 8, 1, light); }
    if (box.detail === 'drawer' && h > 3) { rect(x + 2, y + d + 1, w - 4, 1, mid); rect(x + w / 2 - 1, y + d + Math.min(4, h - 2), 2, 1, '#c5a365'); }
    if (box.detail === 'books' && (turn === 0 || turn === 1 || turn === 3)) for (let px = 1; px < w - 1; px += 3) {
      const palette = ['#78664f', '#657e73', '#88525b', '#929083']; const height = Math.max(2, h - 1 - px % 3);
      rect(x + px, y + d + h - height - 1, 2, height, palette[Math.floor(px / 3) % 4]); rect(x + px, y + d + h - 3, 2, 1, '#c1aa78');
    }
    if (box.detail === 'jars' && turn !== 2) for (let px = 2; px < w - 4; px += 7) {
      rect(x + px, y + d + 2, 5, Math.max(3, h - 4), px % 2 ? '#75877b' : '#9b8360');
      rect(x + px + 1, y + d + 1, 3, 1, '#b6a681'); rect(x + px + 1, y + d + 4, 3, 2, '#d0bc90');
    }
    if (box.detail === 'oven' && turn === 0) { rect(x + 6, y + d + 7, w - 12, h - 11, '#192936'); rect(x + 8, y + d + 9, w - 16, 2, '#687880'); for (let px = 6; px < w - 4; px += 8) rect(x + px, y + d + 3, 2, 2, '#c4b48d'); }
    if (box.detail === 'burners') for (const px of [.28, .72]) for (const py of [.3, .72]) { rect(x + w * px - 4, y + d * py - 2, 8, 4, '#202a36'); rect(x + w * px - 3, y + d * py - 1, 6, 2, '#697985'); }
    if (box.detail === 'basin') { rect(x + w * .16, y + d * .22, w * .6, d * .6, '#526e78'); rect(x + w * .2, y + d * .28, w * .5, d * .46, '#283f4a'); rect(x + w * .25, y + d * .35, w * .38, 1, '#91abb0'); }
  }
  if (id === 'chest' && turn === 0 && part !== 'foreground') {
    rect(art.nativeWidth / 2 - 2, art.nativeHeight - 10, 4, 6, '#35292a');
    rect(art.nativeWidth / 2 - 1, art.nativeHeight - 10, 2, 4, '#b69759');
  }
}

export function buildFurnitureTextures(scene: Phaser.Scene) {
  for (const id of Object.keys(FURNITURE_ART_SPECS)) for (const turn of [0, 1, 2, 3] as ArtTurn[]) {
    const art = furnitureArt(id, turn)!;
    const texture = scene.textures.createCanvas(art.texture, art.nativeWidth * 6, art.nativeHeight)!;
    texture.context.imageSmoothingEnabled = false;
    for (const [index, name] of ['base', 'foreground', ...art.openFrames].entries()) {
      texture.context.save(); texture.context.translate(index * art.nativeWidth, 0);
      // Translation only places atlas cells; orientation is authored through ground/elevation geometry.
      texture.context.beginPath(); texture.context.rect(0, 0, art.nativeWidth, art.nativeHeight); texture.context.clip();
      drawFurniture(texture.context, id, turn, index < 2 ? name as 'base' | 'foreground' : 'full', Math.max(0, index - 2) / 3);
      texture.context.restore(); texture.add(name, 0, index * art.nativeWidth, 0, art.nativeWidth, art.nativeHeight);
    }
    texture.refresh();
  }
}
