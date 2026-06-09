import * as THREE from 'three';
import type { ShipState } from '@/game/battle/shipState';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _forward = new THREE.Vector3();

/**
 * Unit forward vector — matches playerRig YXZ rotation with nose along local -Z.
 */
export function shipForward(ship: Pick<ShipState, 'yaw' | 'pitch'>): Vec3 {
  _euler.set(ship.pitch, ship.yaw, 0, 'YXZ');
  _forward.set(0, 0, -1).applyEuler(_euler);
  return { x: _forward.x, y: _forward.y, z: _forward.z };
}

/** True when the ship is past 90° — belly toward the sky (inverted). */
export function isShipInverted(pitch: number): boolean {
  const p = ((pitch % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return p > Math.PI / 2 + 0.1 && p < Math.PI * 1.5 - 0.1;
}

/** Nearest level-flight pitch (multiple of 2π). */
export function nearestUprightPitch(pitch: number): number {
  const twoPi = Math.PI * 2;
  return Math.round(pitch / twoPi) * twoPi;
}

/** Gentle pull toward upright when stuck inverted. Returns updated pitch. */
export function applyInvertRecovery(
  pitch: number,
  invertedMs: number,
  delayMs: number,
  rate: number,
  dt: number,
): number {
  if (invertedMs < delayMs) return pitch;
  const target = nearestUprightPitch(pitch);
  const delta = target - pitch;
  if (Math.abs(delta) < 0.015) return target;
  const step = rate * dt;
  return pitch + Math.sign(delta) * Math.min(Math.abs(delta), step);
}

/** Prevent runaway float drift on marathon loops. */
export function tamePitch(pitch: number): number {
  const twoPi = Math.PI * 2;
  if (Math.abs(pitch) <= twoPi * 6) return pitch;
  return pitch % twoPi;
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
