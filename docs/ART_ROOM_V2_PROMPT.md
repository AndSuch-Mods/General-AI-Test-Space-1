# Arrival room art, second revision

Generated with the built-in image generation tool on 2026-09-18. These are new original assets, not edits or copies of the former arrival-room painting. No copyrighted game images were supplied. The user's review requires consistent pixel density, tangible furniture, animated lighting and a closer camera.

## Delivered assets

- `public/art/room-v2-props.png`: 1448 × 1086 RGBA, twelve separate transparent furniture/item sprites.
- `public/art/room-v2-materials.png`: 1774 × 887, reusable floor and wall material panels.
- `public/art/room-v2-flames.png`: 1536 × 1024 RGBA, six fireplace animation frames.

Original source files remain under the tool's generated-images directory. Project copies are authoritative build inputs. The previous room image remains as development history, but this scene no longer loads it.

The scene samples each source frame onto its native world pixel grid once during loading, with smoothing disabled. The generated source resolution does not set gameplay scale. Floor repeats are 128 × 128 pixels, wall segments 128 × 136, the resident is 32 × 48, furniture uses the shared draw rectangles in `src/content/room.ts`, and fire frames are 48 × 46 including their transparent margin. A 640-pixel camera width gives about 63 screen pixels of resident height on an 844-pixel landscape viewport.

Furniture images render independently with foot-depth sorting. Collision footprints and interaction reach come from the same room-object definitions used by the authority. A small hand-authored woven rug is a walkable floor layer. It introduces no hidden solid object. Candle bodies come from the prop sheet. Their compact pixel flames animate separately and stop when either resident extinguishes the corresponding candle. Fire follows the shared hearth flag. Warm flickering light also overlays neighboring floor and furniture; reduced-motion mode uses stable light and flame poses.

Transparent alpha was inspected in the prop and flame sheets. Source regions and common flame baselines are recorded in `src/game/art/room-atlas.ts`. Pixel animation and renderer code are original. Production assets were copied intact; no Python image editing or external artwork was used.

## Prop atlas prompt

```text
Use case: stylized-concept
Asset type: original production PIXEL ART transparent furniture sprite atlas for a top-down three-quarter cozy gothic RPG. This is an atlas of separate objects, NOT a room illustration.
Create exactly 12 isolated sprites in a strict 4 columns by 3 rows uniform grid, transparent background, canvas aspect ratio 4:3. Each cell has generous transparent margin and one object centered. No object crosses a cell boundary. NO grid lines, NO labels, no text.
Order left to right, top to bottom:
Row 1: burgundy quilt single bed with carved walnut headboard viewed from foot above; writing desk with only closed drawers and clear top; cold unlit blue-gray stone fireplace with empty black firebox and dark logs but NO flames; tall dark wood pantry cabinet with jars behind open upper shelving.
Row 2: tall walnut bookcase with muted colorful books; closed wooden iron-banded storage chest; small leafy fern in terracotta pot; compact square wooden bedside table with clear top.
Row 3: one arched gothic moonlit window with purple drapes, flat wall-mounted front view; brass candlestick with ivory candle but NO flame; small sealed ivory letter with burgundy wax seal; small tied cacao sack with three cacao beans.
All furniture north-facing with fronts facing viewer, flat top-down 3/4 camera, orthographic, NO isometric diamond perspective. Visible tops and fronts. Match a 32x48 logical-pixel human: bed logical50x65, desk53x33, hearth56x56, cabinet50x48, bookshelf50x52, chest44x26, plant20x31, table30x24, window40x52, candle8x16, letter13x9, sack16x18. Present each larger for editing but construct each sprite from these visibly chunky pixel clusters. Pixel art with hard crisp square edges, restrained ~32-color unified palette. Deep ink-purple outlines, walnut browns, dusty burgundy textile, desaturated teal/slate stone and glass, antique gold highlights. Rich enough to read as finished 16-bit story RPG pixel art, not blocky placeholder icons, not ultra-detailed high-resolution painting. Limit tiny texture noise. No baked light blooms, no gradients, no painted shadows outside object silhouette, no scene background. Original designs only, no copied game assets or layouts. True transparent alpha.
```

## Materials prompt

```text
Use case: stylized-concept
Asset type: original PIXEL ART reusable environment material tilesheet for cozy gothic top-down RPG.
Exactly TWO separate square texture panels side by side, equal size, horizontal 2:1 canvas. LEFT PANEL is a seamless top-down floor tile made of aged warm dark walnut planks, horizontal short planks with staggered joins, subtle visible wood grain, occasional old nail heads. RIGHT PANEL is a seamless vertical wall-facing material tile of muted dusty plum damask wallpaper above dark walnut wainscot; wallpaper covers upper two thirds, polished but worn wainscot bottom third with panel bevels.
No furnishings, candles, rug, windows, doors, flames, lights or characters. No room perspective, no whole room, no text, no labels, no frame, no gutters. Both textures fill exactly their own half, no transparent background needed.
Each panel is designed as a native 64 by64 pixel tile then visibly enlarged nearest-neighbor, crisp square pixel clusters not high-resolution painted material. 16-bit pixel RPG detail, restrained palette about20 colors, darkest ink-purple#211e2c, walnut brown#5c3d36 with muted warm highlights, wallpaper dusty plum#533747 and faded pattern#634856. Calm low contrast helps 32x48 character sprites remain readable. NO gradients, NO antialiasing, NO smooth photorealism, NO microtexture noise. Original material patterns only, not copied assets.
```

## Flame animation prompt

```text
Use case: stylized-concept
Asset type: original transparent PIXEL ART animation sheet of a small cozy fireplace flame.
Make exactly SIX frames in an exact uniform 3 columns by 2 rows grid with large transparent gutters. Each frame is ONLY the same small lively orange/amber flame, no logs, no hearth, no scenery, no text, no symbols. True transparent background. Canvas aspect ratio 3:2.
Frame flames have a consistent flat-bottom anchor, all centered in their cell. Three branching tongues and inward curling tips. The six frames show a flowing loop with changes in tongue heights and curls. Frame2 tall left tongue, frame3 high middle, frame4 tall right, frame5 left folds inward, frame6 returns near frame1. All approximately same bounding size, no detached sparks outside bounding area.
Construct each frame as 24x28 logical pixels visibly enlarged nearest-neighbor. Crisp square 1-pixel stair-step outlines and cluster shading, 7 colors from dark brick ember outer contour through rich orange, warm golden yellow, pale butter center. 16-bit story RPG quality, cohesive with restrained walnut/burgundy furniture. NO smooth gradients, NO blurry glow, NO photoreal flame, NO painterly effects, no antialiasing. Do not use solid flat triangles. Original hand-pixel appearance and branching clusters.
```

## Visual review notes

The room is now assembled from materials and independent props rather than a single illustration. Pantry draw height was adjusted to retain its tall proportions while its collision footprint remained unchanged. Native atlas generation removes source microdetail that would compete with the resident. The camera looks ahead toward the north wall while keeping the resident above the compact hotbar. Fire, furniture and candles still require physical iPhone review alongside the device acceptance checklist; desktop screenshots cannot establish touch comfort or device performance.


