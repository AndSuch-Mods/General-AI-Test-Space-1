# Layered resident artwork, version 7

The September 22 review rejected the earlier garment and hair repainting. This revision replaces that pipeline with original, code-authored native pixel artwork. It does not sample, recolor or cover the old clothed resident PNG. That PNG remains historical material only.

## Bodies and layers

Both bodies are drawn from clean anatomical contours and joint positions. The male base has broader shoulders and a straighter torso. The female base has a softer jaw, narrower shoulders, a shaped waist and hips, and a modest chest contour fully covered by its garment. Neither base is a scaled version of the other. Both use the same adult height and animation timing. All outfits and hairstyles remain available to both.

The native frame is 32 by 48 pixels and displays at 64 by 96 world pixels with nearest-neighbor sampling. Drawing uses integer pixel clusters and binary transparency. There is no antialiasing, image reduction, RGB classification, whole-character tint or post-render body shrinking.

The layer order is rear hair, legs and boots, far arm, torso and garment, skirt where applicable, visible arms and hands, rear-facing hair where it covers the back, then the head and front locks. Shoulder, elbow, wrist, hip, knee and ankle positions drive both the body and its clothing. Hands join their sleeves at the wrist. Front and back hair share crown and nape positions. Hair flows through the rear head without an outlined cap seam.

Each drawing operation names a material and one of its five shades. Skin, hair, garment cloth, linen, leather, trousers, brass and eyes have independent palettes. This permits every saved color combination without guessing which finished brown pixels belong to skin or clothing. Darker skin uses its own shadow, middle and highlight colors. Facial expressions are authored in the head layer.

| Module | Responsibility |
| --- | --- |
| `character-look.ts` | Existing saved body, hair, skin and outfit choices; unchanged default |
| `character-palette.ts` | Six garment, five skin and five hair palettes; shared material ramps |
| `character-pixel-art.ts` | Native integer raster drawing and explicit material IDs |
| `character-head.ts` | Connected front/rear hair, both face contours and neutral/sleeping/grumpy expressions |
| `character-art.ts` | Both body rigs, joint poses, garment shapes, boots, sleeves and layer assembly |
| `resident-appearance.ts` | Shared canvas cache, native pixel API and compatibility adapter |
| `resident-atlas.ts` | Native dimensions, display size, origin and complete frame catalog |
| `resident-preview.ts` | The same live artwork used by the room, with reduced-motion support |

## Renderer contract

`characterCanvas(appearance, look, state)` returns a read-only 32 by 48 canvas. Its state contains `facing`, `pose`, and optional `expression`.

- Facing: `down`, `right`, `up`, `left`. Left mirrors the complete right profile.
- Pose: `idle`, `step-left`, `passing`, `step-right`, `sit`, `rest`.
- Expression: `neutral`, `sleeping`, `grumpy`. Rest defaults to sleeping. The back of the head naturally conceals a facial expression.

`characterPixels` accepts the same parameters and returns pure RGBA pixels plus material IDs for tests and tools. It requires no image, DOM or network request. `residentTextureKey` contains version 7 and every saved appearance choice.

The compatibility call `residentCanvas(image, frameName, appearance, look)` remains available, but ignores `image`; callers may pass null. Frame names are a direction followed by a pose. `down-grumpy`, for example, selects the resting body and annoyed face. `RESIDENT_FRAMES` contains 28 entries: four directions times four walk/idle frames, sitting, rest and grumpy. Its rectangles describe the generated native canvas atlas, not a source sheet.

The scene must use these frames directly. It must not paint over the face, recolor the whole actor or crop clothing from an old source. `residentFrame` retains the existing distance-based walking contract, returning a right profile plus `flipX` for leftward walking. Explicit left-facing sitting/rest canvases are already mirrored and require no additional flip.

Native anchors are exported as `CHARACTER_ANCHORS`:

- Standing ground contact: `(16, 47)`, with origin `(0.5, 47/48)`.
- Seated pelvis/chair seat: `(16, 32)`, with origin `(0.5, 32/48)` when positioned directly on a chair's seat.
- Resting face/pillow: `(16, 14)`, available when placing a head on the pillow. The complete clothed body remains in the frame for quilt occlusion.

Seated poses bend hips and knees, bring hands to the lap and shorten hanging garments. Side seating has forward thighs and lower legs descending toward the feet. Rest places the hands together and uses closed eyes. Grumpy uses the same resting body with lowered brows. Walking alternates opposing arms and feet while retaining one identical head per facing. The side passing pose includes a lifted foot; it is distinct from idle.

## Provenance and validation

All silhouettes, joint poses, pixel contours, garment details, hair clusters, facial expressions and color ramps in these modules were authored for Twilight. No external sprite, commercial game asset, downloaded art or image generator was used for this revision. Earlier generated resident provenance remains historical and is not the source of the new pixels.

The focused artwork suite checks 1,440 combinations of body, hairstyle, outfit, direction and all standing/walking/sitting/rest poses for one connected opaque silhouette and binary alpha. It also verifies material-only recoloring, fixed heads through footfalls, genuine side mirroring, distinct pose/expression frames, valid catalog entries and appearance cache separation. These checks cover geometry independently of palette choice.

Visual contact sheets were rendered and reviewed for all six hairstyles on both bodies in all four directions, all five outfits on both bodies in all four directions, all 25 skin/hair-color pairs with all six garment colors represented, and directional seated/resting/annoyed samples. Review found and corrected a detached braid tassel pixel, a rear hair cap seam and overly bright eye clusters. Local review images are `resident-v7-styles.png`, `resident-v7-outfits.png`, `resident-v7-palettes.png`, and `resident-v7-poses.png` under the ignored `.local` directory.

This is the resident foundation for the current household slice. Equipment layers, more body and hair options, portraits and broader game animation remain future art work. Integrated chair/bed placement, iPhone readability and touch play remain renderer and device acceptance checks; these native art checks do not prove them.
