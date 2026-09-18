# iPhone acceptance record

Status: not yet performed on physical iPhones. Browser automation is recorded separately in `VALIDATION.md` and does not close these gates.

Record the two phone models, iOS versions, network type, build commit, installation date and results. Use disposable world saves and export them before recovery experiments.

## Installation and solo play

1. Open the deployed game in Safari, add it to the Home Screen, and wait for `Ready for offline play`.
2. Launch in landscape and portrait. Check safe areas, touch targets, keyboard dismissal and the rotation message.
3. Create a resident in each world slot. Read the letter, collect the parcel, light the hearth, and export both saves to Files.
4. Close the installed app. Disconnect internet and cold-launch it. Both slots and their separate progress must load.
5. Import the backup into a disposable occupied slot. Cancel once and confirm once. Cancellation must leave progress unchanged.
6. Install a newer build. It must wait for an explicit restart at the title screen and preserve both worlds.
7. Walk into every side of the bed, desk, chest and other solid furnishings. Check scale, left/right strides, occlusion and the closer camera. No feet should enter furniture.
8. Drag from several places on the left side. Release, cancel, rotate and open inventory while holding. Movement must stop. Tap the right side near furniture and test the action choices.
9. Toggle both candles, inspect the furnishings, assign cacao to a quick slot and reload. The lights and personal quick-slot choices must persist. Review flicker and fire against the room pixel style.

## Two resident household

1. Install the same build on both phones. Start Host Co-op on phone 1 and Join Co-op on phone 2.
2. Pair with rotating QR frames in both directions. Repeat with manual codes. Deny camera access once and verify manual pairing remains usable.
3. Confirm both residents appear. Open a personal scene on one phone while the other moves. Each can discover the letter and receive exactly three beans independently.
4. Let Player 2 light the hearth. Both phones must see the change, and the shared journal recap must persist.
5. Disconnect phone 2. Continue and save on phone 1. Rejoin with phone 2, checking identity, inventory, discoveries and the newer shared world.
6. Background, lock and force-close each phone in separate runs, including immediately after a reward. Rejoin and check for duplicate rewards or lost acknowledged actions.
7. Repeat with internet disconnected while the local Wi-Fi router stays on. A reachable local network is still required. Record network isolation failures separately.
8. Restore an older host backup while keeping a newer guest mirror. The guest must refuse the stale host without erasing either copy.
9. Have either player toggle candles and use the shared chest. Race withdrawals, interrupt a transfer and reconnect. Count the total cacao across both inventories and the chest before and after; it must be conserved.

Phase 2 adds separate maps and simulation stress tests. Phase 3 adds multi-day sessions, time scale, fatigue and sleep. Do not mark those systems passed from this arrival-room checklist.
