# reference and art

Source requirements below are preserved verbatim from the master specification. They describe the target game, not a claim of implemented functionality. See ROADMAP.md and IMPLEMENTATION_STATUS.md for current evidence. User instructions take precedence over the master.

## 3. Public reference basis

At project start, re-check the current public material before making visual or design decisions. Treat all public material as reference only.

Useful official references known when this file was written:

- Official site: `https://www.hauntedchocolatier.net/`
- Official FAQ: `https://www.hauntedchocolatier.net/faq/`
- Official screenshots page: `https://www.hauntedchocolatier.net/media/`
- Official early gameplay post: `https://www.hauntedchocolatier.net/2021/10/08/hello-world/`
- Official shield/combat post: `https://www.hauntedchocolatier.net/2021/10/30/combat-shields-stuns-my-approach/`
- Official chocolate-making discussion: `https://www.hauntedchocolatier.net/2025/05/10/intuitive-chocolate-making/`
- Official 2026 development posts discussing recipe-book iteration and ongoing development.

High-level traits worth studying:

- Top-down/three-quarter pixel-art presentation.
- Dense, hand-authored environments with strong silhouettes.
- Darker interiors and wilderness balanced by warm pools of light.
- Rich autumnal, nocturnal, wintry, brown, blue, purple, green, and amber palettes.
- Large environmental landmarks that make areas memorable.
- Character sprites that remain legible against detailed backgrounds.
- Cozy domestic interiors contrasted with strange or magical spaces.
- Action-RPG combat with readable enemy tells.
- Shields/off-hand equipment as a deliberate combat choice.
- Chocolate and ingredient gathering as major progression systems.
- Town life and NPC relationships as a core pillar, not a side mode.

Do not trace or pixel-copy screenshots. Do not reproduce official characters, maps, portraits, logos, UI, music, or dialogue.

---

## 8. Art direction

The visual brief is "cozy gothic moonlight," not horror and not bright farm-country.

Core principles:

- Environments are detailed and layered.
- Silhouettes remain readable.
- Lamps, fireplaces, shop windows, candles, moonlight, glowing fungus, and magic create warm/cool contrast.
- Interiors lean toward aged wood, burgundy fabric, brass, stone, faded wallpaper, apothecary glass, books, carved trim, and old ironwork.
- Forests are deep and lush rather than empty.
- Night should be beautiful, not merely dark.
- Use localized light and subtle atmospheric particles to make nighttime exploration desirable.
- Town areas feel lived-in.
- Avoid generic "asset pack" composition.

Pixel-art requirements:

- All final shipped art must be original.
- Do not upscale low-detail placeholder art and call it final.
- Characters need enough layering and animation to feel expressive.
- Named NPCs require portraits with expression variants.
- Enemies need silhouettes that distinguish variants before the player reads a name label.
- Important interactables need animation or lighting cues rather than floating UI markers everywhere.

Portrait expression baseline for named NPCs:

- neutral
- happy
- amused
- annoyed
- angry
- sad
- worried
- surprised
- blush/romantic

Portraits may share a common framing system, but facial features, hair, clothing, posture, and color accents must be character-specific.

If high-quality original artwork cannot be produced in the first implementation pass, use clearly marked original placeholder art and keep the asset pipeline replaceable. Do not block systems work waiting for perfect sprites.

---

## 9. Audio direction

All music and sound effects must be original or generated from assets with clear permission.

Music target:

- Light but nocturnal.
- Melodic rather than oppressive.
- Chamber textures, celesta-like tones, plucked strings, warm keys, bass clarinet/bassoon-like colors, restrained percussion, soft pads, and occasional music-box textures are appropriate.
- Combat music should become rhythmically active without turning into unrelated metal/action music.
- Town music should remain welcoming.
- The castle should sound old, safe, and mysterious.
- Wilderness at night should feel magical and alert.

Create separate themes or adaptive layers for:

- castle/home
- town day
- town night
- forest day
- forest dusk/night
- ruins/crypt
- combat
- boss encounters
- romance events
- chocolate-making/kitchen
- rain/storm ambience

Do not copy melodic material from *Stardew Valley* or *Haunted Chocolatier*.

If a complete soundtrack is not practical in the first pass, build an audio system with original short loops and ambience that can later be replaced without code changes.

---

