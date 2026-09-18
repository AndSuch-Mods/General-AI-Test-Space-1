# Resident movement art, revision 2

Created 2026-09-18 with the built-in image-generation tool. No existing game's art was used as an input.

Saved asset: `public/art/residents-v2.png`.

- PNG dimensions: 1182 × 1330.
- Size: 761,798 bytes.
- SHA-256: `219358d84902c0514389b2aa5d6ef84bed19a554f864102d0dde1095b47bcb49`.
- Empty alpha: 68.6% of image pixels. The accepted source has actual transparency.
- Twelve original source poses: four each for down, right and up. Left mirrors the right profile. The right contact poses have opposite arm swing and leg shading; the front and back poses alternate their leading foot.
- Source rectangles are measured individually in `src/game/art/resident-atlas.ts`, each 248 × 372. Every crop aligns its soles at y=370. Display target is 32 × 48 logical pixels, sampled once with nearest-neighbor filtering by the renderer.
- The walk helper uses distance traveled instead of global animation time. It returns idle immediately when movement stops, including when collision prevents a step.

The character is a castle resident with short brown hair, amber scarf, umber coat and satchel. Mirroring also reverses the visible satchel side. Later individualized outfits can use separate directional equipment layers. This revision addresses readable four-direction walking and room scale; it does not complete the final character animation set for combat, cooking or fishing.

Two earlier editing attempts baked a checkerboard into their background and were rejected. They are not consumed by the game. The final accepted image was generated afresh with the prompt below.

## Exact final prompt

```text
Original RPG sprite sheet on TRUE TRANSPARENT ALPHA background. Produce production game sprite art, not a painting, with12 poses in a4columns x3rows matrix.

Resident: short brown hair, amber scarf, brown short coat, simple satchel strap, dark trousers, brown boots. Cozy mysterious castle resident, adult. Exactly the same character and same scale in every pose. Limited earthy 20-color pixel palette. STRICT low resolution pixel art, 32x48 pixels per sprite enlarged8x so everypixel is8x8square. Very simple large clean shading shapes. No tiny hair or fabric details. Hard opaque jagged pixel edges. NO blur or antialiasing. No backdrop, no checkerboard, no black square, no shadow, no numbers or words, no ground.

ROW1 four poses all facing viewer DOWN.
ROW2 four poses all facing RIGHT in pure side profile, one eye, visible nose to the RIGHT.
ROW3 four poses all face AWAY/UP, no visible face.

Four columns depict one complete gait, consistent anchor at midpoint of soles:
Column1: idle stance or passing pose, two legs together, arms down.
Column2: FIRST CONTACT wide stride. Near lighter leg angled FORWARD RIGHT for side pose. Near arm swings BACK toward LEFT. Far darker leg angled back.
Column3: passing pose, feet crossed below waist, one heel lifted, arms passing torso.
Column4: OPPOSITE CONTACT wide stride. Near lighter leg angled BACK LEFT for side pose. Near arm swings FORWARD RIGHT. Far darker leg angled forward right.

For front/back rows columns2 and4 show opposite left/right foot forward with clear alternating arm swings. For right row cols2 and4 show visually different arm silhouettes and near/far-leg shading. Real WALK animation. Center pelvis at exactlysamexineachcell, allsolesaligned. Transparent emptyspace around everycharacter, fullbody visible. ALL PIXELS LARGE CHUNKY SQUARES as authentic32x48spriteart. Original design, no existing game assets or characters.
```

