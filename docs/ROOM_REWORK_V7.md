# Household rework, September 22

This user-directed revision overrides earlier room, menu and appearance notes. The master remains intact. Read this document before changing these systems.

## Current polish override, 0.1.8

Walking into or through the bed opening never opens a prompt. A while inside that opening asks whether to sleep. The authority rejects sleep from outside it. Crossing a sleeping resident remains an uninterrupted playful disturbance. Other actions require close physical reach, with separate letter, journal and candle targets; the window area and neighboring props must not activate the journal.

The seven-slot bar defaults to the bottom. Near the south camera limit it moves to the upper left, clear of the clock and I/ESC. It stays there through small reversals and returns only after about five movement steps north. Do not move it during a held slot touch; room transitions reset its default. Keep all seven slots and their 44-pixel touch targets.

Use a consistent 0.6 projected floor Y scale for turning furniture, while vertical height remains upright. Keep original fronts, materials and design unchanged. Match rotated collision, attachments, seats and bed layers. Straighten the side-door perspective to the wall; hold each doorframe fixed while the leaf opens. Day mist and night variants must visibly animate inside the existing glass without painting over the frame or mullions.

Fire should sit below the music, with restrained warm, irregular crackles and little wind-like noise. Retain gesture unlock, toggles, offline audio and saved mute settings. This pass adds no content counts or new game phase. Existing saves and both residents must survive the geometry update.

## Art preservation correction

The user rejected the first v7 artwork pass. Its procedural replacements lowered the detail and changed approved designs. That development checkpoint must not be published as the accepted revision.

Preserve the exact existing bed, desk, nightstand, bookshelf, pantry, chest, window, carpet and other approved furniture designs and their rendering quality. `public/art/room-v2-props.png` and the original room materials remain the art sources. Add directional views and animation states to those designs. Do not replace them with simpler shapes or a different style. Only the couch, armchair and doors were requested to receive new designs, and these must match the approved artwork. New entry-hall and kitchen assets must meet the same quality.

The original resident in `public/art/residents-v2.png` remains the character identity and style reference. Extract a compatible base by removing interchangeable hair, clothing and accessories. Build matching layers and a female base with natural attachment points. Do not replace the original with a different, lower-detail character design or paint mismatched patches over a finished clothed sprite. Keep the same facial appearance across walking frames. Review the assets at their actual game scale before accepting them.

Keep the functional room, input, menu, persistence, co-op and audio improvements while correcting the art. The published v6 build remains unchanged until the corrected artwork and required checks are ready.

## Functional requirements

- Replace patched character customization with clean male/female bases derived from the approved resident, authored skin palettes and compatible hair, clothing and pose layers. Keep saved choices and a consistent adult scale.
- Use one exact window aperture for sky clipping and frame art. Space the two north-wall windows evenly. Center all doors in their walls, with separate directional artwork and opposite-wall connections.
- Walking into an open doorway changes rooms without A. Input changes facing even when collision prevents travel.
- Enforce landscape orientation during title, creation, menus and gameplay, including over native modal dialogs.
- Center functional menus and use most of the screen. Remove generic observation dialogues. Keep actual letters, journals, inventories, recipes and necessary choices.
- Household design opens the room itself. Drag furniture with a finger; clamp its preview to the room. Overlap is allowed while dragging, with green/red placement outlines and no collision-error prose. Tap to rotate only if valid. Save layout at bottom right commits the complete draft atomically. Cancel restores the saved layout.
- All listed furniture has four upright directional views. Rotate ground geometry and access points, not the bitmap. Container opening, attached desk objects, bed access and sleep poses follow orientation. Sofa/chair support sitting; occupied furniture cannot be rearranged.
- Keep shared-room editing and private-bedroom ownership authoritative. Reject competing stale layout saves, persist rotations, and replicate facing/seating/layout changes. Preserve earlier saves and backups.
- Replace the landing's stairs with a furnished main entry hall. Its east door leads into a distinct basic kitchen with open space for future equipment. Both are shared household rooms. Existing landing save IDs remain valid.
- Replace click-like fire audio with continuous, softly varied fire ambience and restrained crackles.

Implementation decisions: clockwise quarter turns 0/1/2/3 face south/west/north/east. A furniture footprint rotates on the ground while its vertical elevation stays upright. New player facing/seating and layout rotations use schema 6 and protocol 8. Existing customization identifiers remain compatible. The kitchen is a usable household room with stove, sink and recipe worktop; this does not claim the later cooking progression is complete.

Acceptance includes four-direction geometry and art review, all character layers and skin tones, blocked-facing movement, doorway round trips without A, portrait interruption during creation, touch drag/clamping/invalid-drop/cancel/save, rotation at boundaries, occupied furniture, two-person seating/rest, stale guest layout rejection, migrations, save/reload, offline launch and both browser engines. Physical two-iPhone acceptance remains open.
