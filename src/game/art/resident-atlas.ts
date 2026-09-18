/** Original generated resident sheet. Rectangles are measured, not an assumed grid. */
export const RESIDENT_TEXTURE = 'resident-amber';
export const RESIDENT_IMAGE = 'art/residents.png';
export const RESIDENT_FRAME_WIDTH = 200;
export const RESIDENT_FRAME_HEIGHT = 320;
/** All poses use the same foot position after their source rectangles are aligned. */
export const RESIDENT_ORIGIN = { x: 0.5, y: 310 / 320 } as const;
export type ResidentFacing = 'down' | 'left' | 'right' | 'up';
export type ResidentPose = 'step-left' | 'idle' | 'step-right';
export const RESIDENT_DIRECTIONS: readonly ResidentFacing[] = ['down', 'left', 'right', 'up'];
export const RESIDENT_POSES: readonly ResidentPose[] = ['step-left', 'idle', 'step-right'];

const columns = [112, 442, 772] as const;
const rowTops = {
  down: [35, 27, 35],
  left: [385, 388, 385],
  right: [738, 740, 738],
  up: [1086, 1078, 1090],
} as const;

export const RESIDENT_FRAMES = RESIDENT_DIRECTIONS.flatMap(facing =>
  RESIDENT_POSES.map((pose, column) => ({
    name: `${facing}-${pose}`,
    x: columns[column],
    y: rowTops[facing][column],
    width: RESIDENT_FRAME_WIDTH,
    height: RESIDENT_FRAME_HEIGHT,
  })),
);
