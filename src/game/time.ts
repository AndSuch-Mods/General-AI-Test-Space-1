import { DEFAULT_TIME } from './model';
export function gameMinutes(realSeconds: number, secondsPerGameMinute = DEFAULT_TIME.secondsPerGameMinute) {
  if (!Number.isFinite(realSeconds) || realSeconds < 0 || !Number.isFinite(secondsPerGameMinute) || secondsPerGameMinute <= 0) throw Error('Invalid clock input');
  return realSeconds / secondsPerGameMinute;
}
export function clockLabel(totalMinutes: number) {
  const minute = Math.floor(totalMinutes) % 1440;
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
}
