import type { ResidentFacing, ResidentPose } from './resident-atlas';

/** One contact-to-contact cycle over 48 world pixels, driven by actual movement. */
export const RESIDENT_STRIDE_DISTANCE = 48;
const walkingPoses: readonly ResidentPose[] = ['step-left', 'passing', 'step-right', 'idle'];

export function residentFrame(facing: ResidentFacing, distance: number, moving: boolean): { frame: string; flipX: boolean } {
  const sourceFacing = facing === 'left' ? 'right' : facing;
  const phase = Math.floor(Math.max(0, distance) / (RESIDENT_STRIDE_DISTANCE / walkingPoses.length)) % walkingPoses.length;
  const pose = moving ? walkingPoses[phase] : 'idle';
  return { frame: `${sourceFacing}-${pose}`, flipX: facing === 'left' };
}
