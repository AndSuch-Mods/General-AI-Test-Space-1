# Resident sprite source

Generated on 2026-09-18 with the built-in `image_gen` tool. No input images or existing game assets were used. The output was copied unchanged into `public/art/residents.png`. The original is retained in the tool's generated-images folder.

The original design has a brown coat, ochre scarf, aubergine trousers, worn boots and a leather satchel. It is a first production art pass. Additional appearance options, equipment layers, combat actions and animation cleanup remain open.

## Inspection and integration

- Output is 1086 by 1448 pixels, RGBA. The requested output size was not followed.
- All twelve full-body poses are present. Rows face down, left, right and up. The central column is idle.
- 1,199,514 pixels have alpha zero. The file has real transparency, not a checkerboard background. Most character pixels have alpha between 250 and 253.
- Source placement varies, so `src/game/art/resident-atlas.ts` provides measured 200 by 320 rectangles and a shared foot anchor. Do not load it as a uniform spritesheet grid.
- Use nearest-neighbor sampling. Keep the resident about 48 to 56 world pixels tall at the current room scale.
- Walk poses need review in motion at the final game scale. Side-facing poses have subtler changes than the front and back poses.
- Source image was not resized, color keyed, edited or repainted after generation. Alpha measurements were read with Pillow without modifying the image.

Original tool output: `C:/Users/gracemc/.codex/generated_images/01a0b54b-1726-75f1-81ca-a07685d5430d/exec-e4dddcaa-8919-4626-984b-6af4127c937e.png`.

## Generation prompt

```text
Use case: stylized-concept.
Asset type: production 2D pixel-art RPG character animation sprite sheet, directly usable in a top-down game, NOT concept illustration.
Primary request: Original adult resident of a cozy gothic haunted castle, an approachable androgynous young adult, short wavy dark chestnut hair, warm neutral skin, amber ochre scarf, tailored warm brown long coat with small brass buttons, dark aubergine trousers, worn leather boots, small leather cross-body satchel. Expressive layered outfit with legible silhouette. Crisp restrained handcrafted pixel clusters, no smooth painted rendering.
Canvas and layout: Exactly 3 columns by 4 rows, twelve separate complete full-body sprites on a GENUINELY TRANSPARENT ALPHA BACKGROUND. Desired image size 768 x 1024 pixels, each invisible cell 256 x 256. Every character occupies roughly 96 wide by 160 tall pixels, centered in its cell, identical scale throughout. Head top at cell y=48 and feet resting at cell y=208. Generous transparent padding between sprites.
Rows: TOP ROW faces DOWN toward viewer; SECOND ROW faces LEFT in profile; THIRD ROW faces RIGHT in profile; BOTTOM ROW faces UP with back of head and back of coat visible. Three poses in each row: left foot forward and right arm forward, neutral standing idle with both feet centered, right foot forward and left arm forward. Make the walk poses visibly different. Same character clothing and proportions throughout.
Perspective: classic three-quarter overhead RPG view from slightly above, not isometric diagonal, standing fully upright, enlarged expressive head but adult character proportions, visible top of hair and upper shoulders.
Palette: dark plum outline, cocoa shadows, muted ochre and old gold scarf highlights, light warm face, tiny cool slate reflected highlights. Moderately bright character outline readability for detailed dark backgrounds.
Lighting: neutral game sprite lighting from upper left. No ground shadow or glow. No floor. No background of any kind, no checkerboard baked into image, use genuine alpha transparency.
Constraints: Exactly twelve isolated sprites in regular 3x4 grid. No labels, no text, no logos, no border, no additional props outside character, no weapons, no copied game character, no premade sprites, no extra animation panels. Original design only. Keep all limbs inside their cells. Crisp nearest-neighbor pixel edges.
```
