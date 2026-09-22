# Household rework, September 22

This user-directed revision overrides earlier room, menu and appearance notes. The master remains intact. Read this document before changing these systems.

- Replace patched character customization with clean male/female bases, authored skin palettes and compatible hair, clothing and pose layers. Keep saved choices and a consistent adult scale.
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
