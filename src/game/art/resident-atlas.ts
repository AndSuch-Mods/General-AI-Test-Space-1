/** Registered original raster layers. See docs/ART_RESIDENT_V7.md. */
export const RESIDENT_TEXTURE = 'resident-raster-v8';
/** Approved identity source; measured native crops are packed in resident-raster-data.ts. */
export const RESIDENT_IMAGE = 'art/residents-v2.png';
export const RESIDENT_FRAME_WIDTH = 32;
export const RESIDENT_FRAME_HEIGHT = 48;
export const RESIDENT_NATIVE_WIDTH = 32;
export const RESIDENT_NATIVE_HEIGHT = 48;
/** Keep the artwork coarse while making the resident twice as tall beside furniture. */
export const RESIDENT_DISPLAY_WIDTH = 64;
export const RESIDENT_DISPLAY_HEIGHT = 96;
/** Ground contact is native (16,47); sitting uses CHARACTER_ANCHORS.seated. */
export const RESIDENT_ORIGIN = { x: 0.5, y: 47 / RESIDENT_NATIVE_HEIGHT } as const;
export type ResidentFacing = 'down' | 'left' | 'right' | 'up';
export type ResidentPose = 'idle' | 'step-left' | 'passing' | 'step-right';
export const RESIDENT_DIRECTIONS: readonly ResidentFacing[] = ['down', 'left', 'right', 'up'];
export const RESIDENT_POSES: readonly ResidentPose[] = ['idle', 'step-left', 'passing', 'step-right'];

/** Canvas-atlas placement metadata, not source-image rectangles. Left is a true mirrored profile. */
export const RESIDENT_FRAMES = RESIDENT_DIRECTIONS.flatMap(facing =>
  [...RESIDENT_POSES, 'sit', 'rest', 'grumpy'].map(pose => ({ name: `${facing}-${pose}` })),
).map((frame, index) => ({ ...frame, x: index * RESIDENT_NATIVE_WIDTH, y: 0, width: RESIDENT_NATIVE_WIDTH, height: RESIDENT_NATIVE_HEIGHT }));
