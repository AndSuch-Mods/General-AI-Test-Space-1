# Household corrections, 0.1.11

The latest user direction preserves the approved north-wall door, all open leaves, furniture designs and water effect. No broader redesign is part of this batch.

- Side frames follow the vertical room wall as narrow edge-on casings, using existing walnut grain. Closed leaves show straight edges, without compressed front panels or diagonal posts. The north door is unchanged. South frame height drops from 18 to 9 native pixels; its leaf and hardware geometry are unchanged.
- Stand up through a continuous position and sprite-anchor transition. Keep residents above furniture until the transition ends, using the nearest clear floor directly in front of the selected seat. No intermediate position behind the chair.
- Sofa cushion centers are -27/+27 world pixels. Center slot 1 is for sitting alone. A newcomer makes a center resident scoot to the opposite cushion with an annoyed reaction and short shuffle. An occupied side cushion stays occupied; the newcomer takes the other side. All four orientations use the same authoritative rule.
- Gas burners use tapered jets with violet bases and warm cream/amber tips. Preserve stove and sink art.

## Hearth source and permission

The user rejected the synthetic popcorn-like pops. Recorded wood-fire ambience replaces that sound; no extra pop scheduler runs after loading. The earlier rain candidate remains archived. Music and other household cues are unchanged.

Source: [Fireplace wood crackling by Sadiquecat](https://freesound.org/people/Sadiquecat/sounds/707262/), October 28, 2023. The source page explicitly dedicates the recording to [CC0](https://creativecommons.org/publicdomain/zero/1.0/). Packaged preview: https://cdn.freesound.org/previews/707/707262_5287430-hq.mp3, stored as public/audio/wood-fire-cc0.mp3. In-game credits identify author and license. This is licensed recorded ambience, not an original field recording.

Processing trims ends, controls level/transients, removes DC and blends the loop seam. Loading is asynchronous and never blocks gesture unlock or music. Mute, destruction, room changes and suspension remain authoritative. The recording is included in the offline package. If loading/decoding fails, local synthesis remains available with its pitched thump removed.

Build/protocol 0.1.11/11. No save migration or content phase. Personal progress, layout permissions and two-player authority remain intact.
