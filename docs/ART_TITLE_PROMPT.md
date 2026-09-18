# Castle title illustration

Created 2026-09-18 with the built-in image generation tool, following the imagegen skill. No external image input was supplied. Public reference qualities were read from `docs/REFERENCE_AND_ART.md`: layered environments, warm windows against moonlight, readable silhouettes and original pixel art. No official game image or asset was copied into the generation request.

The selected file is `public/art/title-castle.png`, a 1672 by 941 PNG. The original generated output is retained outside the repository at `C:/Users/gracemc/.codex/generated_images/01a0b54a-d394-7011-85f7-9549e3f1dd34/exec-bbd74491-8bca-431f-9240-11799a61ad34.png`.

The illustration replaces the temporary geometric SVG at the title screen. It is a title illustration, not a playable map or evidence of implemented regions. The distant buildings are atmospheric scenery. The HTML title sits low on the left, leaving the roofline and lit kitchen visible; the menu stays in the right third. CSS uses nearest-neighbor image scaling and retains safe-area padding. Later art passes may refine pixel consistency and the castle's architecture as explorable rooms develop.

## Generation prompt

```text
Use case: stylized-concept.
Asset type: production title-screen background for an original cozy gothic pixel-art RPG, landscape 16:9, 1536 by 864 or wider.
Create a highly detailed, coherent original pixel-art illustration of a lived-in haunted chocolatier's hilltop castle at blue twilight. Strict hand-placed pixel appearance: crisp square pixel clusters, selective outlines, carefully shaded materials, restrained dithering, no smooth painting or blur. The scene should look like a beautiful premium 2D pixel game world, not a logo, diagram, mockup or vector illustration.
Composition: reserve the upper-left quadrant, x=6% to 46% and y=5% to 32%, as quiet deep blue-purple twilight sky with just a few stars for overlaid HTML game title. The castle itself occupies left-middle and center, x=15% to 60%, its roofline beginning around y=34%, its foot around y=75%. A crooked asymmetric gray-blue stone manor castle, one squat square tower, one narrow tall pointed turret, steep burgundy/slate roofs, dormer windows, long amber-lit kitchen windows and an inviting brass-lit arched front door. Interesting original architecture, no recognizable buildings from existing games. A winding cobbled footpath approaches from bottom left past low moss-covered walls, pots, little copper lanterns, thick ferns, bluebells, tiny pale mushrooms, autumn leaves and one cacao pod tucked in a herb basket near the gate. Dense lush old trees cradle the house; deep forest layers recede behind it. A crescent moon far above roofline near horizontal center. Rightmost third x=67% to100% is quieter shadowy indigo forest and sky to sit behind a menu, not solid blank black. Rich depth through atmospheric layering. No figures, no giant ghosts, no overt faces in castle.
Lighting: gentle moonlit edges and warm amber windows, beautiful nocturnal comfort, slight mystery beyond lamplight. Materials readable: aged stone, moss, iron fence, small carved trim, tiled roofs, glass windows. Palette slate blue, muted purple, moss green, burgundy wood with warm amber-gold light. Keep the lower foreground richly textured but not noisy.
Constraints: genuinely original art. Do not reproduce any copyrighted game screenshot, map, sprite, logo, character, UI, building layout or recognizable composition. No text, lettering, watermark or interface. No smooth gradients, airbrush glow, photorealism, 3D rendering or vector-looking geometric shapes. Detail and environmental density are essential. Keep pixel scale consistent throughout.
```

## Review

The result was visually inspected. It contains no text or UI. Its original asymmetric castle, cacao-pod crest, kitchen windows, cobbled approach and layered forest support the requested setting. Warm windows remain readable within the cool palette. The tool placed the roofline higher than requested, so the title layout was moved into the lower left instead of covering the architecture. The new asset has not been labeled a finished game map or final full-game art pass.

Browser screenshots were reviewed at 1280 by 720, 844 by 390 and 667 by 375. The compact layout was adjusted after the first 667-pixel review exposed title and menu overflow. The final compact view keeps both save slots, solo/co-op actions and utility links in view, with the castle visible beside the menu. Main actions and menu utility links retain at least 44-pixel touch height. This viewport review does not replace installed-PWA testing on a physical iPhone.
