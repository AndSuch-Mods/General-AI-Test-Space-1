# Resident raster layers, version 8

This revision restores the approved original character from `public/art/residents-v2.png`. The user rejected the flat procedural v7 resident. That implementation has been replaced; its geometry alone was not sufficient art acceptance. The original face, proportions, detailed shading and default male coat animation remain the reference.

## Sources and registration

All artwork is original project artwork. The built-in image generator created clean clothed male/female bases, compatible wardrobe studies and hairstyle studies using the approved resident as the reference. No external game sprites were used. Accepted source images are preserved in `docs/art/sources`; failed and unused studies remain outside the production cache. Exact prompts and alpha-extraction outcomes are in [the study record](art/RESIDENT_V8_STUDY_PROMPTS.md), with source hashes in [the source manifest](art/RESIDENT_V8_SOURCE_HASHES.json).

`docs/art/pack-resident-v8.mjs` measures and imports 66 frames into `src/game/art/resident-raster-data.ts`: 12 original idle/walk poses, six clean body bases, 30 body/outfit/direction rasters and 18 hairstyle/direction rasters. The import uses nearest-neighbor sampling to 32 by 48, thresholded alpha, and stored material masks. The male wardrobe source retained a baked checkerboard after extraction attempts; the importer removes only its bright near-achromatic matte and detached matte specks. Accepted female/base/hair sources have actual alpha.

The source crops and registration coordinates are recorded in the importer, including different measured centers and sole positions. Hair uses measured neck anchors. The native pixel data are bundled with the application, so rendering needs neither a network request nor an asynchronous image load. Full-resolution source PNGs under `docs` are not copied into the offline package.

## Layer assembly

Both body options use independently generated, modestly clothed bases and tailored garments. Female clothing has a natural covered chest, waist and hip contour; male clothing uses broader shoulders. Any body can wear any saved outfit or hairstyle.

The default male coat retains the original complete lower-body and arm animation. Other outfits use their own complete raster garment over the clean base, separate sleeves and hands, original moving knees and boots, and a canonical head. The upper-leg band comes from the clean base: copying that band from the old coat would also copy its hands and satchel. Side profiles genuinely face sideways; left mirrors right.

Every direction uses one fixed approved face throughout the walk. Interchangeable hair supplies the surrounding silhouette without changing that identity. Non-coat necklines use their own garment pixels, avoiding old scarf fragments at the shoulders. Long hair and braids extend over the back. Seated poses fold the raster legs at the hip and bring the sleeves toward the lap; resting uses closed eyes, and annoyed uses a distinct resting expression.

Skin, hair, cloth, linen, leather, trousers, brass and eyes have separate material IDs. Color changes only affect their selected material. Continuous interpolated ramps retain the source's fine shading; the default amber/chestnut/warm pixels remain unchanged. There is no whole-sprite tint or newly drawn flat replacement body.

The published eye correction is retained. The original clear two-by-three eye cluster is applied equally to both front eyes, including the brow, iris and light pixels. It remains identical through hair, body, skin and gait changes. Sleep and annoyed expressions are deliberate exceptions and sample the already colored cheek for their backing.

## Renderer contract

The native frame remains 32 by 48 pixels and displays at 64 by 96 world pixels with nearest-neighbor sampling. Save option IDs are unchanged.

- `characterCanvas(appearance, look, state)` returns a shared read-only native canvas.
- `characterPixels(appearance, look, state)` returns pure RGBA pixels and material IDs.
- `residentCanvas(image, frameName, appearance, look)` keeps its old signature; `image` may be null because the measured rasters are bundled.
- `residentTextureKey` begins with `resident-raster-v8-` and includes every appearance choice.
- `mountResidentPreview` uses those exact frames, maintains its turning walk, and respects reduced motion and destruction.

State directions are down/right/up/left. Poses are idle/step-left/passing/step-right/sit/rest. Expressions are neutral/sleeping/grumpy; rest defaults to sleeping. The 28-frame catalog includes all four directions and a grumpy alias. Explicit left canvases are already mirrored; the ordinary walking helper still returns right plus flipX for leftward movement.

Native anchors remain standing ground contact (16,47), seated pelvis (16,32), and pillow/face (16,14). Renderer code must consume these frames directly rather than repainting faces or tinting the entire character.

## Validation and limits

The focused appearance suite checks preservation against an independently captured original idle fixture and verifies the approved PNG's SHA-256. It also checks matched eyes across both bodies, all hairstyles, skin tones and footfalls; fixed heads through the gait; material-only palette changes; no leaked collar fragments; mirrored profiles; distinct poses; and cache/catalog compatibility.

All 1,440 body/hair/outfit/direction/pose combinations are checked for one eight-connected silhouette and binary alpha. Diagonal contact is intentional in detailed pixel art. This catches disconnected limbs and source fragments; it does not substitute for visual review.

Native contact sheets cover every hairstyle and outfit on both bodies in all directions, all 25 skin/hair-color pairs with all six clothing colors represented, and walking/seated/resting/annoyed samples. The original and a saved female wine/braid/silver/deep/dress combination were reviewed at the actual 64 by 96 display size. Review files are `resident-v8-styles.png`, `resident-v8-outfits.png`, `resident-v8-palettes.png`, `resident-v8-poses.png` and `resident-v8-gaits-native.png` under `.local`.

Walking clothing motion is derived from registered raster sleeve transforms and the original leg animation, rather than separately generated full-frame art for every combination. Broader equipment layers, portraits and additional animations remain future work. Integrated furniture placement, offline loading and real iPhone readability require the game's separate acceptance checks.
