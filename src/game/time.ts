import { DEFAULT_TIME, type Player, type World } from './model';
import { BED_EXIT, BED_REST, objectOffset, safePosition, type RoomLayout } from '../content/room';
export const SLEEP_RULES = { minimumMinutes: 8 * 60, morningMinute: 6 * 60, eveningMinute: 18 * 60, terminalMinutes: 12 * 60 };
export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night' | 'late-night';
export function gameMinutes(realSeconds: number, secondsPerGameMinute = DEFAULT_TIME.secondsPerGameMinute) {
  if (!Number.isFinite(realSeconds) || realSeconds < 0 || !Number.isFinite(secondsPerGameMinute) || secondsPerGameMinute <= 0) throw Error('Invalid clock input');
  return realSeconds / secondsPerGameMinute;
}
export function clockLabel(totalMinutes: number) {
  const minute = Math.floor(totalMinutes) % 1440;
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
}
export function dayPhase(totalMinutes: number): DayPhase {
  const minute = totalMinutes % 1440;
  return minute < 300 ? 'late-night' : minute < 420 ? 'dawn' : minute < 1080 ? 'day' : minute < 1200 ? 'dusk' : 'night';
}
export function daylight(totalMinutes: number) {
  const minute = totalMinutes % 1440;
  if (minute < 300 || minute >= 1200) return 0;
  if (minute < 420) return (minute - 300) / 120;
  if (minute < 1080) return 1;
  return (1200 - minute) / 120;
}
export function nightVariant(world: Pick<World, 'seed' | 'clock'>): 'moonlit' | 'drifting-lights' | 'clouded' {
  const day = Math.floor((world.clock.totalMinutes - 360) / 1440);
  const value = ((world.seed + day) % 3 + 3) % 3;
  return (['moonlit', 'drifting-lights', 'clouded'] as const)[value];
}
export function nextWakeMinute(now: number) {
  const time = now % 1440;
  const morning = Math.floor(now / 1440) * 1440 + SLEEP_RULES.morningMinute + (time >= SLEEP_RULES.morningMinute ? 1440 : 0);
  return morning;
}
export function startSleep(player: Player, minute: number, layout: RoomLayout = {}) {
  const offset = objectOffset('bed', layout);
  Object.assign(player, { map: 'castle', x: BED_REST.x + offset.x, y: BED_REST.y + offset.y, interaction: null });
  Object.assign(player.fatigue, { sleeping: true, sleepStartedAt: minute, wakeAt: nextWakeMinute(minute) });
}
export function energyCap(player: Player) {
  const fatigue = player.fatigue;
  return fatigue.consecutiveAllNighters < 5 ? Math.max(20, 100 - 20 * fatigue.consecutiveAllNighters) : Math.max(0, 20 * (1 - fatigue.terminalMinutes / SLEEP_RULES.terminalMinutes));
}
export function wakePlayer(player: Player, minute: number, layout: RoomLayout = {}) {
  if (!player.fatigue.sleeping) return;
  const slept = Math.max(0, minute - player.fatigue.sleepStartedAt!);
  if (minute >= player.fatigue.wakeAt! || slept >= SLEEP_RULES.minimumMinutes) {
    player.fatigue.consecutiveAllNighters = 0; player.fatigue.terminalMinutes = 0; player.energy = 100;
  } else player.energy = Math.min(energyCap(player), player.energy + slept / 8);
  Object.assign(player.fatigue, { sleeping: false, sleepStartedAt: null, wakeAt: null });
  const offset = objectOffset('bed', layout);
  Object.assign(player, { map: 'castle', ...safePosition({ x: BED_EXIT.x + offset.x, y: BED_EXIT.y + offset.y }, 'castle', layout) });
}
/** Advances only present residents. Absent profiles accrue no new fatigue. */
export function advanceWorldClock(world: World, minutes: number, activeIds: readonly string[]) {
  if (!Number.isFinite(minutes) || minutes < 0) throw Error('Invalid clock advancement');
  const start = world.clock.totalMinutes, end = start + minutes;
  for (const id of activeIds) {
    const player = world.players[id];
    if (!player) continue;
    let cursor = start;
    // Segment at sunrise so the fifth-night pressure starts at the correct minute.
    while (cursor < end) {
      if (player.fatigue.sleeping) {
        if (player.fatigue.wakeAt! > end) break;
        cursor = Math.max(cursor, player.fatigue.wakeAt!);
        wakePlayer(player, player.fatigue.wakeAt!, world.layout);
        if (cursor >= end) break;
      }
      const sunrise = (Math.floor((cursor - SLEEP_RULES.morningMinute) / 1440) + 1) * 1440 + SLEEP_RULES.morningMinute;
      const stop = Math.min(end, sunrise);
      if (player.fatigue.consecutiveAllNighters >= 5) {
        const remaining = SLEEP_RULES.terminalMinutes - player.fatigue.terminalMinutes;
        if (stop - cursor >= remaining) {
          player.fatigue.terminalMinutes = SLEEP_RULES.terminalMinutes;
          player.energy = 0; startSleep(player, cursor + remaining, world.layout);
          // Collapse recovery is personal; the other resident can remain active.
          cursor += remaining;
          continue;
        }
        player.fatigue.terminalMinutes += stop - cursor;
      }
      if (stop === sunrise) player.fatigue.consecutiveAllNighters += 1;
      player.energy = Math.min(player.energy, energyCap(player));
      cursor = stop;
    }
  }
  world.clock.totalMinutes = end;
}
export function fatigueMessage(player: Player) {
  const nights = player.fatigue.consecutiveAllNighters;
  return nights >= 5 ? 'The hallway seems to sway when you stop walking. You need real sleep.' : nights >= 4 ? 'Even the castle ghosts are giving you worried looks.' : nights >= 2 ? 'Your hands feel a little too heavy today.' : nights === 1 ? 'You catch yourself staring at the candle long after it stopped flickering.' : '';
}
