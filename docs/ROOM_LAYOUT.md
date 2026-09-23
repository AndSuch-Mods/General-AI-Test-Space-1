# Room arrangement and direct interaction, 0.1.3

Latest user-directed override: [ROOM_REWORK_V7.md](ROOM_REWORK_V7.md) supersedes the historical controls, observation dialogs, placement and painted-sprite details below. Current menus are centered; household editing uses direct dragging, valid tap rotations and Save layout. Characters use clean layers described in ART_RESIDENT_V7.md.


**Current override:** HOUSEHOLD_ROOMS.md defines the 0.1.4 room permissions, separate layouts, two-person beds, dawn reports, save schema 4 and protocol 5. Earlier single-room descriptions below are historical.

The user's 2026-09-21 review overrides earlier inspection menus, automatic sleep and minimum-eight-hour wake scheduling. This is a household life game. A performs the nearby item's action directly. It does not open an examination chooser. The letter and desk candle have separate positions and reachable targets. Reading and sleep choices use small bottom sheets over the quickbar. Ordinary light switches produce animation and sound without dialogue.

Inventory > Household > Arrange room opens the furnishing selector. Choose a piece, use the existing left stick or arrow keys to position its outlined preview, A places it and B cancels. The resident stays still while arranging. The preview remains local until the host accepts placement. Invalid positions show a short reason beside the controls. No furniture is removed from the save while being carried.

Bed, desk, bedside table, bookshelf, pantry, chest, both candles, carpet and plant can move. The letter travels with its desk. Candles travel with their original supporting furniture until separately placed. They can sit on a suitable furnishing or clear floor. The fireplace, windows and doors are structural. The walnut doors meet the wall skirting and use the room's wood palette.

The host validates bounds, solid overlap, resident occupancy, doorway clearance and reachable approaches. Occupied beds and containers cannot move. Shared placements include the expected previous offset to reject competing stale edits. Existing per-resident action sequences reject retries. Save failure rolls back the whole placement. Disconnected guests keep a mirrored copy; reconnect receives the authoritative layout.

World schema 3 adds a typed shared layout of original-furnishing offsets. Schema 1 and 2 imports migrate explicitly without changing household identity, inventories or discoveries. Protocol 4 carries placements through authoritative snapshots. Collisions, actions, flames, attached objects and depth use the same resolved layout as rendering.

Opening containers first commits interaction state, plays sound and finishes its visible animation, then opens the bottom sheet. Closing removes the sheet before clearing the resident's interaction and animating the lid closed. A second resident still using the container keeps it open. The UI waits on rendered poses rather than assuming a timer finished the animation.

Walking into the wider bed opening at y288-316 offers a sleep choice. A near the bed offers the same choice. Declining leaves the resident awake. Confirmed rest ends at the next 06:00 regardless of bedtime, with the normal host-owned clock. Reaching the chosen morning completes rest. Early B interruption preserves fatigue unless eight game hours were actually slept. One co-op sleeper does not advance time for someone still awake.

The down-facing native sprite pipeline repairs the right-eye cluster after reducing the original atlas. Both preview and world rendering use that same correction. Candle flames have their furnishing's depth instead of a room-wide foreground layer.

Original music and material sounds are described in AUDIO.md. Existing physical iPhone acceptance gates remain open.
