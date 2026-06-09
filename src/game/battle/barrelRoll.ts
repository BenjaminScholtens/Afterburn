import { BATTLE_BARREL_ROLL_MS } from '@/config';

/** +1 = strafe right, -1 = strafe left. */
export type BarrelRollDirection = 1 | -1;

/** Eased roll angle for an in-progress barrel roll (radians). */
export function barrelRollAngle(
  startedAt: number,
  atMs: number,
  direction: BarrelRollDirection,
  durationMs = BATTLE_BARREL_ROLL_MS,
): number | null {
  const age = atMs - startedAt;
  if (age < 0 || age > durationMs) return null;
  const t = age / durationMs;
  const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  // Negated so bank matches strafe (right turn = right wing down).
  return -direction * eased * Math.PI * 2;
}

/** Lateral strafe envelope — peaks mid-roll, zero at start/end. */
export function barrelRollStrafeFactor(
  startedAt: number,
  atMs: number,
  durationMs = BATTLE_BARREL_ROLL_MS,
): number {
  const age = atMs - startedAt;
  if (age < 0 || age > durationMs) return 0;
  const t = age / durationMs;
  return Math.sin(Math.PI * t);
}

export function isBarrelRolling(rollEndsAt: number, atMs: number): boolean {
  return rollEndsAt > atMs;
}
