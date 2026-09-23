# Room art, directional furnishings and exact windows

## September 22 correction: preserve the approved furniture

The user rejected the broad procedural furniture redesign and its reduced detail. The current furniture correction restores the approved original bed, desk, bookshelf, pantry, chest and nightstand from `public/art/room-v2-props.png`. Their south-facing closed frames use the original measured source rectangles and the existing nearest-neighbor native-size conversion. A canvas comparison verified identical RGBA values for all six default frames. The old three-diamond carpet motif was recovered from commit `a5dbcaa`, retaining its colors and border; its drawing is normalized to the current 226×132 footprint so this art correction does not change collision or saved placement geometry.

Only the sofa and armchair receive new designs: carved walnut and burgundy diamond upholstery derived from the approved bed's materials. Other new pictures extend the established furniture into upright side/rear views. No elevated furnishing is rotated as a flat bitmap. Separate original drawer faces, cupboard leaves and chest lids provide opening poses; hidden door/drawer faces remain occluded behind rear/side panels.

### Current integration and review boundary

`FURNITURE_IMAGES` exports five `{key,url}` preload entries. Call `buildFurnitureTextures(scene)` after those images and `ROOM_TEXTURE` load. The existing `furnitureArt` geometry/texture/foreground API remains. `drawFurniture` takes an optional final `FurnitureSources` argument for standalone canvas rendering; raster furniture requires it. Native art is sampled at one pixel per two world units. Only derived alpha is thresholded at 192; the default original crops are not altered.

Bed pillow anchors are measured per raster view. Beds and seats split one raster into complementary base/foreground layers. The original front bed keeps its prior split at native y27. The three alternate beds expose both pillows and use quilt/rail foreground cutouts. View-specific pillow anchors position the two residents. Existing front-facing bounds and collision remain compatible; the revised ground dimensions below apply when deriving rotated geometry.

Review artifacts are `.local/furniture-v8-restored.png`, `.local/furniture-v8-occupied.png`, `.local/furniture-v8-opening.png` and `.local/furniture-v8-kitchen.png`, produced by `.local/review-furniture-v8.mjs` from the actual module and images. Both sleepers' faces remain visible in every bed view; sofa/chair residents are framed by foreground arms or backrests. Review exposed tall, narrow storage profiles. The correction keeps every original front drawing dimension and increases the authored ground depth for rotated storage, while reducing its corresponding elevation. Desk, nightstand and kitchen side views sample the top surface separately from the short upright near panel. The chest uses a separately generated overhead lid with its latch on the facing edge. Bookshelf and pantry retain the approved carved details, books and jars in their broader profiles.

The eye correction was an interruption, and furniture work resumed under the user's clarification. Matching kitchen fixtures now replace the earlier procedural boxes: a four-burner iron range, ivory ceramic sink with brass faucet, and limestone preparation counter on walnut cupboards. Their individual direction drawings preserve upright elevation. The stove's complete four-burner top surface is reused in side/rear views; only that horizontal material plane turns, never the complete furnishing.

Opening poses move the original front drawer faces, cupboard leaves and chest lid. Side openings reveal facing-edge leaves or drawers; closed rear panels occlude the action. These are household visual states, not a claim that appliance progression or cooking is implemented.

`tests/furniture-art.test.ts` verifies the approved source hash and every nearest-sampled RGBA value in the six original front frames, agreement between all four art dimensions and room geometry, exact complementary bed layers with uncovered pillow anchors, and distinct front opening poses. This is local integration work; no deployment or physical-device acceptance is claimed here.

The final contact sheets were regenerated and inspected after correcting west/east source assignments, opening slivers and the four-burner stove top. All six default-frame canvas comparisons remain exact. Four focused source-art tests and targeted lint pass.

Integrated canvas captures at 960×540 are `.local/furniture-v9-bedroom-in-game.png` (a fresh world entered through the normal menu), `.local/furniture-v9-kitchen-in-room.png`, `.local/furniture-v9-kitchen-turned-in-room.png`, `.local/furniture-v9-two-sleepers-in-room.png` and `.local/furniture-v9-turned-in-room.png`. The latter four use controlled visual fixtures mounted through the production arrival scene; they validate rendering, not authority, save migration or co-op transport. No page errors occurred. The two-sleeper capture shows distinct faces above the unchanged front quilt, and the turned bed keeps both faces visible through its side-view cutout. The rotated storage fixture deliberately uses arbitrary positions and contains a bookshelf/bed overlap; it is not an accepted gameplay layout. Kitchen views retain their ceramic, stone, iron and carved walnut detail without an opaque checkerboard matte.

### Current footprint contract

All dimensions below are world units. Front drawing height remains ground depth plus elevation; odd turns exchange ground width/depth before adding upright elevation. Native texture sizes round up after division by two. Root geometry preserves legacy front-facing placement/collision while using the corrected authored ground rectangle for rotated views.

| ID | Ground footprint | Upright elevation | Front drawing | Side drawing |
| --- | --- | --- | --- | --- |
| bed | 140×96 | 34 | 140×130 | 96×174 |
| desk | 105×48 | 17 | 105×65 | 48×122 |
| bookshelf | 100×44 | 60 | 100×104 | 44×160 |
| pantry | 94×54 | 82 | 94×136 | 54×176 |
| chest | 88×44 | 8 | 88×52 | 44×96 |
| side-table | 60×36 | 12 | 60×48 | 36×72 |
| sofa | 146×44 | 44 | 146×88 | 44×190 |
| armchair | 66×34 | 36 | 66×70 | 34×102 |
| carpet | 226×132 | 0 | 226×132 | 132×226 |
| stove | 96×60 | 28 | 96×88 | 60×124 |
| sink | 112×56 | 26 | 112×82 | 56×138 |
| worktop | 140×56 | 20 | 140×76 | 56×160 |

### Generated source provenance

All five new source sheets used the built-in `image_gen` tool with the project's original approved prop sheet as the design reference. No external game's sprites were used. The first three outputs painted a checkerboard; separate built-in background-extraction edits supplied RGBA transparency. Runtime native sampling removes faint matte alpha. Each sprite has individually measured bounds; the atlas is not treated as a uniform grid. The unused first-row bed profiles in the general direction sheet are superseded by the dedicated bed sheet.

The kitchen and overhead candidate remained RGB despite requested alpha. Repeated kitchen extraction candidates also changed detail, so they were rejected. The retained original source files are unchanged. Runtime canvas preparation clears only neutral matte pixels connected to the outer image boundary, stopping at dark sprite outlines; enclosed ivory ceramic is preserved. Only the overhead candidate's chest row is used. Its other storage views drifted toward an isometric camera and were rejected in favor of the matching earlier direction sheet.

| Project source | Dimensions | Bytes | SHA-256 |
| --- | --- | --- | --- |
| `public/art/furniture-v8-directions.png` | 1086×1448 RGBA | 1,078,364 | `0c171b10f3896ece0085bdf959138ae5c1f47a888dbf39eb9a161752fa7789fe` |
| `public/art/furniture-v8-seats.png` | 1536×1024 RGBA | 1,672,629 | `47d8ea415e97d174d7c0ee3d07d43821def98ceb6a0dcbacc9158b1aaf162ab9` |
| `public/art/furniture-v8-beds.png` | 1774×887 RGBA | 1,078,431 | `3ee9325bf90ce83644ff68e5b9c2e2b712b2b7c659e7d8c6ce98d4565e7a393e` |
| `public/art/furniture-v9-kitchen.png` | 1254×1254 RGB | 2,025,727 | `e190f69612e4ea991df8a0638ea770c0b1332df10baddf9ab36a94989a3cfcd2` |
| `public/art/furniture-v9-overhead.png` | 887×1774 RGB | 2,725,927 | `a5ce465b7eb217b0d8b505dd0faa2cfea7bb6329a644293ceb05e4f270c02b18` |

Built-in source output basenames, retained under the session's generated-images directory:

- Directions: `exec-06ed971f-1f94-4759-a4aa-c2fc8004fc2b.png`; final alpha `exec-f01b0079-93bf-461a-a108-9df92f5b9875.png`.
- Seats: `exec-7d387358-eafc-474c-b107-735d19477ed0.png`; final alpha `exec-a50cd1d3-b6ae-4518-aea5-6a918775e39d.png`.
- Beds: `exec-44e84f0a-1b82-4c59-bd3e-f0d54199ab2d.png`; final alpha `exec-c75ade8b-c4de-4211-8b3a-30171bdb70bc.png`.
- Kitchen: `exec-1d5cf0cf-90c4-4eb1-8f48-370cdfb506ef.png`. Rejected transparency edits: `exec-91bcb989-b058-4b89-99a2-c112339623c1.png`, `exec-da06a00e-d964-47fd-9a04-5ef37d388577.png`, `exec-56855dec-f4e9-4788-b210-fd6a5a1b28f5.png`.
- Overhead candidate: `exec-33c01b8b-d84f-4380-92c9-601e27c2b876.png`; chest row only.

### Prompt set

Directions, with `room-v2-props.png` as the reference:

> Use case: precise-object-edit. Create a production TRANSPARENT PNG directional sprite atlas extending the six approved original furniture designs in the supplied reference. Preserve EXACT identity and carved ornamental detail, walnut wood colors, shaded pixel clusters, burgundy diamond quilt, cream pillow, brass and iron hardware, book colors and pantry jars. NO redesign or simplification. Original high quality gothic pixel art, orthographic overhead RPG view looking down from south at about 55 degrees, straight axis-aligned room perspective, no isometric diamond perspective. Sprite parts always stand upright; do NOT rotate an entire front sprite flat. No room/background/shadows outside sprites. True transparent alpha, no drawn checkerboard, no text, no labels, no borders. Atlas exactly THREE COLUMNS and SIX ROWS with wide transparent gutters, each object fully isolated inside its cell. Canvas 1536 wide by 2048 high. Columns are the object facing WEST (left), facing NORTH (away from viewer, rear view), facing EAST (right). Rows top to bottom: (1) the EXACT original carved tall headboard bed and burgundy diamond quilt with cream pillows, enlarged to double-bed width, (2) exact original six-drawer walnut desk and brass pulls, (3) exact original carved gothic bookshelf with multicolor books, trailing ivy and small skull, (4) exact original pantry hutch with jars and two lower paneled doors, (5) exact original domed walnut chest with blue-black iron bands and gold lock, (6) exact original one-drawer bedside table with brass knob. For left/right profiles show ground depth extending vertically and preserved upright elevation; furniture remains upright and drawn from the same fixed camera in every cell. Bed side view has mattress stretching left/right across the ground, ornamental headboard at the appropriate side and quilt above floor. Rear views show detailed wooden backs of the same furnishings. Use the entire cell naturally, preserve usable isolated transparent silhouettes. Keep all front-facing assets from reference untouched; this sheet contains NEW side and rear views only.

Direction transparency edit, using the displayed first output:

> Use case: background-extraction. The last displayed image is an 18-sprite furniture atlas, three columns and six rows. Preserve these exact 18 furniture sprites, every pixel design, layout, wood grain, ornament, bookcase ivy and colors. Remove ALL the gray-white checkerboard backdrop so outside every sprite is a genuine transparent alpha channel. Output an RGBA PNG. No drawn checkerboard, no matte, no shadows outside the object, no white field. Remove checker pattern in the gaps between furniture legs too. Do not redesign or repaint furniture. Keep exact three columns, six rows and same sprite orientation and placement. Alpha transparency is the entire purpose of this edit.

Seats, with `room-v2-props.png` as the reference:

> Use case: style-transfer. Production transparent PNG sprite atlas, original hand-pixel game art. Reference is the existing approved game furniture style. Design ONLY a carved walnut two-seat sofa and matching armchair with burgundy diamond-quilt upholstery, matching the reference bed's quilt and carved walnut/brass quality exactly. Rounded cushion fronts, carved gothic crests and scrolling walnut arms, subtle cloth wear, strong pixel clusters; not simplified rectangular box drawings. These must feel like members of this exact furniture set. Fixed high overhead camera: top surfaces and upholstery clearly visible. TWO rows and FOUR equal columns, 1536x1024 canvas. Top row sofa; bottom row matching armchair. Columns left to right: facing SOUTH toward viewer, WEST toward left, NORTH away, EAST toward right. Four distinct upright directional drawings, not rotating a sprite bitmap. North-facing seats must be high overhead with enough cushion visible above a LOW carved rear back so seated residents remain legible. West/east sofa ground long axis extends vertically on screen, two visible seat cushions vertically stacked; side views tall narrow silhouettes, NOT wide horizontal couch profiles. All sprites fully isolated with generous gutters, true transparent RGBA alpha outside sprites and between legs. No checkerboard, matte, ground, text, shadows outside silhouettes or labels. Preserve pixel art detail and rich restrained walnut/burgundy/brass palette. Side sofa expected ratio44 wide×190 tall, south146×88; side armchair34×102, south66×70. Draw fine detail at large resolution suitable for nearest-neighbor reduction onto a common grid.

Seat transparency edit:

> Use case: background-extraction. Preserve the exact eight walnut/burgundy sofa and armchair sprites shown in the last image, every carved detail, diamond fabric, perspective, arrangement and size. Remove the entire white/gray checkerboard, including between legs. Return a true transparent RGBA PNG alpha channel. No checkerboard painted into output, no matte or opaque background. Keep all eight sprites with their current positions, four columns and two rows. Do not repaint, simplify or redesign any furniture. Only replace the checkerboard with actual transparent alpha.

Alternate beds, with `room-v2-props.png` as the reference:

> Use case: precise-object-edit. Reference: approved original carved walnut bed at upper-left. Make a production transparent game sprite sheet containing exactly THREE upright alternate views of the SAME double bed with its burgundy diamond-quilt, cream pillows, carved gothic walnut headboard and footboard, aged brown grain, brass-warm trim. Keep design and rich pixel art detail, NO simplification. The game camera is VERY HIGH TOP-DOWN from south, 70 degrees above floor, not eye level; mattress and both pillows must remain visible in ALL views including the north/back view. Mattress is a WIDE SHORT DOUBLE BED, width140 ground units and head-to-foot depth96, while headboard rises34. First view faces WEST, second faces NORTH, third faces EAST. For west view pillow/headboard at RIGHT side of mattress (resident feet point left); for east view pillow/headboard at LEFT side (feet point right); north view pillows/headboard at BOTTOM with blanket above it. Four-way top-down RPG projection. Side view drawing dimensions96 wide ×174 tall, vertically extended mattress because double-bed width runs vertically; back view140 wide ×130 tall. Thus both WEST and EAST must be tall, narrow-ish TOP-DOWN sprites with two pillows stacked vertically along the left/right mattress side, NOT wide horizontal side-profile beds. NORTH view uses a low CUTAWAY near headboard so faces on two pillows remain visible; keep carved headboard trim along bottom, NOT a tall plank hiding the bed. Exactly3equalspaced columns in a wide sheet, all sprites isolated with gutters. Genuine transparent alpha outside objects, NO checkerboard image, NO solid background, no text, no unrelated objects. Do not rotate an entire existing bitmap.

Bed transparency edit:

> Use case: background-extraction. Preserve EXACTLY these three bed sprites at their current positions, every walnut carving, blanket diamond, pillow and perspective. Replace every gray-white checkerboard area outside bed silhouettes and in the gap between bed legs with transparent alpha. Output genuinely transparent RGBA PNG. Do not paint another background, no matte, no colored haze. Furniture pixels untouched; only remove checkerboard. This image is a sprite atlas whose only background is transparency.

Kitchen fixture sheet, using the approved original prop sheet or the preceding kitchen output as specified:

> Use case: style-transfer. Production sprite atlas for a top-down gothic household game. Reference image is the project's approved original furniture; match its detailed pixel clusters, carved walnut, brass, blue-black metal and cool gray stone exactly. Create ONLY three basic modern castle kitchen furnishings, seen from fixed steep overhead RPG camera, about70degreesdown. Row1: a practical blue-black cast-iron four-burner range with brass controls, a glazed oven door and softly worn polished top. Row2: a wide deep ivory ceramic sink with brass gooseneck faucet in a carved walnut cabinet with paneled doors and brass pulls. Row3: a long pale limestone preparation worktable on carved walnut cupboards and drawers, simple uncluttered countertop. These are functional household fixtures, not fantasy machinery. Rich original game pixel art matching the approved sheet, no simple box placeholders or photoreal surfaces. Exactly FOUR columns and THREE rows. Columns SOUTH front, WEST left, NORTH rear, EAST right. Same objects in each column; distinct upright directional views from the fixed camera, never flat rotation of a front image. For WEST/EAST, the countertop's long axis extends vertically and is clearly visible from above; they are not thin standing slivers and not stretched frontal elevations. Keep realistic elevation consistent across all views. Furniture fully isolated with generous gutters, no backdrop, no shadows outside silhouettes, no people, no text, no grid lines. Actual transparent alpha channel outside each sprite, no painted checkerboard. Target front proportions approximately stove96x88, sink112x82, worktable140x76; side views preserve overhead top area and shorter cabinet elevation instead of tall narrow stretching. Canvas1536x1536.

First kitchen transparency attempt (rejected), using the approved original prop sheet or the preceding kitchen output as specified:

> Use case: precise-object-edit. The last generated image contains12 kitchen fixture sprites in4columns and3rows. Preserve EXACTLY their designs, colors, grain, hardware, positions and shapes. Remove all gray-white checkerboard outside furniture silhouettes, including between legs, so those areas are genuine transparent alpha. Return RGBA PNG with no matte, colored haze, ground shadow or painted backdrop. Do not repaint the fixtures. Transparency is the sole change.

Second kitchen transparency attempt (rejected), using the approved original prop sheet or the preceding kitchen output as specified:

> Use case: background-extraction. The referenced last displayed kitchen sprite sheet has a FAKE opaque checkerboard. Remove the checkerboard. The final output MUST have a genuine transparent ALPHA channel, not RGB. Transparent PNG RGBA cutout. Make every pixel outside the actual12fixture silhouettes alpha zero, including gaps between feet. Keep all furniture colors and shapes EXACTLY unchanged. Do not add shadows, colored mist, glow or checkerboard. Only replace the opaque gray-white backdrop with true transparency. Same image size and positions.

Third kitchen transparency attempt (rejected), using the approved original prop sheet or the preceding kitchen output as specified:

> Remove the checkerboard background from this sprite sheet. Transparent background. Keep the furniture exactly as it is.

Overhead storage candidate (chest row retained), using the approved original prop sheet or the preceding kitchen output as specified:

> Use case: precise-object-edit. Extend the EXACT approved furniture in the reference image into steep top-down WEST and EAST views. Preserve designs, carved walnut, book colors/ivy/skull, pantry jars, iron chest straps, brass hardware and pixel-art detail. No redesign or simplification. Orthographic game camera looks almost straight down,80degreesabovefloor, fixed south viewpoint. A rotated furniture TOP PLANE extends vertically on screen; only the short near end panel stands upright below it. Do NOT draw tall side-on cabinet elevations or shrink front pictures into stripes. EXACTLY TWO columns and FIVE rows, isolated sprites on transparent background. Column1 WEST front faces left. Column2 EAST front faces right. Row1 six-drawer desk: silhouette48wide×122tall, TOP tabletop occupies top105/122 of silhouette, only17/122 is bottom leg/end-panel height. Row2 gothic bookshelf:44wide×160tall, top/upper shelf ground-plane extends100 vertically with books visible along open front edge, lower end panel elevates60; detailed carved crest and trailing ivy retained but not stretched. Row3 pantry hutch:54wide×176tall, shelf/top footprint extends94 vertically, lower end elevation82. Row4 rounded-lid iron-banded chest:44wide×96tall, elongated lid surface takes88/96 of silhouette, near-end face only8; chest must read as a broad wood/iron lid seen from above, NOT a tall arched standing object. Row5 one-drawer nightstand:36wide×72tall, rich wooden tabletop extends60 vertically, near end only12. Keep these stated ASPECT RATIOS and overhead TOP-PLANE proportions. Elevation stays upright; floor footprint rotates, no flat bitmap rotations. At WEST/EAST the long axis of wider furniture runs up-down. Full isolated silhouettes, no shadows/background/text/grid. TRUE transparent PNG outside sprites; if matte is necessary use pure vivid magenta#ff00ff rather than any checkerboard. Canvas1024x2048. Rendering quality and carved/detail density must match the original approved sheet.

## Historical V7 implementation notes

The notes below describe the earlier procedural pass. Its furniture quality was rejected. The preservation correction above supersedes those furniture claims; architecture/window work has its own current implementation and review.

This revision implements the September 22 room-art correction. The master specification remains unchanged. All new artwork here is original code-native pixel art. No external asset pack, copied game image, generated furnished background or bitmap furniture rotation is used.

## Pixel grid and palette

Every native pixel occupies two world pixels. Walnut uses warm brown shadow, grain and brass highlights. Seats and quilts use restrained plum upholstery with small woven marks; pillows use warm linen. Hall finishes combine limestone with muted blue paint and walnut paneling. Kitchen finishes use sage cabinetry, pale ceramic, stone counters and blue-black metal.

The existing original material and prop sheets remain available for compatible legacy props. The new window, directional furniture, doors, hall finishes and kitchen finishes are drawn by the modules below. Neither these assets nor the current furnishing count is a claim that the full game's art or household progression is complete.

## Window contract

`room-window-art.ts` owns the native 52×80 frame and `inWindowPane(x,y)`. Coordinates passed to this predicate are native pixels, not the former 26×40 logical grid. The procedural pointed arch, mullion, crossbar, sill and short velvet drapes contain no sky pixels.

`room-windows.ts` fills the same predicate for the entire outdoor image, then adds time-dependent sky, tree silhouettes, fog and moon or drifting lights. The renderer draws sky first and the separate frame above it at the same 104×160 world bounds. There is no independently approximated aperture and no old night sky sampled from a source image.

The contact-sheet alpha check found 1,556 pane pixels and zero overlap between opaque frame pixels and the sky mask. All pane pixels receive the sky base before decorative weather pixels are added.

## Directional furniture contract

`room-furniture.ts` exports `FURNITURE_ART_SPECS`, `furnitureArt(id,turn)`, `drawFurniture(...)` and `buildFurnitureTextures(scene)`. `buildRoomTextures` calls the builder. The module has no dependency on room placement or collision data.

Turn 0 faces south, 1 west, 2 north and 3 east. Each view is authored from a local ground plan and vertical components. Rotating the ground plan does not rotate or flatten its elevation. Components are rasterized upright with fixed screen lighting; no furniture bitmap receives `rotate`, angle or flip transforms.

| ID | Ground footprint | Vertical elevation |
| --- | --- | --- |
| bed | 140×96 | 34 |
| desk | 105×32 | 33 |
| bookshelf | 100×22 | 82 |
| pantry | 94×36 | 100 |
| chest | 88×26 | 26 |
| side-table | 60×24 | 24 |
| sofa | 146×44 | 44 |
| armchair | 66×34 | 36 |
| carpet | 226×132 | 0 |
| stove | 96×38 | 50 |
| sink | 112×38 | 44 |
| worktop | 140×38 | 38 |

Even-turn drawing width is the ground width; drawing height is ground depth plus elevation. Odd turns exchange ground width and depth, then add the unchanged elevation to drawing height. Native dimensions round up to the next pixel. The scene should use returned world `width` and `height` when setting display size, as it does with authored object bounds.

`furnitureArt` returns:

- `texture`, `full`, `base`, `foreground` and `openFrames[0..3]` frame identifiers.
- World `width`/`height` and `nativeWidth`/`nativeHeight`.
- `seats` and `pillows`, in world pixels relative to the object's drawing bounds.
- `seatRise`, currently 24 world pixels.

Use `full` for an unoccupied static object. Chest lids, cupboard leaves and desk drawers have four authored opening poses. Choose an `openFrames` pose from the rendered opening amount rather than translating unrelated old texture fragments. Hidden doors and drawers remain correctly obscured in views from the back.

## Occupied furniture layers

For beds and seats, draw `base`, then the resident, then `foreground`. Both layers occupy the full drawing bounds, so they share one origin and display size.

Seat slots are ±32 world pixels from the sofa's ground center, or at the armchair center. Their ground positions rotate with the furnishing. The visible anchor is 24 world pixels above that point. Use the resident's seated native anchor `(16,32)` and the facing associated with the furniture turn. Far arms stay behind the resident. Near arms, seat edges and a near backrest occlude the resident naturally.

Beds export two pillow anchors. Use the resident's native pillow anchor `(16,14)` there, with the resting pose. A lying resident may physically turn with the bed; the furniture itself is still an upright directional drawing. Quilts remain in the foreground. The north-facing near headboard uses a low cutaway rail so it does not hide both sleeping faces. The two pillow positions remain distinct.

## Doors and finishes

`room-architecture.ts` exports `doorArt(wall)`, `drawDoor`, `buildDoorTextures` and `drawRoomFinish`. Door metadata returns distinct north, east, south and west texture keys, with closed/open aliases and four opening poses. East and west are drawn from their own wall view and light treatment. The scene should not mirror these final textures.

North is an upright walnut entrance. East and west show a narrow recessed wall opening with visible jamb depth. South is a cutaway wall threshold with short jambs and an opening door leaf. Their placement, centered approaches and automatic traversal remain responsibilities of room geometry and authority.

`materials-native` provides `hall-floor`, `hall-wall`, `kitchen-floor` and `kitchen-wall` alongside compatible `floor` and `wall` frames. Floor frames are native64×64; walls are native64×90. Render at tile scale2. The taller wall frame fills the 180-world-pixel north wall without repeating its wallpaper below the paneling.

The hall has no stairs baked into its background. Kitchen stove, sink and worktop are separate furnishings with their own views. Clear floor and wall space is left to authored room layout for later upgrades; decorative fixtures do not imply implemented cooking or appliance progression.

## Visual review and validation

The review used actual canvas output from the exported art functions, plus the shared resident seated/resting pipeline. Contact sheets are development artifacts under `.local`:

- `art-v7-seating.png`, `art-v7-storage.png`, `art-v7-kitchen.png` for the initial four-view review.
- `art-v7-open.png` for open chest, cupboard and desk views.
- `art-v7-window-door-final.png` for aligned panes and wall-specific door states.
- `art-v7-occupied.png` for the final sofa, chair and two-sleeper composites in all four orientations.

Review corrected a broad-base stacking error that concealed cushions, moved far side-view arms behind seated heads, and lowered the north-facing bed's near cutaway rail. The final occupied sheet shows faces, sitting legs, separate pillow slots and correct foreground occlusion. These contact sheets establish asset composition; in-room camera, collision, reachability, persistence and co-op behavior still require the integrated browser and device checks.
