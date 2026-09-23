import { DEFAULT_LOOK, type CharacterLook } from './character-look';
import type { ResidentAppearance } from './character-palette';
import { colorRaster, emptyRaster, mirrorRaster, overlay, rasterSource, transformLayer, type CharacterRaster, type PixelMask } from './character-pixel-art';
import { expressResident, residentHead, type CharacterExpression, type SourceFacing } from './character-head';
import type { ResidentFacing } from './resident-atlas';

export type CharacterPose = 'idle' | 'step-left' | 'passing' | 'step-right' | 'sit' | 'rest';
export type CharacterState = { facing: ResidentFacing; pose: CharacterPose; expression?: CharacterExpression };
export type { CharacterExpression } from './character-head';
export const CHARACTER_ANCHORS = { standing: { x: 16, y: 47 }, seated: { x: 16, y: 32 }, pillow: { x: 16, y: 14 } } as const;
const garmentHem = { coat: 35, vest: 32, tunic: 38, dress: 41, skirt: 39 } as const;

function seatedLegs(target: CharacterRaster, legs: CharacterRaster, facing: SourceFacing) {
  if (facing === 'right') {
    transformLayer(target, legs, (_x, y) => y >= 32 && y < 40, (x, y) => [13 + (y - 32), 32 + (x - 15)]);
    transformLayer(target, legs, (_x, y) => y >= 40, (x, y) => [x - 6, y - 1]);
  } else transformLayer(target, legs, (_x, y) => y >= 32, (x, y) => [x, 32 + (y - 32) * .94]);
}

function garmentBody(look: CharacterLook, facing: SourceFacing, pose: CharacterPose): CharacterRaster {
  const target = emptyRaster(), gait = pose === 'sit' || pose === 'rest' ? 'idle' : pose;
  const original = rasterSource(`original-${facing}-${gait}`);
  if (look.body === 'male' && look.outfit === 'coat' && pose !== 'sit' && pose !== 'rest') {
    overlay(target, original, (_x, y) => y >= 20);
    return target;
  }
  const source = look.body === 'male' && look.outfit === 'coat' ? rasterSource(`original-${facing}-idle`) : rasterSource(`body-${look.body}-${look.outfit}-${facing}`);
  const base = rasterSource(`base-${look.body}-${facing}`), hem = garmentHem[look.outfit];
  const side = facing === 'right', seated = pose === 'sit', resting = pose === 'rest';
  const stride = pose === 'step-left' ? -1 : pose === 'step-right' ? 1 : 0;
  overlay(target, base, (x, y) => y >= 20 && y <= 31 && x >= (side ? 17 : 13) && x <= 20);
  const legs = emptyRaster();
  // The original upper leg band also contains hands and the satchel. Use the clean
  // base there, then the approved moving knees and boots below its coat hem.
  overlay(legs, base, (_x, y) => y >= 31 && y < 36);
  overlay(legs, original, (_x, y) => y >= 36);
  if (seated) seatedLegs(target, legs, facing);
  else overlay(target, legs, (_x, y) => y >= 32);
  const leftArm: PixelMask = (x, y) => y >= 22 && y < 35 && x <= (side ? 16 : y < 32 ? 11 : 9);
  const rightArm: PixelMask = (x, y) => !side && y >= 22 && y < 35 && x >= (y < 32 ? 22 : 23);
  const core: PixelMask = (x, y, material) => y >= (look.outfit === 'coat' ? 20 : 18) && y < hem && !leftArm(x, y, material) && !rightArm(x, y, material);
  if (seated) transformLayer(target, source, core, (x, y) => [x - (side && y >= 31 ? Math.min(5, y - 30) : 0), y < 31 ? y : 31 + (y - 31) / .65]);
  else overlay(target, source, core);
  for (const [mask, sign] of [[leftArm, -1], [rightArm, 1]] as const) {
    const angle = (seated || resting ? (side ? -28 : sign * 18) : side ? stride * 20 : stride * sign * 6) * Math.PI / 180;
    const ax = side ? 15 : sign < 0 ? 10 : 23, ay = 22, cos = Math.cos(angle), sin = Math.sin(angle);
    transformLayer(target, source, mask, (x, y) => [ax + (x - ax) * cos + (y - ay) * sin, ay - (x - ax) * sin + (y - ay) * cos]);
  }
  overlay(target, source, (_x, y) => y >= 20 && y < 22);
  return target;
}

/** Registered raster layers retain their painted shading through every pose. */
export function characterPixels(appearance: ResidentAppearance, look: CharacterLook = DEFAULT_LOOK, state: CharacterState = { facing: 'down', pose: 'idle' }): CharacterRaster {
  const facing: SourceFacing = state.facing === 'left' ? 'right' : state.facing;
  const body = garmentBody(look, facing, state.pose), head = residentHead(look, facing);
  overlay(body, head);
  colorRaster(body, appearance, look);
  expressResident(body, facing, state.expression ?? (state.pose === 'rest' ? 'sleeping' : 'neutral'));
  return state.facing === 'left' ? mirrorRaster(body) : body;
}
