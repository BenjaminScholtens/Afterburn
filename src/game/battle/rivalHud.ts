import * as THREE from 'three';
import { BATTLE_SHIP_MAX_HP, VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from '@/config';
import { remoteDisplayPoint } from '@/game/battle/remoteSync';
import type { RemoteShip } from '@/game/battle/types';
import type { ShipState } from '@/game/battle/shipState';

/** Show perimeter arrow when rival is farther than this (world units). */
export const BATTLE_RIVAL_ARROW_MIN_DIST = 160;
/** Perimeter inset when rival is off-screen. */
export const BATTLE_RIVAL_ARROW_EDGE_INSET = 38;
/** NDC margin before treating rival as off-screen. */
const FRUSTUM_MARGIN = 0.08;

export interface RivalHudIndicator {
  uuid: string;
  color: string;
  /** Radians from nose, -π..π (0 = straight ahead). */
  bearing: number;
  distance: number;
  arrowScale: number;
  /** Perimeter chevron vs on-screen tracker. */
  mode: 'edge' | 'track';
  left: number;
  top: number;
  hp: number;
  maxHp: number;
}

/** 3D ship mesh scale — stays readable at battle distances. */
export function rivalVisualScale(distance: number): number {
  const d = Math.max(55, distance);
  return Math.max(1.35, Math.min(5.5, 520 / d));
}

/** Glowing beacon — grows with distance so rivals stay visible when arrows point at them. */
export function rivalBeaconScale(distance: number): number {
  const d = Math.max(40, distance);
  return Math.max(2.8, Math.min(16, d * 0.011 + 2.2));
}

function normalizeAngle(rad: number): number {
  return Math.atan2(Math.sin(rad), Math.cos(rad));
}

let _rig: THREE.Group | null = null;
let _camera: THREE.PerspectiveCamera | null = null;
const _vec = new THREE.Vector3();
const _view = new THREE.Vector3();

function getBattleCamera(aspect: number): THREE.PerspectiveCamera {
  if (!_rig || !_camera) {
    _rig = new THREE.Group();
    _camera = new THREE.PerspectiveCamera(58, aspect, 0.1, 20000);
    _camera.position.set(0, 1.4, 4.2);
    _rig.add(_camera);
    _camera.lookAt(0, -0.1, -6);
  }
  if (Math.abs(_camera.aspect - aspect) > 0.001) {
    _camera.aspect = aspect;
    _camera.updateProjectionMatrix();
  }
  return _camera;
}

export interface RivalScreenProjection {
  inFrustum: boolean;
  left: number;
  top: number;
  ndcX: number;
  ndcY: number;
}

/** Project rival offset into battle viewport % coords (matches ThreeBattleScene camera). */
export function projectRivalToScreen(
  dx: number,
  dy: number,
  dz: number,
  yaw: number,
  pitch: number,
  aspect = VIEWPORT_WIDTH / VIEWPORT_HEIGHT,
): RivalScreenProjection {
  const camera = getBattleCamera(aspect);
  _rig!.rotation.order = 'YXZ';
  _rig!.rotation.y = yaw;
  _rig!.rotation.x = pitch;
  _rig!.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);

  _vec.set(dx, dy, dz);
  _view.copy(_vec).applyMatrix4(camera.matrixWorldInverse);
  const inFront = _view.z < -0.35;

  _vec.project(camera);
  const inFrustum =
    inFront &&
    _vec.x >= -1 - FRUSTUM_MARGIN &&
    _vec.x <= 1 + FRUSTUM_MARGIN &&
    _vec.y >= -1 - FRUSTUM_MARGIN &&
    _vec.y <= 1 + FRUSTUM_MARGIN &&
    _vec.z >= -1 &&
    _vec.z <= 1;

  return {
    inFrustum,
    left: (_vec.x + 1) * 50,
    top: (-_vec.y + 1) * 50,
    ndcX: _vec.x,
    ndcY: _vec.y,
  };
}

/** Place arrow on viewport edge (0–100%). */
export function rivalArrowPosition(bearing: number, insetPercent = BATTLE_RIVAL_ARROW_EDGE_INSET): {
  left: number;
  top: number;
} {
  return {
    left: 50 + Math.sin(bearing) * insetPercent,
    top: 50 - Math.cos(bearing) * insetPercent,
  };
}

function edgeArrowScale(distance: number): number {
  return Math.min(1.85, Math.max(0.95, 0.85 + distance / 520));
}

function trackArrowScale(distance: number): number {
  return Math.max(0.38, Math.min(1.05, distance / 380));
}

export function computeRivalHudIndicators(
  local: ShipState,
  remotes: RemoteShip[],
  atMs = performance.now(),
): RivalHudIndicator[] {
  const out: RivalHudIndicator[] = [];

  for (const remote of remotes) {
    if (!remote.ship.alive) continue;
    const pos = remoteDisplayPoint(remote, atMs);
    const dx = pos.x - local.worldX;
    const dz = pos.z - local.worldZ;
    const dy = pos.y - local.worldY;
    const distance = Math.hypot(dx, dy, dz);
    const bearing = normalizeAngle(Math.atan2(dx, -dz) - local.yaw);
    const screen = projectRivalToScreen(dx, dy, dz, local.yaw, local.pitch);

    if (screen.inFrustum) {
      out.push({
        uuid: remote.uuid,
        color: remote.color,
        bearing,
        distance,
        arrowScale: trackArrowScale(distance),
        mode: 'track',
        left: screen.left,
        top: screen.top,
        hp: remote.ship.hp,
        maxHp: BATTLE_SHIP_MAX_HP,
      });
      continue;
    }

    if (distance < 55) continue;

    const far = distance >= BATTLE_RIVAL_ARROW_MIN_DIST;
    const offCenter = Math.abs(bearing) >= 0.32;
    const behind = Math.abs(bearing) > Math.PI * 0.55;
    if (!far && !offCenter && !behind) continue;

    const edge = rivalArrowPosition(bearing);
    out.push({
      uuid: remote.uuid,
      color: remote.color,
      bearing,
      distance,
      arrowScale: edgeArrowScale(distance),
      mode: 'edge',
      left: edge.left,
      top: edge.top,
      hp: remote.ship.hp,
      maxHp: BATTLE_SHIP_MAX_HP,
    });
  }

  return out;
}
