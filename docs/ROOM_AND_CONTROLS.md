# Room and touch rework

Latest user-directed override: [ROOM_REWORK_V7.md](ROOM_REWORK_V7.md) supersedes the historical controls, observation dialogs, placement and painted-sprite details below. Current menus are centered; household editing uses direct dragging, valid tap rotations and Save layout. Characters use clean layers described in ART_RESIDENT_V7.md.


Current override: the 2026-09-21 changes in [ROOM_LAYOUT.md](ROOM_LAYOUT.md) replace inspection menus, automatic sleep, old wake scheduling and static furniture positions. Current saves use schema 3 and protocol 4. [AUDIO.md](AUDIO.md) describes original offline sound. Earlier implementation details below remain historical where they conflict.

The user's successive reviews on 2026-09-18 supersede the earlier arrival presentation. This stays within the Phase 1 correction milestone. Requested room, inventory and sleep behavior brings a limited part of later work forward without declaring those phases complete.

## Visual scale

The room uses separate floor/wall layers, furniture, residents, flames and light. Source sheets are sampled once onto a two-world-pixel grid. Residents use a 32 by 48 native frame displayed at 64 by 96 world pixels, twice the previous height relative to furniture. The camera shows 640 world pixels across, adapting its height to the screen, and follows the local resident. Each phone has its own camera.

Character creation places an animated resident beside compact name and coat fields. It uses the same poses and garment masks as the room. Moss and violet replace cloth colors while preserving face, hair, scarf, hands and boots. The accepted original resident atlas is unchanged. The preview supports reduced motion and cleans up when closed.

The title uses the room's floor/wall materials, square frames, monospaced headings and matching plum, walnut and gold colors. The game title and Select game replace the decorative taglines and welcome text. Successful offline status lives in Settings; download progress, errors, repair and explicit update controls remain available. This direct user change overrides the master's older placement of the offline-ready label.

Left-facing animation mirrors a genuine side profile. Walking poses follow distance traveled, with a brief grace period between authoritative movement updates. A blocked resident settles to idle. The earlier image and sprite sheet are retained as development history and are not loaded by the arrival scene.

`src/content/room.ts` owns each map's draw rectangles, solid footprints, depth, interaction reach and actions. Host and guest share these definitions. Collision uses feet, allowing a tall object to obscure someone standing behind it. Swept movement slides around edges. Visual interpolation also checks solids. Walls bound the walkable floor; rugs stay walkable.

Every furnishing has an interaction. The desk offers letter reading, candle tending and inspection. Books, plant, windows and table have personal discoveries. The cupboard retains its once-per-resident cacao parcel. Hearth and candles remain shared. Chest lids, cupboard doors and desk drawers animate from authoritative per-resident interaction state. They stay open while any present resident uses them and close when the last user leaves. Shared chest transfers remain atomic and replay-safe.

The bed has separate head/pillow and foreground quilt layers. Two solid rectangles leave an entry gap that follows rotation. In 0.1.8, walking into that gap has no automatic action; A from inside it offers a sleep choice. Waking places the resident on clear floor. Input held before sleep cannot move them automatically after waking. See TIME_AND_SLEEP.md for shared time, independent sleep and fatigue.

The visible exit opens on approach; A travels to a small castle landing with a working return door, windows and a stair awaiting repair. Residents can occupy these maps separately. This does not complete town, kitchen or forest exploration.

Window panes are separate from their retained frames. They follow saved world time, with misty daytime trees, gradual dawn/dusk light and seeded moonlit, drifting-light or clouded night variants. Cooking, combat and broader inventory progression remain in their planned phases.

## Controls and interface

- Drag from anywhere on the left half of the world to move. The floating stick appears only while held.
- Right-side background taps do nothing. Bottom-right A interacts or confirms a single continuation. B backs out of menus and ordinary object interactions, or interrupts sleep.
- Releasing, cancelling, opening a menu, backgrounding, resizing or leaving clears held touch input.
- WASD and arrows move. E or Space interacts. Multiple choices are directly tappable with numeric keyboard shortcuts; B stays reserved for back.
- Conversation dialogs have an explicit policy: no generic B, Escape or close-button dismissal. An authored goodbye or rude departure must resolve them. No NPC conversation content is implemented yet.
- The clock, `I` and `ESC` sit one extra 44-pixel button width left of the right safe area. Hit areas stay at least 44 pixels. Room name, chapter panel and save-status text remain removed from play.
- `I` opens inventory or unread missions. The notification dot reflects personal discoveries and mission changes.
- Seven quick slots replace the five-slot bar and three-dot button. `I` opens inventory. Slots reference owned items and never copy inventory. Assignments and selection persist per world and resident. Existing five-slot settings retain their assignments and gain two empty slots.
- Inventory contains items, missions, journal, household recap and co-op controls. Private menus block only that resident's input.
- `ESC` waits for saved or acknowledged work before returning to the title. If a guest cannot confirm an action, it keeps the existing recovery copy and explains that a fresh join is needed. It does not call that action saved.

## Save and protocol compatibility

Schema 2 explicitly migrates old world saves and backups. On entering, the authority repairs awake residents inside new solids and clears stale container menus, in a durable transaction. Sleeping residents retain their timers and bed position. It preserves identities, inventories, story and discoveries. A failed write never publishes a correction. See SAVE_MIGRATIONS.md.

Protocol 3 includes map, time, sleep and container state. Older pairing envelopes are rejected; old world saves remain supported. Movement messages are spaced and acknowledged rather than silently dropped.

## Review status

Generated art provenance is recorded in [room prompts](ART_ROOM_V2_PROMPT.md), [door and stair prompts](ART_ROOM_V3_PROMPT.md) and [resident prompts](ART_RESIDENT_V2_PROMPT.md). Current checks and outcomes belong in VALIDATION.md. Physical iPhone installation, touch comfort, WebGL performance and two-phone networking remain acceptance gates.
