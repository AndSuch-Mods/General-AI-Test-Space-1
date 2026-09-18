# Room objects and rendering, third revision

Built-in image generation produced `public/art/room-v3-doors-stairs.png` on 2026-09-18. The selected source is `exec-f2c402eb-b295-4b80-8b3a-c3a2e6739abd.png` in the tool's generated-images directory. The 1024 × 1536 RGBA source was copied into the project without altering the file.

The source PNG is 1,701,880 bytes. SHA-256: `92f73136929e7f47cba448c149355708a81b9fd73ed25e45362fcc8a28284aac`.

The renderer consumes the matching closed/open door pair and stone stair sprite. Alternative open furniture in the same source sheet is not used because it changes the established furniture design. Chest, cupboard and desk opening animations instead separate and move parts of the existing original sprites, preserving their identity.

An earlier atlas was rejected because it painted a checkerboard instead of supplying transparent alpha. That output is not a production asset. The selected source has actual zero-alpha corners and gutters. At native-texture creation, faint matte pixels below alpha 192 become transparent; surviving cutout pixels become opaque. This keeps the two-world-pixel edge grid clear. The open doorway has a separate dark pixel interior behind its hinged leaf, so the wall cannot show through.

## Selected generation prompt

```text
Use case: stylized-concept
Asset type: original transparent pixel-art RPG furnishing sprite atlas, six isolated assets in strict 2 columns by 3 rows grid. Use a dark walnut, burgundy, muted blue-gray, brass palette. This new sheet has NO rooms or background. True transparent alpha, generous clear margins, no labels.
Top row: LEFT a tall CLOSED walnut castle room door with dark brass latch and simple heavy stone frame; RIGHT the SAME door fully OPEN, visible hinged walnut leaf along left jamb and a dark passable doorway with no wall behind it. Same size, same threshold baseline.
Middle row: LEFT a wooden iron-banded chest now OPEN, lid lifted toward the back, dark interior, no treasure, same straight-on three-quarter perspective; RIGHT a tall walnut pantry cupboard now OPEN at its two lower doors, jars remain upper shelves, no new contents.
Bottom row: LEFT a writing desk with its two small center-side drawers visibly pulled out, same desktop and proportions, no paper or candle; RIGHT a compact short flight of five worn blue-gray stone stairs leading down toward the viewer, enough width for one adult, plain wood banister on the right, no doorway, no context.
Top-down three-quarter orthographic RPG viewpoint, fronts face viewer; no isometric diamond grid. Doors native40x66 pixels each, chest44x30, cupboard47x68, desk53x36, stairs64x68. Visibly enlarged nearest-neighbor crisp square pixel clusters. Detail is 16-bit pixel RPG density, no one-pixel microtexture below this intended grid, no smooth painting or antialiasing. Restrained palette about32 colors. No lighting glows, no gradients, no painted shadow outside silhouettes. Original designs only. Leave every individual sprite separated and fully visible.
CRITICAL OUTPUT: provide actual transparent RGBA alpha. Do NOT paint any checkerboard pattern. The background is completely absent, zero-alpha. No white, gray or colored background pixels.
```

## Renderer changes

- Every environment native pixel now covers two world pixels. The floor, wall materials, furniture, flames, window view and resident share that density.
- Resident source frames remain 32 × 48 native pixels and display at 64 × 96. The renderer uses the same clothing-only palette pipeline as the creation menu.
- The bedroom and castle landing each construct their own depth-sorted visual layer. Residents on another map are hidden. A return door leads to the same room; the stair does not claim that further castle regions are implemented.
- The bed is split at world y264. Headboard and pillow render behind a sleeping resident; the quilt and footboard render in front. Authority owns the entry strip, sleep state, wake time and collision.
- Chest lids lift, cupboard leaves swing outward and desk drawers pull forward over a short 240ms visual transition. Active same-map interaction state controls these animations.
- Door leaves open when a resident approaches their interaction area. The door action changes the actual authoritative map.
- Windows retain the original trim and drapes, but their interior pixels come from the shared world clock. Daylight changes the sky and room ambience gradually. Daytime mist and tree silhouettes remain visible. Seeded night variants show moonlight, drifting lights or clouded skies.
- Candle and hearth switches still control their animated flames and warm light. Reduced motion stops decorative cycling and uses immediate container poses.

The door/stair atlas and earlier generated art are original project assets. No copyrighted game artwork was copied. Rendering helpers are `room-textures.ts` and `room-windows.ts`; measured regions remain in `room-atlas.ts`. These replace neither the authoritative room geometry nor the world clock.

## Review

Reviewed Chromium landscape screenshots at 844 × 390 for resident scale, the two-pixel environment grid, approach-opening doors, visible window changes and actual travel to the landing. Lint and TypeScript passed after integration. Full browser regressions and physical iPhone acceptance remain recorded separately in the project validation documents.
