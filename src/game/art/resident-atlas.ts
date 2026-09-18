/** Original generated art, measured pose by pose. See ART_RESIDENT_V2_PROMPT.md. */
export const RESIDENT_TEXTURE = 'resident-amber-v2';
export const RESIDENT_IMAGE = 'art/residents-v2.png';
export const RESIDENT_FRAME_WIDTH = 248;
export const RESIDENT_FRAME_HEIGHT = 372;
export const RESIDENT_NATIVE_WIDTH = 32;
export const RESIDENT_NATIVE_HEIGHT = 48;
/** Keep the artwork coarse while making the resident twice as tall beside furniture. */
export const RESIDENT_DISPLAY_WIDTH = 64;
export const RESIDENT_DISPLAY_HEIGHT = 96;
/** Soles align here in every source crop, independent of direction or stride. */
export const RESIDENT_ORIGIN = { x: 0.5, y: 370 / RESIDENT_FRAME_HEIGHT } as const;
export type ResidentFacing = 'down' | 'left' | 'right' | 'up';
export type ResidentPose = 'idle' | 'step-left' | 'passing' | 'step-right';
export const RESIDENT_DIRECTIONS: readonly ResidentFacing[] = ['down', 'left', 'right', 'up'];
export const RESIDENT_POSES: readonly ResidentPose[] = ['idle', 'step-left', 'passing', 'step-right'];

// Left mirrors the genuine right profile, never the front-facing row.
const sourceRows = [
  { facing: 'down', centers: [154, 444, 736, 1024], soles: [399, 398, 398, 398] },
  { facing: 'right', centers: [155, 437, 731, 1019], soles: [836, 836, 836, 836] },
  { facing: 'up', centers: [155, 441, 734, 1023], soles: [1253, 1253, 1253, 1253] },
] as const;

export const RESIDENT_FRAMES = sourceRows.flatMap(row =>
  RESIDENT_POSES.map((pose, column) => ({
    name: `${row.facing}-${pose}`,
    x: row.centers[column] - RESIDENT_FRAME_WIDTH / 2,
    y: row.soles[column] - 370,
    width: RESIDENT_FRAME_WIDTH,
    height: RESIDENT_FRAME_HEIGHT,
  })),
);
