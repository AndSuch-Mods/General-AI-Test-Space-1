# Room art, directional furnishings and exact windows

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
