export const BODY_OPTIONS = ['male', 'female'] as const;
export const HAIR_STYLE_OPTIONS = ['short', 'bob', 'long', 'braid', 'cropped', 'swept'] as const;
export const HAIR_COLOR_OPTIONS = ['chestnut', 'black', 'copper', 'blonde', 'silver'] as const;
export const SKIN_TONE_OPTIONS = ['fair', 'warm', 'tan', 'brown', 'deep'] as const;
export const OUTFIT_OPTIONS = ['coat', 'vest', 'tunic', 'dress', 'skirt'] as const;

export type CharacterLook = {
  body: typeof BODY_OPTIONS[number];
  hairStyle: typeof HAIR_STYLE_OPTIONS[number];
  hairColor: typeof HAIR_COLOR_OPTIONS[number];
  skinTone: typeof SKIN_TONE_OPTIONS[number];
  outfit: typeof OUTFIT_OPTIONS[number];
};

/** The original resident remains the default for existing saves. */
export const DEFAULT_LOOK: Readonly<CharacterLook> = Object.freeze({
  body: 'male', hairStyle: 'short', hairColor: 'chestnut', skinTone: 'warm', outfit: 'coat',
});
