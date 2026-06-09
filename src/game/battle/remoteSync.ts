import type { ShipState } from '@/game/battle/shipState';
import type { RemoteShip } from '@/game/battle/types';

export interface WorldPoint {
  x: number;
  y: number;
  z: number;
}

const POSITION_JUMP = 180;
const MAX_DISPLAY_LEAD_MS = 180;
const MAX_HIT_LEAD_MS = 120;
const MIN_SAMPLE_SPAN_MS = 6;

function lerp3(
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  t: number,
): WorldPoint {
  return {
    x: ax + (bx - ax) * t,
    y: ay + (by - ay) * t,
    z: az + (bz - az) * t,
  };
}

/** True when incoming is ahead of last on the uint8 sequence ring. */
export function isSeqNewer(incoming: number, last: number | undefined): boolean {
  if (last === undefined) return true;
  const diff = (incoming - last + 256) % 256;
  return diff > 0 && diff < 128;
}

export function shouldApplyRemoteUpdate(
  prev: RemoteShip | undefined,
  seq: number,
  serverMs?: number,
): boolean {
  if (!prev || prev.lastSequence === undefined) return true;
  if (isSeqNewer(seq, prev.lastSequence)) return true;
  if (
    serverMs != null &&
    prev.lastServerMs != null &&
    serverMs > prev.lastServerMs + 5
  ) {
    return true;
  }
  return false;
}

function displayTimelineMs(remote: RemoteShip, atMs: number): number {
  if (remote.serverClockOffset != null) {
    return atMs + remote.serverClockOffset;
  }
  return atMs;
}

function velocityFromSamples(
  prev: ShipState,
  next: ShipState,
  spanMs: number,
): { vx: number; vy: number; vz: number } {
  const spanSec = spanMs / 1000;
  if (spanSec < 0.008) {
    return { vx: 0, vy: 0, vz: 0 };
  }
  return {
    vx: (next.worldX - prev.worldX) / spanSec,
    vy: (next.worldY - prev.worldY) / spanSec,
    vz: (next.worldZ - prev.worldZ) / spanSec,
  };
}

/**
 * Smoothed networked position for radar and 3D rendering.
 * Uses server timestamps when available so both clients extrapolate symmetrically.
 */
export function remoteDisplayPoint(
  remote: RemoteShip,
  atMs = performance.now(),
): WorldPoint {
  const { ship, lastSeenAt, prevShip, prevSeenAt, lastServerMs, prevServerMs } = remote;
  const latest = { x: ship.worldX, y: ship.worldY, z: ship.worldZ };
  const displayMs = displayTimelineMs(remote, atMs);

  if (
    lastServerMs != null &&
    prevServerMs != null &&
    prevShip &&
    prevServerMs < lastServerMs
  ) {
    const span = lastServerMs - prevServerMs;
    if (span >= MIN_SAMPLE_SPAN_MS) {
      const elapsed = displayMs - prevServerMs;
      const t = elapsed / span;
      if (t <= 1) {
        return lerp3(
          prevShip.worldX,
          prevShip.worldY,
          prevShip.worldZ,
          ship.worldX,
          ship.worldY,
          ship.worldZ,
          t,
        );
      }

      const overMs = displayMs - lastServerMs;
      const leadMs = Math.min(MAX_DISPLAY_LEAD_MS, Math.max(0, overMs));
      if (leadMs > 0) {
        const { vx, vy, vz } = velocityFromSamples(prevShip, ship, span);
        const leadSec = leadMs / 1000;
        return {
          x: ship.worldX + vx * leadSec,
          y: ship.worldY + vy * leadSec,
          z: ship.worldZ + vz * leadSec,
        };
      }
      return latest;
    }
  }

  if (!lastSeenAt || !prevShip || !prevSeenAt || prevSeenAt >= lastSeenAt) {
    return latest;
  }

  const span = lastSeenAt - prevSeenAt;
  if (span < MIN_SAMPLE_SPAN_MS) {
    return latest;
  }

  const elapsed = atMs - prevSeenAt;
  const t = elapsed / span;
  if (t <= 1) {
    return lerp3(
      prevShip.worldX,
      prevShip.worldY,
      prevShip.worldZ,
      ship.worldX,
      ship.worldY,
      ship.worldZ,
      t,
    );
  }

  const overMs = atMs - lastSeenAt;
  const leadMs = Math.min(MAX_DISPLAY_LEAD_MS, Math.max(0, overMs));
  if (leadMs <= 0) {
    return latest;
  }

  const { vx, vy, vz } = velocityFromSamples(prevShip, ship, span);
  const leadSec = leadMs / 1000;

  return {
    x: ship.worldX + vx * leadSec,
    y: ship.worldY + vy * leadSec,
    z: ship.worldZ + vz * leadSec,
  };
}

/** Slight extra lead for hit tests only. */
export function extrapolateRemotePoint(
  remote: RemoteShip,
  atMs = performance.now(),
): WorldPoint {
  const base = remoteDisplayPoint(remote, atMs);
  const { ship, lastSeenAt, prevShip, prevSeenAt, lastServerMs, prevServerMs } = remote;

  let spanMs = 0;
  if (
    lastServerMs != null &&
    prevServerMs != null &&
    prevShip &&
    prevServerMs < lastServerMs
  ) {
    spanMs = lastServerMs - prevServerMs;
  } else if (lastSeenAt && prevSeenAt && prevShip && prevSeenAt < lastSeenAt) {
    spanMs = lastSeenAt - prevSeenAt;
  }
  if (spanMs < 20 || !prevShip) {
    return base;
  }

  const displayMs = displayTimelineMs(remote, atMs);
  const sampleMs = lastServerMs ?? lastSeenAt ?? atMs;
  const extraLeadMs = Math.min(
    MAX_HIT_LEAD_MS,
    Math.max(0, displayMs - sampleMs - MAX_DISPLAY_LEAD_MS),
  );
  if (extraLeadMs <= 0) {
    return base;
  }

  const { vx, vy, vz } = velocityFromSamples(prevShip, ship, spanMs);
  const leadSec = extraLeadMs / 1000;

  return {
    x: base.x + vx * leadSec,
    y: base.y + vy * leadSec,
    z: base.z + vz * leadSec,
  };
}

function positionDelta(a: ShipState, b: ShipState): number {
  return Math.hypot(a.worldX - b.worldX, a.worldY - b.worldY, a.worldZ - b.worldZ);
}

export function distancePointToSegment(
  px: number,
  py: number,
  pz: number,
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
): number {
  const abx = bx - ax;
  const aby = by - ay;
  const abz = bz - az;
  const apx = px - ax;
  const apy = py - ay;
  const apz = pz - az;
  const abLenSq = abx * abx + aby * aby + abz * abz;
  if (abLenSq < 1e-6) {
    return Math.hypot(apx, apy, apz);
  }
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby + apz * abz) / abLenSq));
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  const cz = az + abz * t;
  return Math.hypot(px - cx, py - cy, pz - cz);
}

export function upsertRemoteShip(
  map: Map<string, RemoteShip>,
  uuid: string,
  ship: ShipState,
  color: string,
  source: RemoteShip['positionSource'],
  seenAt = performance.now(),
  meta?: { seq?: number; serverMs?: number },
): void {
  const prev = map.get(uuid);
  const jumped =
    prev != null &&
    (prev.positionSource !== source || positionDelta(prev.ship, ship) > POSITION_JUMP);
  const serverMs = meta?.serverMs;
  map.set(uuid, {
    uuid,
    ship,
    color,
    positionSource: source,
    lastSeenAt: seenAt,
    prevShip: jumped ? undefined : prev?.ship,
    prevSeenAt: jumped ? undefined : prev?.lastSeenAt,
    prevServerMs: jumped ? undefined : prev?.lastServerMs,
    lastSequence: meta?.seq ?? prev?.lastSequence,
    lastServerMs: serverMs ?? prev?.lastServerMs,
    serverClockOffset:
      serverMs != null ? serverMs - seenAt : prev?.serverClockOffset,
  });
}
