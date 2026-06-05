import type { ShipState } from '@/game/battle/shipState';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Unit forward vector from yaw (Y) and pitch (X) — Star Fox flies into -Z. */
export function shipForward(ship: Pick<ShipState, 'yaw' | 'pitch'>): Vec3 {
  const cp = Math.cos(ship.pitch);
  return {
    x: Math.sin(ship.yaw) * cp,
    y: Math.sin(ship.pitch),
    z: -Math.cos(ship.yaw) * cp,
  };
}

export function addScaled(out: Vec3, dir: Vec3, scale: number): Vec3 {
  return {
    x: out.x + dir.x * scale,
    y: out.y + dir.y * scale,
    z: out.z + dir.z * scale,
  };
}

export function clampSpeed(v: Vec3, max: number): Vec3 {
  const speed = Math.hypot(v.x, v.y, v.z);
  if (speed <= max) return v;
  const s = max / speed;
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function distance3(
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
): number {
  return Math.hypot(ax - bx, ay - by, az - bz);
}
