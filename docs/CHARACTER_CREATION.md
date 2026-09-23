# Resident creation and sleepy reactions

Latest user-directed override: [ROOM_REWORK_V7.md](ROOM_REWORK_V7.md) supersedes the historical controls, observation dialogs, placement and painted-sprite details below. Current menus are centered; household editing uses direct dragging, valid tap rotations and Save layout. Characters use clean layers described in ART_RESIDENT_V7.md.


The September 21 character choices apply independently to both residents when they first join a world. They extend the existing live preview and original native sprite pipeline.

- Male or female character, at the same adult height.
- Coat, vest, tunic, dress or skirt and blouse. Every outfit is available to either character.
- Amber, moss, violet, navy, wine or cream clothing.
- Short, cropped, swept, bob, long or braided hair; chestnut, black, copper, blonde or silver.
- Fair, warm, tan, brown or deep skin tones.

The preview, walking character and sleeping expressions use the same native artwork and palette choices. Each facing retains one consistent head through all footfalls. All choices are personal saved data. Rejoining retains the existing resident instead of overwriting them with the join form. Equipment and later wardrobe changes remain future work.

Crossing a connected sleeper's side through the bed's walkable opening produces a brief annoyed expression, toss, little huff and blanket sound. The host detects the crossing and commits its counter before either phone displays it. The reaction lasts 900 ms and does not wake the resident, move their saved position, change relationships or delay morning. A three-game-minute cooldown prevents rapid repeated reactions. It follows moved beds in both bedrooms; walking elsewhere or returning to a room does not replay it. Reduced motion removes the toss while keeping the expression.

Save schema 5 adds `look`, `bedDisturbances` and `bedDisturbedAt` to each profile. Versions 1 through 4 migrate with the original male/short/chestnut/warm/coat look and zero disturbances. Existing clothing colors, progression, room layouts and daily reports remain intact. Protocol 7 requires both phones to use this update. Compact movement snapshots carry reaction state; a new dawn report forces a complete snapshot so the guest's journal and recovery mirror remain current.

The September 22 artwork gives the female resident a softly shaped, fully clothed chest, defined waist/hips and softer jaw, retaining adult height and consistent eyes. Selecting female initially suggests long hair and a skirt; male suggests short hair and a coat. Once the user explicitly picks hair or an outfit, changing the body preserves that choice. Every option remains available to either body. Existing profiles are unchanged. Skirt/dress hems sway with footfall. The texture cache key is v4; the saved appearance shape remains schema 5.
