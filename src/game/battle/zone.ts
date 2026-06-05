import {
  BATTLE_ARENA_CENTER_X,
  BATTLE_ARENA_CENTER_Z,
  BATTLE_INITIAL_ZONE_RADIUS,
  BATTLE_MATCH_MS,
  BATTLE_MIN_ZONE_RADIUS,
} from '@/config';

export interface ZoneState {
  centerX: number;
  centerZ: number;
  radius: number;
  elapsedMs: number;
  remainingMs: number;
}

/** Shared match clock — all clients shrink the zone on the same timeline. */
export function getMatchStartMs(now = Date.now()): number {
  return Math.floor(now / BATTLE_MATCH_MS) * BATTLE_MATCH_MS;
}

export function getZoneState(now = Date.now()): ZoneState {
  const start = getMatchStartMs(now);
  const elapsed = now - start;
  const t = Math.min(1, elapsed / BATTLE_MATCH_MS);
  const radius =
    BATTLE_INITIAL_ZONE_RADIUS +
    (BATTLE_MIN_ZONE_RADIUS - BATTLE_INITIAL_ZONE_RADIUS) * t;
  return {
    centerX: BATTLE_ARENA_CENTER_X,
    centerZ: BATTLE_ARENA_CENTER_Z,
    radius,
    elapsedMs: elapsed,
    remainingMs: Math.max(0, BATTLE_MATCH_MS - elapsed),
  };
}

export function distanceToZoneEdge(
  x: number,
  z: number,
  zone: ZoneState,
): number {
  const dx = x - zone.centerX;
  const dz = z - zone.centerZ;
  return zone.radius - Math.hypot(dx, dz);
}
