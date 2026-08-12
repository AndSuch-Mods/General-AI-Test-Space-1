    const STORAGE_KEY = 'cm2109-commissioning-checklist-v1';

    const sectionMeta = {
      power: { name: 'Power Test', short: 'Power', subtitle: 'Energize and prove the panel / POINT I/O before PLC changes.' },
      parts: { name: 'Parts Installation', short: 'Parts', subtitle: 'Small field hardware items still to install.' },
      programming: { name: 'Programming', short: 'PLC', subtitle: 'Primary workstream — get CM2109 safely online and operational.', priority: 'Primary' },
      hmi: { name: 'HMI', short: 'HMI', subtitle: 'Secondary workstream — download the completed MER and field-verify the screens.', priority: 'Secondary' }
    };

    const tasks = [
      // POWER TEST
      { id:'p01', section:'power', group:'Before energizing', title:'Clean the CM2109 control panel and remove sand, debris, loose wire scraps, and tools.', note:'Do this before applying power.' },
      { id:'p02', section:'power', group:'Before energizing', title:'Confirm the control-power feed and Ethernet cable are installed and landed.', note:'Existing plan allows Ethernet from CM2113 AENTR port 2; use the installed field path.' },
      { id:'p03', section:'power', group:'Before energizing', title:'Visually re-check breakers, fuses, terminal blocks, 107PS, 111ENET/AENTR, 115FPD, and all nine I/O module positions against the drawings.', note:'Wiring was checked previously; this is the final pre-power review.' },
      { id:'p04', section:'power', group:'Initial power-up', title:'Energize control power and confirm the expected control-transformer secondary voltage is present.', note:'Stop if the measured supply does not match the panel design.' },
      { id:'p05', section:'power', group:'Initial power-up', title:'Verify 107PS powers up and produces stable 24 VDC.', note:'Confirm both supply input and 24 VDC output before relying on POINT I/O or prox devices.' },
      { id:'p06', section:'power', group:'Initial power-up', title:'Verify the hardwired E-stop / Reset circuit operates 132CR correctly.', note:'E-stop must drop the circuit; Reset must restore it only when the safety chain is healthy.' },
      { id:'p07', section:'power', group:'Initial power-up', title:'Verify the POWER ON pilot light and all intended control-power branch breakers remain healthy after energizing.' },
      { id:'p08', section:'power', group:'POINT I/O', title:'Verify the 1734-AENTR, 1734-FPD, six 1734-IA4 modules, and three 1734-OA4 modules power up with no unexpected fault indication.', code:'Slot 0 AENTR • Slots 1–6 IA4 • Slots 7–9 OA4' },
      { id:'p09', section:'power', group:'POINT I/O', title:'Set the CM2109 1734-AENTR IP address to 192.168.1.35.', note:'Make the address persistent using the normal site method.', code:'CM2109 = 192.168.1.35' },
      { id:'p10', section:'power', group:'POINT I/O', title:'Power-cycle the AENTR and confirm 192.168.1.35 remains assigned.' },
      { id:'p11', section:'power', group:'POINT I/O', title:'Confirm the laptop can ping / browse the CM2109 AENTR at 192.168.1.35 through the installed Ethernet path.' },
      { id:'p12', section:'power', group:'Field-device power', title:'Verify Core Box Closed, Mandrel Down, Blow Head Up, and Mandrel Up proximity switches have power and usable indication.' },
      { id:'p13', section:'power', group:'Field-device power', title:'Verify the Blow Head Down proximity switch has power and usable indication.' },
      { id:'p14', section:'power', group:'Field-device power', title:'Verify panel pushbuttons / selectors and pendant stations are physically intact and ready for I/O checkout.', note:'Do not rely on logic yet; the detailed bit checkout is in Programming.' },

      // PARTS INSTALLATION — exact user list
      { id:'i01', section:'parts', title:'Install Push Button Cover.' },
      { id:'i02', section:'parts', title:'Install Pendant Replacement Contact.' },
      { id:'i03', section:'parts', title:'Install Left and Right Push Button Labels.' },
      { id:'i04', section:'parts', title:'Install the three Push Button Guards.' },

      // PROGRAMMING
      { id:'g01', section:'programming', group:'Protect the running system', title:'Upload / back up the current running Core Room PLC before making CM2109 changes.', note:'Keep the original untouched.' },
      { id:'g02', section:'programming', group:'Protect the running system', title:'Open the experimental CM2109 ACD offline in Studio 5000 v32.', note:'If Studio accepts it, immediately Save As to a new Studio-written ACD, close it, and reopen it.' },
      { id:'g03', section:'programming', group:'Protect the running system', title:'Run Verify Controller on the Studio-written copy and resolve every error before any download.', note:'If the experimental ACD is rejected, use the supported CoreMachine2109.L5X + CM2109_New_Tags.csv fallback instead.' },
      { id:'g04', section:'programming', group:'I/O configuration', title:'Confirm the CM2109 adapter is configured at 192.168.1.35 with chassis size 10.', code:'0=AENTR • 1–6=IA4 • 7–9=OA4' },
      { id:'g05', section:'programming', group:'I/O configuration', title:'Confirm all CM2109 physical I/O tags cross-reference to the intended slot/channel mapping and current wire-number map.', note:'24 inputs + 12 outputs; active HMI I/O points are 01–36.' },
      { id:'g06', section:'programming', group:'Core routine', title:'Confirm / import the 76 CM2109 operating and HMI-support tags and the 37-rung CoreMachine2109 routine.' },
      { id:'g07', section:'programming', group:'Core routine', title:'Confirm JSR(CoreMachine2109,0) is immediately after the existing CoreMachine2113 JSR in MainRoutine.' },
      { id:'g08', section:'programming', group:'Core routine', title:'Verify CM2109 mode / selector design points.', note:'Auto/Manual = Core Box Temp contacts; TJ/MJ = Hold Core Box Closed SSW; Hi-Fire logic is direct.' },
      { id:'g09', section:'programming', group:'Core routine', title:'Verify Stop/Abort is normally open and true only while pressed; physical Reset remains hardwired only.' },
      { id:'g10', section:'programming', group:'Core routine', title:'Verify Blow Head Down pushbutton remains mapped as future use, dedicated ONS BOOLs are used, and old toggle_Bits / shared one-shot dependencies are absent.' },
      { id:'g11', section:'programming', group:'Core routine', title:'Verify Manual and Automatic pilot-light outputs map to slot 9 channels 2 and 3 and follow the mode bits.' },
      { id:'g12', section:'programming', group:'Download gate', title:'Re-run Verify Controller, confirm no unresolved module / tag errors, and only then download the approved project.', note:'Do not download an unverified experimental ACD.' },
      { id:'g13', section:'programming', group:'Download gate', title:'Go online after download and verify CM2109 AENTR and all I/O modules are connected with no module fault.' },

      { id:'g14', section:'programming', group:'Live input checkout', title:'Checkout Slot 1 inputs: Core Box Closed, Mandrel Down, Blow Head Up, Mandrel Up proxes.', code:'CM2109:1:I.0–I.3' },
      { id:'g15', section:'programming', group:'Live input checkout', title:'Checkout Slot 2 inputs: Stop/Abort, future Blow Head Down PB, Core Box Open PB, Core Box Close PB.', code:'CM2109:2:I.0–I.3' },
      { id:'g16', section:'programming', group:'Live input checkout', title:'Checkout Slot 3 inputs: Mandrel Down PB, Mandrel Up PB, Exhaust PB, Blow Head Up PB.', code:'CM2109:3:I.0–I.3' },
      { id:'g17', section:'programming', group:'Live input checkout', title:'Checkout Slot 4 inputs: Core Box High Fire, Mandrel High Fire, Manual, Automatic selectors.', code:'CM2109:4:I.0–I.3' },
      { id:'g18', section:'programming', group:'Live input checkout', title:'Checkout Slot 5 inputs: Blow Head Down prox, Blow Sand PB, Left Start PB, Right Start PB.', code:'CM2109:5:I.0–I.3' },
      { id:'g19', section:'programming', group:'Live input checkout', title:'Checkout Slot 6 inputs: TJ/MJ selector, Sand Fill PB, Spare Input 1, Spare Input 2.', code:'CM2109:6:I.0–I.3' },

      { id:'g20', section:'programming', group:'Safe output checkout', title:'Safely checkout Slot 7 outputs: Close Core Box, Open Core Box, Mandrel Down, Mandrel Up solenoids.', note:'Keep personnel clear and use the site’s safe commissioning method before commanding motion.', code:'CM2109:7:O.0–O.3' },
      { id:'g21', section:'programming', group:'Safe output checkout', title:'Safely checkout Slot 8 outputs: Blow Valve, Blow Head Up, Core Box High Fire, Mandrel High Fire solenoids.', code:'CM2109:8:O.0–O.3' },
      { id:'g22', section:'programming', group:'Safe output checkout', title:'Safely checkout Slot 9 outputs: Exhaust Valve, Sand Fill, Manual pilot light, Automatic pilot light.', code:'CM2109:9:O.0–O.3' },
      { id:'g23', section:'programming', group:'Machine operation', title:'Run a controlled manual-function checkout and confirm each commanded movement reaches the expected proof / prox state.', note:'Correct any swapped I/O, reversed logic, or field-device issue before automatic operation.' },
      { id:'g24', section:'programming', group:'Machine operation', title:'Verify dual cycle-start inputs and Stop/Abort behavior during a controlled cycle test.' },
      { id:'g25', section:'programming', group:'Machine operation', title:'Run the first complete automatic CM2109 cycle and verify mode lights, sequence progression, timers, prox proofs, and final return state.' },

      { id:'g26', section:'programming', group:'Product / production integration', title:'Add / verify 3-inch product acknowledgement for CM2113 and CM2109 in RobotCommsCM2112.', code:'.10 = 3-inch • .0 = new-selection handshake' },
      { id:'g27', section:'programming', group:'Product / production integration', title:'Add / verify CM2109 Core_Tracking count and product reporting logic.', note:'CM2109 count increments from Auto + Open Core Box Sol rising edge; reporting code 7 = 3-inch.' },
      { id:'g28', section:'programming', group:'Product / production integration', title:'Add / verify CM2109 daily-history FFL/FFU and PPH logic in ProductionCounters.', note:'Reuse the shared date-change trigger and Pulse_15_sec; do not duplicate shared month/day math.' },
      { id:'g29', section:'programming', group:'Data concentrator — dependency gate', title:'Before changing the WORD message length, confirm receiver 10.0.100.14 has Data_Words_From_CoreRm sized for at least 120 elements.', note:'Do not change DC_MSG_Word_Control to 120 until this is confirmed.' },
      { id:'g30', section:'programming', group:'Data concentrator — offline edits', title:'When the offline window is approved, resize CoreProdToFTTM DINT[10] → DINT[12] and finish CM2109 / CM2113 3-inch FTTM staging.' },
      { id:'g31', section:'programming', group:'Data concentrator — offline edits', title:'Resize Data_Words_to_DC DINT[100] → DINT[120] and add CM2109 history / PPH / current-hour packing.', code:'100–109 history • 110–117 PPH • 118 current hour • 119 spare' },
      { id:'g32', section:'programming', group:'Data concentrator — offline edits', title:'Map CM2109 current count / product / mode into existing Data_DINT_to_DC spare positions.', code:'[10] count • [11] product • [54].0 Auto • [54].1 Manual' },
      { id:'g33', section:'programming', group:'Data concentrator — validation', title:'After the receiver is ready, change DC_MSG_Word_Control Number Of Elements 100 → 120 and verify MSG .ER/.DN behavior plus remote values.' },

      // HMI — MER is completed beforehand; tomorrow is download + field verification only
      { id:'hf01', section:'hmi', group:'Download', title:'Download the completed CM2109 MER to the physical HMI and start the new runtime.', note:'Confirm the terminal accepts the file and the application starts without a runtime-load error.' },
      { id:'hf02', section:'hmi', group:'Communications', title:'Confirm the HMI has live [CoreRoom] communications to the updated PLC.', note:'No communication-error placeholders or stale values on the CM2109 screens.' },
      { id:'hf03', section:'hmi', group:'Screen verification', title:'From MAIN, verify the 2109 Core Machine Overview button opens CM2109_Settings and the Manual / Automatic / Off indication follows the PLC.' },
      { id:'hf04', section:'hmi', group:'Screen verification', title:'Verify CM2109_Settings displays correctly and all intended live values / indicators populate.', note:'Check status, timer values, mode, current counts, PPH/current-hour information, and machine-state indicators.' },
      { id:'hf05', section:'hmi', group:'Screen verification', title:'Verify the writable controls on CM2109_Settings operate correctly.', note:'Test Cure, Blow, Exhaust, and Sand Fill timer setpoints plus HMI Reset; confirm each writes only to the intended PLC tag.' },
      { id:'hf06', section:'hmi', group:'I/O and product verification', title:'Open the CM2109 I/O screen and verify the 36 active I/O points display and change correctly during the field checkout.', note:'Confirm the I/O menu navigation, addresses/descriptions, input indications, and output indications match the machine.' },
      { id:'hf07', section:'hmi', group:'Final verification', title:'Verify product selection and production displays, then watch one complete machine cycle from the HMI.', note:'Confirm 3-inch selection works end-to-end, Total Cores / Production History values are sensible, navigation has no broken links, and live status follows the machine throughout the cycle.' }
    ];

    const sectionOrder = ['parts','power','programming','hmi'];
