# The household rooms

Latest user-directed override: [ROOM_REWORK_V7.md](ROOM_REWORK_V7.md) supersedes the historical controls, observation dialogs, placement and painted-sprite details below. Current menus are centered; household editing uses direct dragging, valid tap rotations and Save layout. Characters use clean layers described in ART_RESIDENT_V7.md.


Current override: [CHARACTER_CREATION.md](CHARACTER_CREATION.md) defines the 0.1.5 personal appearance choices, occupied-bed reaction, save schema 5 and protocol 7. Earlier version descriptions below are historical.


This records the user's September 21 direction and overrides earlier single-room descriptions.

The living room is shared. Its left door enters Player 1's bedroom; its right door enters Player 2's bedroom. Its south (bottom) wall door reaches the landing through the landing’s north (top) wall door. Player 1’s east wall opens into the living room’s west wall; Player 2’s west wall opens into the living room’s east wall. A transition arrives beside the matching doorway, preserving this geography in both directions. Internal map ID `castle` stays Player 1's bedroom so older saved positions and furniture remain usable. The other IDs are `living`, `bedroom-2` and `landing`.

Only a bedroom's owner can rearrange its furniture. The host checks this for every placement command, including commands received from another device. Both residents can arrange the living room. A visitor can use either bedroom's lights, storage, journal and bed. Shared story progress stays shared across all rooms; personal discoveries and welcome rewards remain personal and cannot be farmed by changing bedrooms.

Every room has its own saved layout and light switches. Original shared storage remains accessible through the household chests. Opening a chest in one room does not animate an unrelated chest in another room. Doors keep clear approaches when residents arrange furniture.

Both beds have room for two residents. The host uses the left sleeping position and the guest uses the right, 54 world pixels apart. These offsets follow the bed when its owner moves it. Sleep still requires confirmation. A resident visibly settles beneath the quilt with closed eyes. The other player may remain awake and continue playing.

When everyone currently playing is asleep, the authority allows a short settling interval, then advances the shared clock to the next 06:00. A moon-to-dawn transition accompanies it. A disconnected resident does not prevent the host from sleeping. Early waking remains available through B; it cancels the all-asleep condition. Reloading during sleep preserves rest and can safely restart the short presentation interval.

Each bedroom desk has a green daily journal distinct from the sealed letter. A opens its compact bottom sheet. At dawn the world saves one report for the previous game day, split into shared milestones and each resident's own record. The initial personal fields report rest, known discoveries, known recipes and completed personal quests at dawn. These are totals, not claims of new daily gains. More daily details can be added later. Keep 60 reports; reading is repeatable and grants nothing. Empty sections honestly say no milestones were recorded.

Save schema 4 adds `roomLayouts` for the living room and second bedroom, plus `dayReports`. The existing `layout` remains the first bedroom. Protocol 5 requires both peers to run the same household update. Schema 1, 2 and 3 imports preserve identities, progression and available layouts; new rooms and reports begin empty. The master specification remains unchanged.

Acceptance must include forbidden visitor placement, allowed visitor use, two sleepers without overlapping heads, solo and paired night transitions, independent room switches, saved layout/report reload, offline reopening and actual two-device play. Desktop emulation does not replace the physical device checks.

The September 22 correction uses explicit wall/destination/counterpart descriptors for rendering, interaction, arrivals and furniture clearance. Existing furniture layouts are retained; if legacy furniture occupies a new arrival, the authority chooses the nearest safe standing position. New placements reserve the directional doorway approaches. Windows are now 104 by 160 world pixels (twice both prior dimensions), with frame and animated sky enlarged together. The north wall extends upward to contain them.
