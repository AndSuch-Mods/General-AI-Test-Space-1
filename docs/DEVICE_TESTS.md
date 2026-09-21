# iPhone acceptance record

Status: not yet performed on physical iPhones. Browser automation is recorded separately in `VALIDATION.md` and does not close these gates.

Record the two phone models, iOS versions, network type, build commit, installation date and results. Use disposable world saves and export them before recovery experiments.

## Installation and solo play

1. Open the deployed game in Safari, add it to the Home Screen, and check Settings for `Ready for offline play`.
2. Launch in landscape and portrait. Check safe areas, touch targets, keyboard dismissal and the rotation message.
3. Create a resident in each world slot. Read the letter, collect the parcel, light the hearth, and export both saves to Files.
4. Close the installed app. Disconnect internet and cold-launch it. Both slots and their separate progress must load.
5. Import the backup into a disposable occupied slot. Cancel once and confirm once. Cancellation must leave progress unchanged.
6. Install a newer build. It must wait for an explicit restart at the title screen and preserve both worlds.
7. Walk into every solid side of the bed, desk and chest. The pillow/cover entry gap is the deliberate bed exception. Check adult scale, left/right strides and occlusion.
8. Drag from several places on the left side. Release, cancel, rotate and open inventory while holding. Movement must stop. Right-side background taps must do nothing. Test A, B and direct action choices with the same thumb.
9. Change coat colors in character creation and compare the live preview with the actual resident. Assign cacao to slot seven and reload. Toggle candles, open/close chest, cupboard and desk. Review their motion and the fire against the room's pixel grid.
10. Enter the bed from each side. The resident must appear beneath the quilt before waking on clear floor. Check sunrise, foggy daytime and night windows. Solo time must pause in menus. B during the brief rest transition must get up without clearing deep fatigue.
11. Use the room exit, save/reload on the landing, and return. Check the 44-pixel inset HUD and seven-slot bar on small landscape phones and around safe areas. Record actual WebGL frame rate and thermal behavior.

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
10. Send one resident to the landing while the other stays in the room. They must disappear from each other's map and reappear on return. Opening a container on one phone must animate it on the other when both are in the room.
11. Put one resident to bed while the other moves and uses a menu. Time must continue normally. B wakes only the sleeping resident. Put both to bed and verify the shared wake time and personal energy/fatigue. Save/rejoin during rest, and drop an awake guest while the host sleeps.

The current correction milestone brings a room/landing connection and basic time/rest forward. Phase 2 still adds town/forest and simulation stress; Phase 3 still requires multi-day device runs and broader health/schedule integration. Do not mark those phases complete from this checklist.

## 0.1.3 additions

Verify music starts only after a gesture and resumes after phone suspension without duplicate layers. Listen to music, wood/paper sounds, footsteps and hearth crackles; check both saved audio switches offline. Check letter/candle targeting, hearth off/on, bottom sheets and completed opening-before-menu order. Enter the lower bed gap, decline, re-enter and confirm; try before dawn and during daytime. Arrange every furnishing with touch, cancel a preview, reconnect after placement, and race the same piece on two phones. Confirm neither player can obstruct a doorway or occupied bed. Review the repaired eye, walnut thresholds and candle occlusion on device.
