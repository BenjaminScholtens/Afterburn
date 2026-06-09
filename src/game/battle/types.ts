import type { ShipState } from '@/game/battle/shipState';

export const EVENT_FIRE = 1;
export const EVENT_HIT = 2;
export const EVENT_DESTROY = 3;

export interface RemoteShip {
  uuid: string;
  ship: ShipState;
  color: string;
  /** Local monotonic time of last pose update (performance.now()). */
  lastSeenAt?: number;
  /** Previous sample for velocity extrapolation. */
  prevShip?: ShipState;
  prevSeenAt?: number;
  positionSource?: 'udp' | 'relay';
  /** Last accepted UDP sequence (uint8, wraps). */
  lastSequence?: number;
  lastServerMs?: number;
  prevServerMs?: number;
  /** Maps performance.now() → server epoch for symmetric interpolation. */
  serverClockOffset?: number;
}

export interface Projectile {
  id: string;
  ownerUuid: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  bornAt: number;
}

export interface FireEventPayload {
  id: string;
  ownerUuid: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

export interface HitEventPayload {
  projectileId: string;
  targetUuid: string;
  damage: number;
  /** World-space impact point for shield VFX. */
  x?: number;
  y?: number;
  z?: number;
}

export interface DestroyEventPayload {
  targetUuid: string;
  x: number;
  y: number;
  z: number;
}

/** Ship destruction burst — visible to all pilots in the sector. */
export interface ShipExplosion {
  id: string;
  targetUuid: string;
  x: number;
  y: number;
  z: number;
  color: string;
  startedAt: number;
}

/** Brief shield bubble shown when a ship absorbs a laser hit. */
export interface HitFlash {
  projectileId: string;
  targetUuid: string;
  x: number;
  y: number;
  z: number;
  startedAt: number;
}

export interface BattleSceneSnapshot {
  localUuid: string;
  localColor: string;
  localShip: ShipState;
  remoteShips: RemoteShip[];
  projectiles: Projectile[];
  hitFlashes: HitFlash[];
  explosions: ShipExplosion[];
  zone: import('@/game/battle/zone').ZoneState;
  throttle: number;
  tick: number;
}
