import type { CharacterLook } from './character-look';

export const APPEARANCE_OPTIONS = ['amber', 'moss', 'violet', 'navy', 'wine', 'cream'] as const;
export type ResidentAppearance = typeof APPEARANCE_OPTIONS[number];
export type RGB = readonly [number, number, number];
export type Ramp = readonly [RGB, RGB, RGB, RGB, RGB];
export const CHARACTER_MATERIALS = ['ink', 'skin', 'hair', 'cloth', 'linen', 'leather', 'trousers', 'brass', 'eye'] as const;
export type CharacterMaterial = typeof CHARACTER_MATERIALS[number];
export type CharacterPalette = Record<CharacterMaterial, Ramp>;

const cloth: Record<ResidentAppearance, Ramp> = {
  amber: [[47, 31, 30], [75, 45, 31], [110, 67, 38], [148, 98, 53], [184, 136, 81]],
  moss: [[28, 37, 32], [43, 60, 40], [66, 87, 50], [93, 117, 68], [129, 149, 93]],
  violet: [[38, 29, 46], [59, 40, 71], [87, 58, 103], [117, 82, 133], [151, 113, 164]],
  navy: [[23, 30, 44], [33, 47, 68], [47, 68, 93], [67, 94, 120], [98, 124, 147]],
  wine: [[46, 27, 35], [76, 35, 49], [111, 48, 66], [147, 69, 82], [180, 99, 108]],
  cream: [[65, 53, 46], [98, 81, 63], [140, 121, 95], [185, 166, 137], [222, 210, 178]],
};
const skin: Record<CharacterLook['skinTone'], Ramp> = {
  fair: [[97, 60, 55], [153, 95, 77], [203, 143, 115], [237, 186, 155], [253, 216, 183]],
  warm: [[85, 50, 39], [132, 79, 51], [183, 121, 77], [221, 163, 111], [245, 196, 148]],
  tan: [[71, 44, 36], [113, 66, 42], [157, 99, 58], [195, 139, 87], [222, 171, 115]],
  brown: [[53, 34, 32], [87, 49, 37], [126, 77, 49], [167, 112, 74], [199, 148, 105]],
  deep: [[32, 25, 29], [55, 34, 31], [86, 52, 39], [123, 80, 54], [158, 113, 80]],
};
const hair: Record<CharacterLook['hairColor'], Ramp> = {
  chestnut: [[29, 23, 28], [48, 30, 28], [75, 45, 31], [105, 65, 41], [137, 91, 56]],
  black: [[18, 21, 29], [27, 30, 39], [42, 44, 52], [60, 62, 69], [84, 85, 89]],
  copper: [[50, 26, 29], [82, 37, 29], [123, 55, 30], [170, 85, 42], [206, 125, 64]],
  blonde: [[63, 43, 35], [103, 73, 40], [151, 114, 55], [199, 161, 82], [230, 201, 127]],
  silver: [[39, 38, 48], [67, 66, 78], [109, 111, 123], [157, 164, 173], [205, 210, 209]],
};
export function characterPalette(appearance: ResidentAppearance, look: CharacterLook): CharacterPalette {
  return {
    skin: skin[look.skinTone], hair: hair[look.hairColor], cloth: cloth[appearance],
    ink: [[27, 23, 33], [27, 23, 33], [38, 30, 38], [49, 39, 47], [61, 49, 53]],
    linen: [[66, 54, 50], [109, 93, 76], [163, 144, 111], [205, 188, 150], [235, 219, 177]],
    leather: [[34, 25, 29], [60, 36, 30], [92, 55, 35], [128, 83, 46], [158, 112, 65]],
    trousers: [[25, 26, 36], [40, 40, 48], [59, 58, 62], [78, 75, 75], [100, 95, 89]],
    brass: [[64, 45, 37], [104, 72, 38], [155, 109, 48], [206, 163, 78], [239, 204, 126]],
    eye: [[28, 24, 34], [43, 32, 34], [81, 54, 43], [191, 171, 142], [240, 224, 190]],
  };
}
