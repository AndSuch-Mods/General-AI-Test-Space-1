/** Archived, unused former fire texture. Retained as a possible future rain bed.
 * No production module imports this file; it does not ship in the active bundle.
 * Original synthesis by this project, preserved without retuning.
 */
export const ARCHIVED_RAIN_PLAYBACK = { gain: .07, highPass: 145, lowPass: 1450, loopStart: .35, loopEnd: 7.3, fadeIn: 1.3, fadeOut: .45 };

export function archivedRainCandidate(context: AudioContext) {
    let seed = 0x6e6d6265;
    const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
    // A restrained band of warm combustion texture, without sub-bass wind,
    // broadband hiss or slow gust-shaped modulation. Crackles carry its identity.
    const rate = 24000, duration = 7.3, length = Math.round(rate * duration);
    const buffer = context.createBuffer(2, length, rate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let low = 0, mid = 0;
      for (let i = 0; i < length; i++) {
        const white = random() * 2 - 1;
        low = low * .975 + white * .025; mid = mid * .86 + white * .14;
        data[i] = (mid - low) * .42 + low * .07;
      }
      // Fold the tail into the head across 350 ms. Both ends then have the same
      // samples and slope, so the loop has no discontinuity or periodic pop.
      const overlap = Math.round(rate * .35), start = length - overlap;
      const first = data.slice(0, overlap);
      for (let i = 0; i < overlap; i++) {
        const blend = .5 - .5 * Math.cos(i / (overlap - 1) * Math.PI);
        data[start + i] = data[start + i] * (1 - blend) + first[i] * blend;
      }
      let mean = 0;
      for (let i = 0; i < length; i++) mean += data[i];
      mean /= length;
      for (let i = 0; i < length; i++) data[i] -= mean;
    }
    return buffer;
  }

