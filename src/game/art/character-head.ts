import type { CharacterLook } from './character-look';
import { CharacterPixelArt, type Point } from './character-pixel-art';

export type CharacterExpression = 'neutral' | 'sleeping' | 'grumpy';
export type SourceFacing = 'down' | 'right' | 'up';

/** Rear hair attaches at the crown and nape. The renderer places this behind a front-facing body. */
export function drawBackHair(art: CharacterPixelArt, look: CharacterLook, facing: SourceFacing) {
  const style = look.hairStyle;
  if (style === 'short' || style === 'cropped' || style === 'swept') return;
  const side = facing === 'right', long = style === 'long', bob = style === 'bob';
  const bottom = long ? 31 : bob ? 23 : 20;
  const points: Point[] = side
    ? [[11, 8], [18, 8], [18, 15], [16, 20], [16, bottom - 2], [13, bottom], [10, bottom - 1], [9, 17]]
    : [[11, 8], [21, 8], [23, 12], [24, 20], [23, bottom - 2], [21, bottom], [17, bottom - 1], [13, bottom], [9, bottom - 2], [8, 18], [9, 12]];
  art.polygon(points, 'hair', 0);
  const inner: Point[] = side
    ? [[12, 9], [17, 9], [17, 16], [15, 22], [15, bottom - 2], [12, bottom - 1], [10, 17]]
    : [[11, 10], [21, 10], [22, 15], [23, 20], [22, bottom - 2], [19, bottom - 1], [16, bottom - 2], [12, bottom - 1], [10, bottom - 3], [9, 18]];
  art.polygon(inner, 'hair', 2);
  art.stroke(side ? [[12, 12], [11, 19], [12, bottom - 3]] : [[11, 12], [10, 18], [11, bottom - 4]], 0, 'hair', 3);
  if (!side) {
    art.stroke([[14, 15], [13, 22], [14, bottom - 2]], 0, 'hair', 3);
    art.stroke([[20, 15], [21, 22], [20, bottom - 2]], 0, 'hair', 1);
  }
  if (style === 'braid') {
    const x = side ? 11 : 17;
    for (let y = 19; y < 31; y += 3) {
      const dx = (y - 19) % 6 ? 1 : 0;
      art.polygon([[x - 2 + dx, y], [x + 1 + dx, y - 1], [x + 3 + dx, y + 1], [x + dx, y + 4], [x - 2 + dx, y + 2]], 'hair', 0);
      art.stroke([[x - 1 + dx, y], [x + 1 + dx, y + 2]], 0, 'hair', 3);
      art.pixel(x + dx, y + 2, 'hair', 2);
    }
    art.rect(x - 1, 30, 4, 2, 'cloth', 3);
    art.rect(x - 1, 32, 2, 2, 'hair', 1);
    art.pixel(x - 1, 34, 'hair', 2);
  }
}

function drawFace(art: CharacterPixelArt, look: CharacterLook, facing: SourceFacing, expression: CharacterExpression) {
  const female = look.body === 'female';
  if (facing === 'up') {
    if (look.hairStyle === 'short' || look.hairStyle === 'cropped' || look.hairStyle === 'swept') {
      art.rect(14, 15, 5, 5, 'skin', 1);
      art.rect(15, 17, 3, 3, 'skin', 2);
    }
    return;
  }
  if (facing === 'right') {
    art.polygon([[13, 9], [20, 8], [23, 11], [23, 13], [25, 14], [24, 16], [22, 16], [22, 18], [19, 20], [15, 18], [12, 15]], 'skin', 0);
    art.polygon([[14, 10], [20, 9], [22, 11], [22, 14], [24, 14], [23, 15], [21, 15], [21, 18], [18, 19], [14, 16]], 'skin', 3);
    art.rect(17, 10, 4, 2, 'skin', 4);
    art.rect(14, 13, 3, 4, 'skin', 1); art.rect(15, 13, 2, 3, 'skin', 3);
    art.pixel(20, 17, 'skin', 1); art.pixel(21, 17, 'skin', 1);
    if (expression === 'sleeping' || expression === 'grumpy') art.rect(20, 14, 3, 1, 'eye', 0);
    else { art.pixel(20, 13, 'eye', 3); art.rect(21, 13, 1, 2, 'eye', 0); }
    art.stroke(expression === 'grumpy' ? [[20, 11], [22, 12]] : [[20, 11], [22, 11]], 0, 'hair', 0);
    return;
  }
  const jaw: Point[] = female
    ? [[12, 8], [20, 8], [23, 11], [23, 15], [21, 18], [17, 20], [13, 18], [10, 15], [10, 11]]
    : [[12, 8], [20, 8], [23, 11], [23, 16], [21, 19], [13, 19], [10, 16], [10, 11]];
  art.polygon(jaw, 'skin', 0);
  art.polygon([[12, 10], [20, 9], [22, 11], [22, 15], [20, 18], [14, 18], [11, 15], [11, 12]], 'skin', 3);
  art.rect(12, 11, 8, 2, 'skin', 4);
  art.rect(11, 14, 2, 2, 'skin', 2); art.rect(21, 14, 1, 3, 'skin', 1);
  art.pixel(16, 16, 'skin', 4); art.pixel(17, 16, 'skin', 2);
  art.rect(15, 18, 3, 1, 'skin', 1);
  for (const x of [13, 18]) {
    if (expression === 'sleeping' || expression === 'grumpy') art.rect(x, 15, 2, 1, 'eye', 0);
    else { art.pixel(x, 14, 'eye', 3); art.rect(x + 1, 14, 1, 2, 'eye', 0); }
  }
  if (expression === 'grumpy') {
    art.stroke([[12, 12], [14, 13]], 0, 'hair', 0); art.stroke([[20, 12], [18, 13]], 0, 'hair', 0);
  } else if (expression !== 'sleeping') {
    art.rect(13, 12, 2, 1, 'hair', 1); art.rect(18, 12, 2, 1, 'hair', 1);
  }
}

export function drawHead(art: CharacterPixelArt, look: CharacterLook, facing: SourceFacing, expression: CharacterExpression) {
  drawFace(art, look, facing, expression);
  const style = look.hairStyle, cropped = style === 'cropped', swept = style === 'swept', side = facing === 'right';
  const top = cropped ? 6 : 3;
  const cap: Point[] = swept
    ? [[10, 9], [12, 6], [17, 4], [21, 3], [23, 5], [24, 8], [22, 12], [18, 10], [13, 12], [10, 13]]
    : [[9, 10], [10, 7], [13, top + 1], [18, top], [22, top + 2], [24, 8], [23, 12], [20, 11], [17, 10], [13, 12], [10, 14]];
  art.polygon(cap, 'hair', 0);
  art.polygon(cropped
    ? [[11, 9], [13, 7], [19, 7], [22, 9], [22, 11], [18, 10], [14, 11], [11, 12]]
    : [[11, 8], [14, 5], [18, 4], [21, 6], [22, 9], [21, 11], [17, 9], [14, 11], [10, 12]], 'hair', 2);
  art.stroke(cropped ? [[12, 9], [16, 8], [20, 9]] : [[12, 8], [15, 6], [18, 6]], 0, 'hair', 3);
  if (swept) {
    art.polygon([[12, 8], [17, 5], [21, 5], [22, 7], [17, 8], [13, 11], [11, 11]], 'hair', 3);
    art.stroke([[15, 7], [19, 6], [21, 6]], 0, 'hair', 4);
  } else if (style === 'short') {
    art.polygon([[10, 9], [13, 8], [14, 11], [12, 14], [11, 12], [9, 13]], 'hair', 1);
    art.polygon([[18, 7], [22, 8], [23, 11], [21, 13], [20, 10], [18, 11]], 'hair', 2);
    art.pixel(19, 8, 'hair', 3);
  }
  if (facing === 'up') {
    const extended = style === 'long' || style === 'bob' || style === 'braid';
    if (extended) {
      // Long hair flows from crown to rear locks; no neck gap or outlined cap seam.
      art.polygon([[10, 9], [22, 9], [23, 13], [22, 18], [20, 20], [12, 20], [10, 16]], 'hair', 2);
      art.stroke([[11, 10], [11, 15], [12, 19]], 0, 'hair', 3);
      art.stroke([[20, 10], [21, 15], [20, 19]], 0, 'hair', 1);
    } else {
      art.polygon([[10, 9], [22, 9], [23, 12], [21, 16], [18, 18], [13, 17], [10, 14]], 'hair', 0);
      art.polygon([[11, 9], [21, 9], [22, 12], [20, 15], [17, 17], [13, 16], [11, 13]], 'hair', 2);
      art.stroke([[12, 10], [12, 13], [15, 15]], 0, 'hair', 3);
      art.stroke([[20, 10], [21, 12], [19, 15]], 0, 'hair', 1);
    }
  } else if (side) {
    art.polygon([[10, 10], [17, 10], [17, 13], [15, 13], [14, 16], [12, 16], [10, 14]], 'hair', 1);
    art.stroke([[11, 10], [12, 13], [13, 14]], 0, 'hair', 2);
    if (swept) art.stroke([[18, 8], [21, 9], [22, 11]], 0, 'hair', 3);
  }
  // Front locks sit over the garment, attached to the same cap in every walking pose.
  if (style === 'long' || style === 'bob') {
    const end = style === 'long' ? 29 : 22;
    if (facing === 'down') {
      art.stroke([[10, 10], [10, 17], [11, 23], [10, end]], 1, 'hair', 0);
      art.stroke([[10, 11], [10, 17], [11, 23], [10, end - 1]], 0, 'hair', 3);
      art.stroke([[22, 10], [23, 17], [22, end]], 1, 'hair', 0);
      art.stroke([[22, 11], [22, 17], [21, end - 1]], 0, 'hair', 2);
    } else if (side) {
      art.stroke([[11, 11], [11, 17], [12, end]], 1, 'hair', 0);
      art.stroke([[11, 11], [11, 17], [12, end - 1]], 0, 'hair', 3);
    }
  }
}
