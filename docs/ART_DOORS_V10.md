# Door components and raised curtains, September 23

The user rejected the prior whole-door squash and shear. This revision uses newly generated detailed walnut components and projects a separate rigid leaf over a fixed frame. Existing furniture and character artwork are untouched.

## Sources and rendering

Built-in image generation used the project's original `doors-v8.png` as the style reference. A second built-in background-extraction pass supplied transparent alpha. The selected file is `public/art/door-parts-v10.png`, 1254×1254 RGBA, 507,080 bytes, SHA-256 `cdf5931b40c90abfe4892c39c52b646ca6e2a62a64910c88ce42ee7f257f0156`. Source outputs are `exec-a41be160-0f7d-4cdd-9e9d-cad5b3ada744.png` and selected `exec-7761d224-36c9-4f1e-9dc1-d32413fbce08.png` in the generated-images session directory. No external game art was used.

Measured components include front/back paneled leaves, matching brass hardware, jambs, lintel, recess and the cutaway south threshold. The generator retained angled side-frame connections, so the renderer assembles the separately measured post components upright. It does not squash or shear an entire doorway. Leaf geometry projects the full detailed face; the west/east free edge moves down and inward. The south leaf keeps its full 66-world-pixel length through opening, with hardware on both faces. The north leaf opens past its left jamb, with its back-face knob outside. Dark recesses remain behind fixed woodwork.

`doorArt(wall)` returns display dimensions and world offsets relative to the unchanged logical doorway. North is112×170 at−24,0; west112×156 at0,−16; east112×156 at−80,−16; south104×112 at−8,−76. The south frame itself sits four world pixels inward. Extra transparent canvas accommodates leaf motion. All native pixels remain two world pixels.

The original curtain fabric is extended upward. Its original rod grain and finials sit above the stone arch. `WINDOW_NATIVE` remains52×80 and the pane predicate/day cycle are unchanged. `WINDOW_FRAME_NATIVE` is52×86; `WINDOW_FRAME_OFFSET_Y` is−12world pixels. The scene renders only the frame104×172 at this offset. The sky remains104×160 at its original bounds. Original gray stone and mullion pixels keep their world positions.

## Evidence

Focused tests cover fixed exposed frame pixels, upright side posts, downward side swing, south leaf length, north free-edge placement, preserved stone/glass, day/night masking and visible mist. Contact sheets are `.local/architecture-v10-review.png` and `.local/window-curtains-v10.png`. Native sampling thresholds only the generated faint edge alpha. This art check does not replace the root task's combined gameplay and device checks.

## Exact built-in prompts

Generation, with the original door sheet as reference:

> Use case: style-transfer. Create production 2D pixel-art components for the exact rich carved walnut and brass door family in the supplied reference. Preserve the warm dark walnut, inset four-panel joinery, gold round doorknob, beveled post caps, wood grain and highlight quality. Render NEW clean components, not squashed or sheared copies. Fixed orthographic top-down RPG camera, axis-aligned walls, no diagonal/isometric wall perspective. SIX isolated sprites, TWO columns by THREE rows, generous transparent gutters. ROW1: two full-height rigid rectangular door leaves with no surrounding frame, first viewed directly from FRONT with brass knob on its RIGHT free edge, second the matching BACK with brass knob on its LEFT free edge. Same leaf proportions70wide×104tall, vertical sides, horizontal top/bottom. Knob physically belongs on BOTH faces of the same door. ROW2: empty WEST side-wall walnut jamb/recess and empty EAST side-wall walnut jamb/recess. Each is a long narrow vertical opening, dimensions32wide×120tall. Both outer edges are strictly vertical and top/bottom caps horizontal; NO diagonal slanted lintel, no isometric shear, no leaf in these frames. Rich carved trim and visible thickness, aligned to a perfectly vertical room side wall. The frame faces the room on right for west and left for east. ROW3: empty NORTH upright walnut doorframe/recess86wide×136tall, matching the original reference front door; and empty SOUTH cutaway threshold/frame86wide×36tall, horizontal threshold and short corner jambs viewed from above. No leaves in ANY frames; leaves in row1 will be animated separately. Dark warm plum recess in empty openings, not flat pure-black border. No black outlines around outer woodwork: use dark brown pixel edges. All sprites crisp detailed hand-pixel clusters, strongly readable at native game scale, no painted blur, no smooth vector boxes, no photoreal materials. True RGBA transparent alpha outside each isolated component. No background, checkerboard, text, labels, decorative extra objects or cast ground shadows. Canvas1536×1536.

Transparency edit of that output:

> Use case: background-extraction. Remove the entire fake gray-white checkerboard from this six-component wooden door sprite sheet, including every surrounding gutter and gaps between frame components. Return genuinely transparent RGBA alpha, no opaque backdrop or painted checkerboard. Preserve EXACTLY the walnut grain, bevels, brass knobs, carving detail, positions, size and colors of all six sprites. Do not redesign or repaint any component. Only change outside-sprite pixels to transparent alpha.
