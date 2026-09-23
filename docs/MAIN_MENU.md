# Main menu, 0.1.9

The user supplied the castle, moon and ghosts menu image and requested it as the new main menu UI. This overrides the earlier room-material title treatment. Preserve the supplied artwork and logo; do not regenerate or redesign them.

The exact JPEG is `public/art/title-menu-reference.jpg`, 1280 by 590 pixels, 215,416 bytes. SHA-256: `9b7285cb9b206381e4ae23c9335ff66739190a41883f266feda408a126005fe8`. The original attachment was named Photo 1.jpg. It is included in the verified offline package.

The scene and logo use separate CSS views of this unmodified image. A soft night-blue transition covers the image's baked controls. Real HTML buttons reproduce the blue frames and cream lettering and retain at least 44px touch height, even at 568 by 320. The art remains decorative; the title has an accessible heading and every action has a named button, keyboard focus and disabled state.

The title must have no visible rectangular backing. Its SVG color filter makes the cropped blue backdrop transparent while retaining the supplied cream lettering. Do not restore the earlier screen blend or feathered rectangle, which left a visible box around the title.

- Continue opens the two world slots; empty slots are disabled. Continue itself is disabled when neither slot contains a world.
- New Game opens the same two slots with occupied slots disabled. It never replaces an existing world. Choosing an empty slot opens the existing resident creator.
- Co-Op opens Host Co-op and Join Co-op. Host chooses a world or creates one in an empty slot; Join opens the existing pairing and resident form.
- Settings retains sound, music, motion, offline repair and help, and now contains Backups.
- Credits identifies the supplied title artwork and the game's code/content dependencies.

The existing explicit Update ready restart remains visible when an update is downloaded. Save schema 7, network protocol 9, gameplay, resident art and the supplied home-screen icon remain unchanged. Menu tests cover touch geometry, both slots, occupied-slot protection, host entry and credits; the full existing persistence, offline, recovery and co-op suites use the new navigation.
