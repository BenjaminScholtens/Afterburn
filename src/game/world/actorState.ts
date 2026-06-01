import { ACTOR_STATE_BYTES } from '@/config';

/** Push direction bitfield flags (byte 16). */
export const PUSH_N = 1;
export const PUSH_S = 2;
export const PUSH_E = 4;
export const PUSH_W = 8;

export interface ActorPose {
  worldX: number;
  worldY: number;
  pushFlags: number;
}

export function encodeActorState(pose: ActorPose): string {
  const buf = new ArrayBuffer(ACTOR_STATE_BYTES);
  const view = new DataView(buf);
  view.setFloat64(0, pose.worldX, true);
  view.setFloat64(8, pose.worldY, true);
  view.setUint8(16, pose.pushFlags & 0xff);
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function decodeActorState(stateBase64: string): ActorPose | null {
  try {
    const binary = atob(stateBase64);
    if (binary.length < 17) return null;
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const view = new DataView(bytes.buffer);
    return {
      worldX: view.getFloat64(0, true),
      worldY: view.getFloat64(8, true),
      pushFlags: view.getUint8(16),
    };
  } catch {
    return null;
  }
}

export function pushFlagsToVector(flags: number): { x: number; y: number } {
  let x = 0;
  let y = 0;
  if (flags & PUSH_E) x += 1;
  if (flags & PUSH_W) x -= 1;
  if (flags & PUSH_S) y += 1;
  if (flags & PUSH_N) y -= 1;
  return { x, y };
}

export function computeEdgePushFlags(
  worldX: number,
  worldY: number,
  viewportX: number,
  viewportY: number,
  viewportW: number,
  viewportH: number,
  margin: number,
): number {
  const localX = worldX - viewportX;
  const localY = worldY - viewportY;
  let flags = 0;
  if (localY <= margin) flags |= PUSH_N;
  if (localY >= viewportH - margin) flags |= PUSH_S;
  if (localX <= margin) flags |= PUSH_W;
  if (localX >= viewportW - margin) flags |= PUSH_E;
  return flags;
}

export function computeNetPush(poses: ActorPose[]): { x: number; y: number } {
  if (poses.length === 0) return { x: 0, y: 0 };
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  for (const p of poses) {
    if (p.pushFlags === 0) continue;
    const v = pushFlagsToVector(p.pushFlags);
    sumX += v.x;
    sumY += v.y;
    count++;
  }
  if (count === 0) return { x: 0, y: 0 };
  return { x: sumX / count, y: sumY / count };
}
