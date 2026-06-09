import { ACTOR_STATE_BYTES } from '@/config';
import type { ActorPose } from '@/game/world/actorState';

export interface ShipState {
  worldX: number;
  worldY: number;
  worldZ: number;
  yaw: number;
  pitch: number;
  /** Visual bank angle (radians) — full barrel roll syncs over UDP. */
  roll: number;
  hp: number;
  alive: boolean;
  kills: number;
  /** Stable browser color id — replicated over UDP for consistent rival hues. */
  colorId?: string;
}

const COLOR_ID_BYTES = 36;
const ROLL_OFFSET = 27;
const COLOR_ID_OFFSET = 31;
const SHIP_STATE_WIRE_BYTES = COLOR_ID_OFFSET + COLOR_ID_BYTES;

/** @deprecated Use yaw — kept for transitional reads */
export function shipYaw(ship: ShipState): number {
  return ship.yaw;
}

export function shipStateToPose(ship: ShipState): ActorPose {
  return { worldX: ship.worldX, worldY: ship.worldZ, pushFlags: ship.alive ? 1 : 0 };
}

function writeColorId(view: DataView, offset: number, colorId?: string): void {
  const raw = (colorId ?? '').slice(0, COLOR_ID_BYTES);
  for (let i = 0; i < COLOR_ID_BYTES; i++) {
    view.setUint8(offset + i, i < raw.length ? raw.charCodeAt(i) : 0);
  }
}

function readColorId(bytes: Uint8Array, offset: number): string | undefined {
  if (bytes.length < offset + COLOR_ID_BYTES) return undefined;
  let end = offset + COLOR_ID_BYTES;
  while (end > offset && bytes[end - 1] === 0) end--;
  if (end <= offset) return undefined;
  return String.fromCharCode(...bytes.slice(offset, end));
}

export function encodeShipState(ship: ShipState, colorId?: string): string {
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
  view.setFloat32(ROLL_OFFSET, ship.roll, true);
  writeColorId(view, COLOR_ID_OFFSET, colorId ?? ship.colorId);
  const bytes = new Uint8Array(buf, 0, SHIP_STATE_WIRE_BYTES);
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

    if (binary.length >= COLOR_ID_OFFSET) {
      return {
        worldX: view.getFloat64(0, true),
        worldY: view.getFloat32(8, true),
        worldZ: view.getFloat32(12, true),
        yaw: view.getFloat32(16, true),
        pitch: view.getFloat32(20, true),
        hp: view.getUint8(24),
        alive: view.getUint8(25) === 1,
        kills: view.getUint8(26),
        roll: binary.length >= SHIP_STATE_WIRE_BYTES ? view.getFloat32(ROLL_OFFSET, true) : 0,
        colorId:
          binary.length >= SHIP_STATE_WIRE_BYTES
            ? readColorId(bytes, COLOR_ID_OFFSET)
            : readColorId(bytes, ROLL_OFFSET),
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
      roll: 0,
      hp: binary.length > 20 ? view.getUint8(20) : 100,
      alive: binary.length > 21 ? view.getUint8(21) === 1 : true,
      kills: binary.length > 22 ? view.getUint8(22) : 0,
    };
  } catch {
    return null;
  }
}
