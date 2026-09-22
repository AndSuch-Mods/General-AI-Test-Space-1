import { DEFAULT_LOOK, type CharacterLook } from './character-look';
import { characterPixels, type CharacterState, type CharacterPose } from './character-art';
import { characterPalette, type ResidentAppearance } from './character-palette';
import { RESIDENT_NATIVE_WIDTH, RESIDENT_NATIVE_HEIGHT, type ResidentFacing } from './resident-atlas';

export { APPEARANCE_OPTIONS, type ResidentAppearance } from './character-palette';
export { characterPixels, CHARACTER_ANCHORS, type CharacterState, type CharacterPose, type CharacterExpression } from './character-art';

export function residentTextureKey(appearance: ResidentAppearance, look: CharacterLook = DEFAULT_LOOK): string {
  return `resident-layered-v7-${appearance}-${look.body}-${look.hairStyle}-${look.hairColor}-${look.skinTone}-${look.outfit}`;
}
/** Kept for older callers. Facial expressions now belong to characterCanvas itself. */
export function residentSkinColor(look: CharacterLook = DEFAULT_LOOK): string {
  return `rgb(${characterPalette('amber', look).skin[3].join(',')})`;
}

const canvases = new Map<string, HTMLCanvasElement>();
/** Shared, read-only native artwork. No raster source, RGB masks or sprite repainting. */
export function characterCanvas(appearance: ResidentAppearance, look: CharacterLook = DEFAULT_LOOK, state: CharacterState = { facing: 'down', pose: 'idle' }): HTMLCanvasElement {
  const key = `${residentTextureKey(appearance, look)}:${state.facing}:${state.pose}:${state.expression ?? (state.pose === 'rest' ? 'sleeping' : 'neutral')}`;
  const cached = canvases.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = RESIDENT_NATIVE_WIDTH; canvas.height = RESIDENT_NATIVE_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not draw the resident.');
  const data = context.createImageData(canvas.width, canvas.height);
  data.data.set(characterPixels(appearance, look, state).pixels);
  context.putImageData(data, 0, 0);
  // The room copies these into its own texture. Bound creation-menu browsing memory.
  if (canvases.size >= 384) canvases.delete(canvases.keys().next().value!);
  canvases.set(key, canvas);
  return canvas;
}

const poses: readonly CharacterPose[] = ['idle', 'step-left', 'passing', 'step-right', 'sit', 'rest'];
export function characterFrameState(frameName: string): CharacterState {
  const facing = frameName.split('-')[0] as ResidentFacing;
  const pose = frameName.slice(facing.length + 1);
  if (!['down', 'right', 'left', 'up'].includes(facing)) throw new Error(`Unknown resident frame: ${frameName}`);
  if (pose === 'grumpy') return { facing, pose: 'rest', expression: 'grumpy' };
  if (!poses.includes(pose as CharacterPose)) throw new Error(`Unknown resident frame: ${frameName}`);
  return { facing, pose: pose as CharacterPose };
}

/** Compatibility signature: the old image argument is ignored, never sampled. */
export function residentCanvas(_image: HTMLImageElement | null, frameName: string, appearance: ResidentAppearance, look: CharacterLook = DEFAULT_LOOK): HTMLCanvasElement {
  return characterCanvas(appearance, look, characterFrameState(frameName));
}
