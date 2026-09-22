import { DEFAULT_LOOK, type CharacterLook } from './character-look';
import { characterPalette, type ResidentAppearance, type CharacterMaterial } from './character-palette';
import { CharacterPixelArt, type Point } from './character-pixel-art';
import { drawBackHair, drawHead, type CharacterExpression, type SourceFacing } from './character-head';
import type { ResidentFacing } from './resident-atlas';

export type CharacterPose = 'idle' | 'step-left' | 'passing' | 'step-right' | 'sit' | 'rest';
export type CharacterState = { facing: ResidentFacing; pose: CharacterPose; expression?: CharacterExpression };
export type { CharacterExpression } from './character-head';
export const CHARACTER_ANCHORS = { standing: { x: 16, y: 47 }, seated: { x: 16, y: 32 }, pillow: { x: 16, y: 14 } } as const;

type Limb = { shoulder: Point; elbow: Point; hand: Point };
type Leg = { hip: Point; knee: Point; ankle: Point };
type Rig = { farArm: Limb; nearArm: Limb; farLeg: Leg; nearLeg: Leg };

/** Two clean body rigs. Clothing and bare hands share these joints, including seated poses. */
function bodyRig(look: CharacterLook, facing: SourceFacing, pose: CharacterPose): Rig {
  const side = facing === 'right', seated = pose === 'sit', rest = pose === 'rest';
  const stride = pose === 'step-left' ? -1 : pose === 'step-right' ? 1 : 0;
  const passing = pose === 'passing', broad = look.body === 'male';
  if (side) {
    return {
      farArm: { shoulder: [18, 23], elbow: seated || rest ? [20, 27] : [18 - stride * 3, 27], hand: seated || rest ? [22, 31] : [passing ? 17 : 18 - stride * 6, 31] },
      nearArm: { shoulder: [13, 23], elbow: seated || rest ? [15, 28] : [14 + stride * 3, 28], hand: seated || rest ? [21, 32] : [passing ? 16 : 15 + stride * 7, 32] },
      farLeg: { hip: [18, seated ? 31 : 33], knee: seated ? [23, 34] : [passing ? 19 : 18 - stride * 3, 39], ankle: seated ? [24, 41] : [passing ? 19 : 18 - stride * 7, stride > 0 || passing ? 43 : 45] },
      nearLeg: { hip: [14, seated ? 31 : 33], knee: seated ? [20, 35] : [15 + stride * 3, passing ? 40 : 39], ankle: seated ? [21, 42] : [passing ? 14 : 15 + stride * 7, stride < 0 ? 43 : 45] },
    };
  }
  const leftShoulder: Point = [broad ? 10 : 11, 23], rightShoulder: Point = [broad ? 23 : 22, 23];
  return {
    farArm: { shoulder: leftShoulder, elbow: [seated || rest ? 11 : 9 - stride, 28], hand: seated || rest ? [13, 32] : [9 - stride, 33 + stride * 2] },
    nearArm: { shoulder: rightShoulder, elbow: [seated || rest ? 22 : 24 - stride, 28], hand: seated || rest ? [20, 32] : [24 - stride, 33 - stride * 2] },
    farLeg: { hip: [13, seated ? 31 : 33], knee: [seated ? 12 : passing ? 14 : 13, seated ? 36 : 39], ankle: [seated ? 12 : passing ? 15 : 12, seated ? 42 : stride === 1 ? 43 : 45] },
    nearLeg: { hip: [20, seated ? 31 : 33], knee: [seated ? 21 : passing ? 19 : 20, seated ? 36 : 39], ankle: [seated ? 21 : passing ? 18 : 21, seated ? 42 : stride === -1 ? 43 : 45] },
  };
}

function leg(art: CharacterPixelArt, limb: Leg, side: boolean, far: boolean) {
  art.stroke([limb.hip, limb.knee, limb.ankle], 2, 'trousers', 0);
  art.stroke([limb.hip, limb.knee, limb.ankle], 1, 'trousers', far ? 1 : 2);
  art.stroke([[limb.hip[0] - 1, limb.hip[1]], [limb.knee[0] - 1, limb.knee[1]], [limb.ankle[0] - 1, limb.ankle[1] - 1]], 0, 'trousers', far ? 2 : 3);
  const [x, y] = limb.ankle;
  art.polygon([[x - 2, y - 2], [x + 2, y - 2], [x + 2, y], [x + (side ? 4 : 3), y + 1], [x + (side ? 4 : 3), y + 3], [x - 2, y + 3]], 'leather', 0);
  art.rect(x - 1, y - 1, 3, 3, 'leather', far ? 1 : 2);
  art.rect(x - 1, y - 1, 2, 1, 'leather', 3);
  art.rect(x - 1, y + 1, side ? 4 : 3, 1, 'leather', far ? 2 : 3);
}

function arm(art: CharacterPixelArt, limb: Limb, look: CharacterLook, far: boolean) {
  const sleeve: CharacterMaterial = look.outfit === 'vest' || look.outfit === 'skirt' ? 'linen' : 'cloth';
  const wrist: Point = [limb.hand[0], limb.hand[1] - 2];
  // The complete limb exists beneath its sleeve; no disconnected hand overlays.
  art.stroke([limb.shoulder, limb.elbow, limb.hand], 1, 'skin', 1);
  art.stroke([limb.shoulder, limb.elbow, wrist], 2, sleeve, 0);
  art.stroke([limb.shoulder, limb.elbow, wrist], 1, sleeve, far ? 1 : 2);
  art.stroke([[limb.shoulder[0] - 1, limb.shoulder[1]], [limb.elbow[0] - 1, limb.elbow[1]], [wrist[0] - 1, wrist[1]]], 0, sleeve, far ? 2 : 3);
  art.rect(wrist[0] - 1, wrist[1], 3, 1, sleeve, 4);
  const [x, y] = limb.hand;
  art.rect(x - 1, y - 1, 3, 3, 'skin', 0);
  art.rect(x - 1, y - 1, 2, 2, 'skin', far ? 2 : 3);
  art.pixel(x - 1, y - 1, 'skin', 4);
}

function torsoContour(look: CharacterLook, facing: SourceFacing, seated: boolean): Point[] {
  const female = look.body === 'female', bottom = seated ? 33 : 35;
  if (facing === 'right') return female
    ? [[14, 20], [18, 20], [20, 22], [22, 24], [22, 26], [20, 29], [20, 31], [22, bottom - 1], [21, bottom], [12, bottom], [13, 29], [12, 23]]
    : [[13, 20], [19, 20], [21, 23], [21, 28], [20, 31], [21, bottom], [12, bottom], [12, 24]];
  return female
    ? [[14, 20], [19, 20], [22, 22], [23, 25], [22, 27], [20, 30], [21, 32], [23, bottom], [10, bottom], [12, 31], [12, 28], [10, 24], [11, 22]]
    : [[13, 20], [20, 20], [24, 22], [23, 27], [22, 32], [23, bottom], [10, bottom], [11, 31], [10, 26], [9, 22]];
}

function torso(art: CharacterPixelArt, look: CharacterLook, facing: SourceFacing, pose: CharacterPose) {
  const side = facing === 'right', seated = pose === 'sit', female = look.body === 'female';
  const material: CharacterMaterial = look.outfit === 'skirt' ? 'linen' : 'cloth';
  const contour = torsoContour(look, facing, seated);
  // The skin base defines the same shoulders, chest, waist and hips as the garment.
  art.polygon(contour, 'skin', 1);
  art.rect(side ? 16 : 14, 18, side ? 4 : 5, 5, 'skin', 1);
  art.rect(side ? 17 : 15, 18, 3, 4, 'skin', 3);
  art.polygon(contour, material, 0);
  const inner = contour.map(([x, y]): Point => [x < 16 ? x + 1 : x > 18 ? x - 1 : x, y === 20 ? 21 : y >= (seated ? 32 : 34) ? y - 1 : y]);
  art.polygon(inner, material, 2);
  art.polygon(side
    ? [[14, 22], [17, 22], [17, 27], [15, 30], [15, seated ? 32 : 34], [13, seated ? 32 : 34]]
    : [[12, 23], [15, 22], [15, 28], [14, 31], [14, seated ? 32 : 34], [12, seated ? 32 : 34]], material, 3);
  art.stroke(side ? [[20, 23], [21, 25], [19, 29], [20, seated ? 32 : 34]] : [[21, 23], [21, 27], [19, 30], [21, seated ? 32 : 34]], 0, material, 1);
  // A continuous curved cloth highlight reads as a covered chest, not added anatomy.
  if (female && facing !== 'up') art.stroke(side ? [[18, 23], [20, 24], [20, 25]] : [[13, 24], [15, 25], [18, 25], [20, 24]], 0, material, 3);
  const hem = seated ? 34 : 37;
  if (look.outfit === 'coat') {
    art.polygon(side ? [[13, 29], [20, 29], [22, hem], [12, hem], [12, hem - 2]] : [[11, 29], [22, 29], [24, hem], [18, hem], [16, hem - 2], [14, hem], [9, hem]], 'cloth', 0);
    art.polygon(side ? [[14, 29], [19, 29], [20, hem - 1], [13, hem - 1]] : [[12, 29], [21, 29], [22, hem - 1], [18, hem - 1], [16, hem - 3], [14, hem - 1], [11, hem - 1]], 'cloth', 2);
    if (facing !== 'up') {
      art.polygon(side ? [[18, 21], [20, 23], [19, 29], [17, 29]] : [[14, 21], [19, 21], [18, 30], [15, 30]], 'linen', 2);
      art.stroke(side ? [[18, 22], [17, 25], [18, 29]] : [[13, 22], [15, 26], [14, 31]], 0, 'cloth', 4);
      if (!side) art.stroke([[20, 22], [18, 26], [19, 31]], 0, 'cloth', 1);
      for (const y of [27, 30, 33]) art.pixel(side ? 19 : 19, y, 'brass', 3);
    } else art.stroke([[17, 24], [17, hem - 2]], 0, 'cloth', 1);
  } else if (look.outfit === 'vest') {
    if (facing !== 'up') {
      art.polygon(side ? [[17, 21], [20, 22], [18, 27], [16, 22]] : [[13, 21], [20, 21], [17, 27]], 'linen', 3);
      art.stroke(side ? [[18, 27], [18, 33]] : [[17, 27], [17, 33]], 0, 'cloth', 0);
      for (const y of [27, 30, 32]) art.pixel(17, y, 'brass', 3);
    }
  } else if (look.outfit === 'tunic') {
    const length = seated ? 35 : 38;
    art.polygon(side ? [[13, 29], [20, 29], [22, length], [11, length]] : [[12, 29], [21, 29], [23, length], [10, length]], 'cloth', 0);
    art.polygon(side ? [[14, 29], [19, 29], [20, length - 1], [13, length - 1]] : [[13, 29], [20, 29], [21, length - 1], [12, length - 1]], 'cloth', 2);
    art.stroke([[14, 32], [13, length - 2]], 0, 'cloth', 3);
    art.rect(side ? 13 : 12, 30, side ? 8 : 10, 2, 'leather', 1);
    art.rect(side ? 19 : 16, 30, 2, 2, 'brass', 2);
  }
  // Collars belong to their garment and follow the neck, including all body types.
  if (facing !== 'up') {
    const collar: CharacterMaterial = look.outfit === 'tunic' ? 'cloth' : 'linen';
    art.stroke(side ? [[16, 21], [18, 23], [20, 21]] : [[13, 21], [15, 23], [16, 21]], 0, collar, 4);
    if (!side) art.stroke([[17, 21], [18, 23], [20, 21]], 0, collar, 3);
  } else art.rect(side ? 16 : 14, 20, 5, 1, material, 4);
}

function skirt(art: CharacterPixelArt, look: CharacterLook, facing: SourceFacing, pose: CharacterPose) {
  if (look.outfit !== 'dress' && look.outfit !== 'skirt') return;
  const side = facing === 'right', seated = pose === 'sit', dress = look.outfit === 'dress';
  const sway = pose === 'step-left' ? -1 : pose === 'step-right' ? 1 : 0;
  const bottom = seated ? 38 : dress ? 43 : 41;
  const outline: Point[] = seated && side
    ? [[13, 29], [20, 29], [24, 33], [26, 37], [23, 39], [18, 38], [12, 34]]
    : [[12, 29], [21, 29], [22, 33], [25 + sway, bottom - 1], [23 + sway, bottom], [18 + sway, bottom - 1], [15 + sway, bottom], [8 + sway, bottom - 1], [11, 33]];
  art.polygon(outline, 'cloth', 0);
  art.polygon(seated && side
    ? [[14, 30], [19, 30], [23, 34], [24, 37], [22, 38], [14, 34]]
    : [[13, 30], [20, 30], [21, 34], [23 + sway, bottom - 1], [18 + sway, bottom - 2], [15 + sway, bottom - 1], [10 + sway, bottom - 2], [12, 34]], 'cloth', 2);
  art.stroke(seated && side ? [[16, 32], [22, 36]] : [[14, 32], [12 + sway, bottom - 3]], 0, 'cloth', 3);
  art.stroke(seated && side ? [[19, 32], [24, 36]] : [[19, 32], [21 + sway, bottom - 3]], 0, 'cloth', 1);
  if (!side) art.stroke([[17, 33], [16 + sway, bottom - 3]], 0, 'cloth', 3);
  art.rect(12, 29, 9, 2, 'cloth', 1);
  art.rect(side ? 19 : 16, 29, 2, 1, 'brass', 3);
}

/** Pure native artwork, generated from the clean rigs and authored layers, with no source image. */
export function characterPixels(appearance: ResidentAppearance, look: CharacterLook = DEFAULT_LOOK, state: CharacterState = { facing: 'down', pose: 'idle' }) {
  const facing: SourceFacing = state.facing === 'left' ? 'right' : state.facing;
  const art = new CharacterPixelArt(characterPalette(appearance, look)), rig = bodyRig(look, facing, state.pose);
  const side = facing === 'right', expression = state.expression ?? (state.pose === 'rest' ? 'sleeping' : 'neutral');
  if (facing !== 'up') drawBackHair(art, look, facing);
  leg(art, rig.farLeg, side, true); leg(art, rig.nearLeg, side, false);
  arm(art, rig.farArm, look, true);
  torso(art, look, facing, state.pose); skirt(art, look, facing, state.pose);
  if (!side) arm(art, rig.farArm, look, true);
  arm(art, rig.nearArm, look, false);
  if (facing === 'up') drawBackHair(art, look, facing);
  drawHead(art, look, facing, expression);
  const result = state.facing === 'left' ? art.mirrored() : art;
  return { pixels: result.pixels, materials: result.materials };
}
