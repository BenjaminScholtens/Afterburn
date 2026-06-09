import {
  BATTLE_ARENA_CENTER_X,
  BATTLE_ARENA_CENTER_Z,
  BATTLE_ARENA_FLOOR_Y,
  BATTLE_CRASH_COOLDOWN_MS,
  BATTLE_DOME_CRASH_DAMAGE,
  BATTLE_FLOOR_CRASH_DAMAGE,
  BATTLE_SHIP_HULL_RADIUS,
} from '@/config';
import { shipForward } from '@/game/battle/flight';
import type { ShipState } from '@/game/battle/shipState';
import type { ZoneState } from '@/game/battle/zone';

export type ArenaCollisionKind = 'floor' | 'dome';

export interface ArenaCollisionResult {
  kind: ArenaCollisionKind | null;
  crashAt: number;
  damaged: boolean;
}

/** Resolve floor + dome shell collisions; bounce the ship and apply crash damage. */
export function applyArenaCollisions(
  ship: ShipState,
  zone: ZoneState,
  lastCrashAt: number,
  now: number,
): ArenaCollisionResult {
  const floorY = BATTLE_ARENA_FLOOR_Y;
  const cx = zone.centerX;
  const cz = zone.centerZ;
  const radius = zone.radius;
  const hull = BATTLE_SHIP_HULL_RADIUS;
  let kind: ArenaCollisionKind | null = null;

  const fwd = shipForward(ship);

  if (ship.worldY - hull < floorY) {
    ship.worldY = floorY + hull;
    if (fwd.y < -0.05) {
      ship.pitch += Math.min(1.1, -fwd.y * 1.4);
    }
    kind = 'floor';
  }

  const dx = ship.worldX - cx;
  const dy = ship.worldY - floorY;
  const dz = ship.worldZ - cz;
  const dist = Math.hypot(dx, dy, dz);

  if (dy >= -hull * 0.5 && dist + hull > radius) {
    const inv = dist > 0.001 ? 1 / dist : 0;
    const nx = dx * inv;
    const ny = dy * inv;
    const nz = dz * inv;
    const pen = dist + hull - radius;
    ship.worldX -= nx * pen;
    ship.worldY -= ny * pen;
    ship.worldZ -= nz * pen;

    const fwdAfter = shipForward(ship);
    const impact = fwdAfter.x * nx + fwdAfter.y * ny + fwdAfter.z * nz;
    if (impact > 0.05) {
      ship.pitch -= impact * 0.55;
      ship.yaw += (Math.random() - 0.5) * impact * 0.12;
    }
    kind = kind ?? 'dome';
  }

  if (!kind) {
    return { kind: null, crashAt: lastCrashAt, damaged: false };
  }

  if (now - lastCrashAt < BATTLE_CRASH_COOLDOWN_MS) {
    return { kind, crashAt: lastCrashAt, damaged: false };
  }

  const damage = kind === 'floor' ? BATTLE_FLOOR_CRASH_DAMAGE : BATTLE_DOME_CRASH_DAMAGE;
  ship.hp = Math.max(0, ship.hp - damage);
  return { kind, crashAt: now, damaged: true };
}

export function arenaCenterY(): number {
  return BATTLE_ARENA_FLOOR_Y;
}

export function defaultArenaCenter(): { x: number; y: number; z: number } {
  return {
    x: BATTLE_ARENA_CENTER_X,
    y: BATTLE_ARENA_FLOOR_Y,
    z: BATTLE_ARENA_CENTER_Z,
  };
}
