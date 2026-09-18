# technical architecture

Source requirements below are preserved verbatim from the master specification. They describe the target game, not a claim of implemented functionality. See ROADMAP.md and IMPLEMENTATION_STATUS.md for current evidence. User instructions take precedence over the master.

## 5. Recommended technical stack

Use a stable, boring stack rather than a clever one.

Recommended baseline:

- TypeScript.
- Vite.
- Phaser 3, using the latest stable Phaser 3 release available at implementation time unless a newer Phaser major version is demonstrably mature and safer.
- WebGL renderer with Canvas fallback only where practical.
- IndexedDB for save data and persistent settings.
- Dexie or a similarly small IndexedDB wrapper if it meaningfully reduces error-prone code.
- Service worker for offline application shell and asset-pack caching.
- A PWA manifest with standalone display and landscape orientation.
- Vitest for unit tests.
- Playwright for browser integration tests, including WebKit.
- GitHub Actions for build/test/deploy.
- GitHub Pages for the initial deployment if it satisfies the user's privacy requirements.

Avoid a heavy React-style application shell unless it solves a real problem. The game should own the screen. Standard DOM overlays are fine for login, install/update status, accessibility dialogs, and text-heavy menus.

Use a clear domain-oriented architecture instead of putting the entire game in one scene.

Suggested structure:

```text
/
  AGENTS.md
  README.md
  ROADMAP.md
  CHANGELOG.md
  docs/
    DESIGN.md
    CONTENT_PIPELINE.md
    SAVE_FORMAT.md
    OFFLINE_AND_SAVES.md
    MULTIPLAYER.md
    TEST_PLAN.md
  public/
    manifest.webmanifest
    icons/
  src/
    app/
    game/
      scenes/
      systems/
      entities/
      components/
      world/
      input/
      rendering/
      audio/
    content/
      items/
      recipes/
      npcs/
      dialogue/
      quests/
      enemies/
      loot/
      locations/
    persistence/
    networking/
    multiplayer/
    pwa/
    ui/
    utils/
  tools/
    asset-pipeline/
    content-validation/
  tests/
```

Do not let the directory structure become ceremony. Add folders when the code actually needs them.

---

## 6. Performance budget

Target a stable 60 FPS on a modern iPhone in ordinary gameplay.

Design for:

- 60 FPS target.
- Graceful 30 FPS fallback if thermal or battery conditions require it.
- Low garbage generation inside the update loop.
- Object pooling for particles, damage text, common enemies, and projectiles.
- Texture atlases rather than hundreds of independent image files.
- Chunked maps.
- Culling of off-screen entities.
- Limited dynamic lights.
- Precomputed or tile-based collision where possible.
- Audio voice limits.
- No network calls during gameplay after offline installation.
- No runtime dependency on an LLM or cloud service.

Provide a developer FPS/debug overlay behind a settings flag.

Test memory pressure by moving repeatedly between major zones for at least 20 minutes. Watch for retained textures, duplicated audio buffers, runaway event listeners, and save objects that grow without bounds.

---

## 7. Display, camera, and pixel-art rules

Use a fixed logical world scale and integer-aligned rendering wherever possible.

Recommended starting point:

- 32 px logical world tiles.
- Player roughly 32×48 logical pixels, with room to revise after visual tests.
- Four-direction movement initially.
- Eight-direction aim/combat may be added without requiring eight-direction walking sprites.
- Pixel-art nearest-neighbor scaling.
- Camera eased slightly, but do not introduce float shimmer into pixel sprites.
- No blurry CSS scaling.

The game must handle the iPhone's wide landscape aspect ratio and safe areas. Do not assume a simple 16:9 rectangle.

Use:

- CSS `env(safe-area-inset-*)`.
- A central world viewport with UI adapting to wider screens.
- No critical button under a notch, Dynamic Island, or home indicator.
- A manifest orientation hint for landscape.
- A friendly rotate-device overlay in portrait because iOS browser APIs do not always permit programmatic orientation locking.

Touch targets should be comfortably large. Let the user move or resize the on-screen controls later.

---

## 41. Content/data architecture

Gameplay content should be data-driven enough that new content can be added without rewriting systems.

Use typed schemas for:

- items
- recipes
- buffs
- enemies
- loot tables
- NPCs
- schedules
- dialogue
- quests
- maps/locations
- shops
- crafting recipes

Validate content at build time.

Fail builds on:

- duplicate IDs
- missing references
- impossible item references
- dialogue pointing to nonexistent NPCs
- invalid quest transitions
- malformed loot tables

Do not store executable code in save files.

---

