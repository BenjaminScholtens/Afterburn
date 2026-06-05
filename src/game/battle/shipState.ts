import { ACTOR_STATE_BYTES } from '@/config';
import type { ActorPose } from '@/game/world/actorState';

export interface ShipState {
  worldX: number;
  worldY: number;
  worldZ: number;
  yaw: number;
  pitch: number;
  hp: number;
  alive: boolean;
  kills: number;
}

/** @deprecated Use yaw — kept for transitional reads */
export function shipYaw(ship: ShipState): number {
  return ship.yaw;
}

export function shipStateToPose(ship: ShipState): ActorPose {
  return { worldX: ship.worldX, worldY: ship.worldZ, pushFlags: ship.alive ? 1 : 0 };
}

export function encodeShipState(ship: ShipState): string {
  const buf = new ArrayBuffer(ACTOR_STATE_BYTES);
  const view = new DataView(buf);
  view.setFloat64(0, ship.worldX, true);
  view.setFloat32(8, ship.worldY, true);
  view.setFloat32(12, ship.worldZ, true);
  view.setFloat32(16, ship.yaw, true);
  view.setFloat32(20, ship.pitch, true);
  view.setUint8(24, Math.max(0, Math.min(255, Math.round(ship.hp))));
  view.setUint8(25, ship.alive ? 1 : 0);
  view.setUint8(26, Math.max(0, Math.min(255, ship.kills)));
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function decodeShipState(stateBase64: string): ShipState | null {
  try {
    const binary = atob(stateBase64);
    if (binary.length < 17) return null;
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const view = new DataView(bytes.buffer);

    if (binary.length >= 27) {
      return {
        worldX: view.getFloat64(0, true),
        worldY: view.getFloat32(8, true),
        worldZ: view.getFloat32(12, true),
        yaw: view.getFloat32(16, true),
        pitch: view.getFloat32(20, true),
        hp: view.getUint8(24),
        alive: view.getUint8(25) === 1,
        kills: view.getUint8(26),
      };
    }

    // Legacy 2D blob from older clients
    const legacyY = view.getFloat64(8, true);
    return {
      worldX: view.getFloat64(0, true),
      worldY: 0,
      worldZ: legacyY,
      yaw: view.getFloat32(16, true),
      pitch: 0,
      hp: binary.length > 20 ? view.getUint8(20) : 100,
      alive: binary.length > 21 ? view.getUint8(21) === 1 : true,
      kills: binary.length > 22 ? view.getUint8(22) : 0,
    };
  } catch {
    return null;
  }
}
