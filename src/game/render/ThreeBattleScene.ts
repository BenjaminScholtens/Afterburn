import * as THREE from 'three';
import {
  BATTLE_ARENA_FLOOR_Y,
  BATTLE_ARENA_SCALE,
  BATTLE_INITIAL_ZONE_RADIUS,
} from '@/config';
import { hitShieldPhase, HIT_SHIELD_TOTAL_MS } from '@/game/battle/hitShieldFx';
import { remoteDisplayPoint } from '@/game/battle/remoteSync';
import { rivalBeaconScale, rivalVisualScale } from '@/game/battle/rivalHud';
import type { BattleSceneSnapshot, HitFlash } from '@/game/battle/types';
import type { ShipState } from '@/game/battle/shipState';

const N64_PALETTE = {
  sky: 0x1a1040,
  fog: 0x2a1858,
  arwing: 0xd8dce8,
  arwingAccent: 0x3d7fd6,
  exhaust: 0xff8833,
  laser: 0xffee55,
  zone: 0x55aaff,
  asteroid: 0x4a3f6b,
};

function hexColor(hex: string): number {
  return Number.parseInt(hex.replace('#', ''), 16);
}

function createArwingMesh(
  color: number,
  accent: number,
  opts?: { fog?: boolean },
): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({
    color,
    flatShading: true,
    fog: opts?.fog ?? true,
  });
  const accentMat = new THREE.MeshLambertMaterial({
    color,
    flatShading: true,
    fog: opts?.fog ?? true,
  });
  accentMat.color.setHex(accent);

  const fuselage = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.6, 4), bodyMat);
  fuselage.rotation.x = Math.PI / 2;
  fuselage.position.z = -0.3;
  group.add(fuselage);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 4), accentMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.z = -1.1;
  group.add(nose);

  const wingGeo = new THREE.BoxGeometry(1.4, 0.06, 0.5);
  const wingL = new THREE.Mesh(wingGeo, accentMat);
  wingL.position.set(-0.75, 0, 0.1);
  wingL.rotation.z = 0.08;
  group.add(wingL);
  const wingR = wingL.clone();
  wingR.position.x = 0.75;
  wingR.rotation.z = -0.08;
  group.add(wingR);

  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.35), bodyMat);
  tail.position.set(0, 0.12, 0.75);
  group.add(tail);

  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 6, 4),
    new THREE.MeshLambertMaterial({
      color: 0x88ccff,
      flatShading: true,
      fog: opts?.fog ?? true,
    }),
  );
  canopy.position.set(0, 0.14, -0.35);
  canopy.scale.set(1, 0.6, 1.2);
  group.add(canopy);

  group.scale.setScalar(1.4);
  return group;
}

function tuneRemoteShipMaterials(group: THREE.Group, color: number): void {
  group.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mat = obj.material;
    if (mat instanceof THREE.MeshLambertMaterial) {
      mat.emissive.setHex(color);
      mat.emissiveIntensity = 0.38;
    }
  });
}

interface ShieldFxMeshes {
  group: THREE.Group;
  shell: THREE.Mesh;
  absorb: THREE.Mesh;
  ripple: THREE.Mesh;
}

function createShieldFxMeshes(accent: number): ShieldFxMeshes {
  const group = new THREE.Group();
  group.visible = false;

  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, 2),
    new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0,
      wireframe: true,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    }),
  );
  group.add(shell);

  const absorb = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 8, 6),
    new THREE.MeshBasicMaterial({
      color: 0xffffee,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
      toneMapped: false,
    }),
  );
  group.add(absorb);

  const ripple = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 0.85, 20),
    new THREE.MeshBasicMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
      toneMapped: false,
    }),
  );
  group.add(ripple);

  return { group, shell, absorb, ripple };
}

function createStarfield(): THREE.Points {
  const count = 2400;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 800 * BATTLE_ARENA_SCALE + Math.random() * 2200 * BATTLE_ARENA_SCALE;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xc8d8ff,
    size: 2.2,
    sizeAttenuation: true,
  });
  return new THREE.Points(geo, mat);
}

function createAsteroidField(): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({
    color: N64_PALETTE.asteroid,
    flatShading: true,
  });
  for (let i = 0; i < 48; i++) {
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(8 + Math.random() * 24, 0),
      mat,
    );
    const angle = (i / 48) * Math.PI * 2;
    const dist = (180 + (i % 7) * 90) * BATTLE_ARENA_SCALE;
    mesh.position.set(
      Math.cos(angle) * dist,
      BATTLE_ARENA_FLOOR_Y + (60 + (i % 9) * 35) * BATTLE_ARENA_SCALE,
      Math.sin(angle) * dist,
    );
    mesh.rotation.set(Math.random(), Math.random(), Math.random());
    group.add(mesh);
  }
  return group;
}

export class ThreeBattleScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly playerRig: THREE.Group;
  private readonly arena: THREE.Group;
  private readonly localShip: THREE.Group;
  private localArwing: THREE.Group;
  private readonly localBeacon: THREE.Mesh;
  private localColorApplied = '';
  private readonly exhaust: THREE.Mesh;
  private readonly domeMesh: THREE.Mesh;
  private readonly floorGrid: THREE.GridHelper;
  private readonly zoneRing: THREE.Mesh;
  private readonly remoteMeshes = new Map<
    string,
    { rig: THREE.Group; ship: THREE.Group; beacon: THREE.Mesh; halo: THREE.Mesh }
  >();
  private readonly laserMeshes = new Map<string, THREE.Group>();
  private readonly localLaserMeshes = new Map<string, THREE.Group>();
  private readonly localFx: THREE.Group;
  private readonly localShieldFx: ShieldFxMeshes;
  private readonly remoteShieldFx = new Map<string, ShieldFxMeshes>();
  private readonly _euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private readonly _quat = new THREE.Quaternion();
  private readonly _invQuat = new THREE.Quaternion();
  private readonly _vec = new THREE.Vector3();
  private readonly _absorbPos = new THREE.Vector3();
  private readonly _absorbNormal = new THREE.Vector3();
  private animId = 0;
  private boostGlow = 0;

  constructor(container: HTMLElement) {
    const w = container.clientWidth;
    const h = container.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.className = 'battle-canvas';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(N64_PALETTE.sky);
    this.scene.fog = new THREE.FogExp2(N64_PALETTE.fog, 0.00011);

    this.camera = new THREE.PerspectiveCamera(58, w / h, 0.1, 20000);
    this.camera.position.set(0, 1.4, 4.2);

    const ambient = new THREE.AmbientLight(0x6060a0, 1.1);
    const key = new THREE.DirectionalLight(0xfff0d0, 1.4);
    key.position.set(4, 8, 2);
    const rim = new THREE.DirectionalLight(0x6688ff, 0.6);
    rim.position.set(-6, -2, -4);
    this.scene.add(ambient, key, rim);

    this.playerRig = new THREE.Group();
    this.scene.add(this.playerRig);

    this.localShip = new THREE.Group();
    this.localShip.position.set(0, -0.35, 0);
    this.playerRig.add(this.localShip);

    this.localArwing = createArwingMesh(N64_PALETTE.arwing, N64_PALETTE.arwingAccent);
    this.localShip.add(this.localArwing);

    this.localBeacon = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.16, 8, 28),
      new THREE.MeshBasicMaterial({
        color: N64_PALETTE.arwingAccent,
        transparent: true,
        opacity: 0.8,
        fog: false,
        toneMapped: false,
      }),
    );
    this.localBeacon.rotation.x = Math.PI / 2;
    this.localBeacon.position.set(0, -0.08, 0.12);
    this.localShip.add(this.localBeacon);

    this.exhaust = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.5 + Math.random() * 0.2, 4),
      new THREE.MeshBasicMaterial({ color: N64_PALETTE.exhaust }),
    );
    this.exhaust.rotation.x = -Math.PI / 2;
    this.exhaust.position.set(0, 0, 0.95);
    this.localShip.add(this.exhaust);

    this.localFx = new THREE.Group();
    this.localShip.add(this.localFx);

    this.localShieldFx = createShieldFxMeshes(N64_PALETTE.arwingAccent);
    this.localShip.add(this.localShieldFx.group);

    this.camera.lookAt(0, -0.1, -6);
    this.playerRig.add(this.camera);

    this.arena = new THREE.Group();
    this.scene.add(this.arena);

    this.arena.add(createStarfield());
    this.arena.add(createAsteroidField());

    const domeGeo = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshBasicMaterial({
      color: N64_PALETTE.zone,
      wireframe: true,
      transparent: true,
      opacity: 0.38,
    });
    this.domeMesh = new THREE.Mesh(domeGeo, domeMat);
    this.arena.add(this.domeMesh);

    const gridSpan = BATTLE_INITIAL_ZONE_RADIUS * 2.2;
    this.floorGrid = new THREE.GridHelper(
      gridSpan,
      48,
      0x4466cc,
      0x2a3a6a,
    );
    this.floorGrid.position.y = BATTLE_ARENA_FLOOR_Y;
    this.arena.add(this.floorGrid);

    const floorPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(gridSpan, gridSpan),
      new THREE.MeshLambertMaterial({
        color: 0x14102a,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
      }),
    );
    floorPlate.rotation.x = -Math.PI / 2;
    floorPlate.position.y = BATTLE_ARENA_FLOOR_Y - 0.5;
    this.arena.add(floorPlate);

    this.zoneRing = new THREE.Mesh(
      new THREE.RingGeometry(0.98, 1, 64),
      new THREE.MeshBasicMaterial({
        color: N64_PALETTE.zone,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55,
      }),
    );
    this.zoneRing.rotation.x = -Math.PI / 2;
    this.zoneRing.position.y = BATTLE_ARENA_FLOOR_Y + 0.5;
    this.arena.add(this.zoneRing);
  }

  resize(): void {
    const parent = this.renderer.domElement.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  startLoop(getSnapshot: () => BattleSceneSnapshot): void {
    const tick = () => {
      this.draw(getSnapshot());
      this.animId = requestAnimationFrame(tick);
    };
    this.animId = requestAnimationFrame(tick);
  }

  stopLoop(): void {
    cancelAnimationFrame(this.animId);
  }

  dispose(): void {
    this.stopLoop();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private syncLocalPilotColor(hex: string): void {
    if (!hex || hex === this.localColorApplied) return;
    this.localColorApplied = hex;
    const accent = hexColor(hex);
    this.localShip.remove(this.localArwing);
    this.localArwing = createArwingMesh(N64_PALETTE.arwing, accent, { fog: false });
    this.localShip.add(this.localArwing);
    this.localShip.remove(this.localBeacon);
    this.localShip.add(this.localBeacon);
    this.localShip.remove(this.exhaust);
    this.localShip.add(this.exhaust);
    this.localShip.remove(this.localFx);
    this.localShip.add(this.localFx);
    (this.localBeacon.material as THREE.MeshBasicMaterial).color.setHex(accent);
    (this.localShieldFx.shell.material as THREE.MeshBasicMaterial).color.setHex(accent);
  }

  private impactLocalOffset(
    flash: HitFlash,
    shipWorldX: number,
    shipWorldY: number,
    shipWorldZ: number,
    shipYaw: number,
    shipPitch: number,
    shellRadius: number,
  ): void {
    this._vec.set(
      flash.x - shipWorldX,
      flash.y - shipWorldY,
      flash.z - shipWorldZ,
    );
    if (this._vec.lengthSq() < 1e-4) {
      this._vec.set(0, 0, -1);
    }
    this._vec.normalize();

    this._euler.set(shipPitch, shipYaw, 0, 'YXZ');
    this._quat.setFromEuler(this._euler);
    this._invQuat.copy(this._quat).invert();
    this._absorbNormal.copy(this._vec).applyQuaternion(this._invQuat);
    this._absorbPos.copy(this._absorbNormal).multiplyScalar(shellRadius);
  }

  private syncHitShields(
    flashes: HitFlash[],
    localUuid: string,
    localShip: ShipState,
    remotes: BattleSceneSnapshot['remoteShips'],
    now: number,
  ): Set<string> {
    const absorbedProjectiles = new Set<string>();
    const activeTargets = new Set<string>();

    for (const flash of flashes) {
      const age = now - flash.startedAt;
      if (age < 0 || age > HIT_SHIELD_TOTAL_MS) continue;

      const phase = hitShieldPhase(age);
      if (phase.opacity <= 0.01) continue;

      absorbedProjectiles.add(flash.projectileId);
      activeTargets.add(flash.targetUuid);

      const isLocal = flash.targetUuid === localUuid;
      let fx: ShieldFxMeshes;
      let shellRadius: number;

      if (isLocal) {
        fx = this.localShieldFx;
        shellRadius = 3.4;
        this.impactLocalOffset(
          flash,
          localShip.worldX,
          localShip.worldY,
          localShip.worldZ,
          localShip.yaw,
          localShip.pitch,
          shellRadius,
        );
      } else {
        const remote = remotes.find((r) => r.uuid === flash.targetUuid);
        if (!remote) continue;
        let entry = this.remoteShieldFx.get(flash.targetUuid);
        if (!entry) {
          entry = createShieldFxMeshes(hexColor(remote.color));
          const rig = this.remoteMeshes.get(flash.targetUuid)?.rig;
          if (!rig) continue;
          rig.add(entry.group);
          this.remoteShieldFx.set(flash.targetUuid, entry);
        }
        fx = entry;
        const pos = remoteDisplayPoint(remote, now);
        const dx = pos.x - localShip.worldX;
        const dy = pos.y - localShip.worldY;
        const dz = pos.z - localShip.worldZ;
        const dist = Math.hypot(dx, dy, dz);
        const visualScale = rivalVisualScale(dist);
        shellRadius = 2.2 * visualScale;
        this._vec.set(flash.x - pos.x, flash.y - pos.y, flash.z - pos.z);
        if (this._vec.lengthSq() < 1e-4) {
          this._vec.set(0, 0, -1);
        }
        this._vec.normalize();
        this._euler.set(remote.ship.pitch, remote.ship.yaw, 0, 'YXZ');
        this._quat.setFromEuler(this._euler);
        this._invQuat.copy(this._quat).invert();
        this._absorbNormal.copy(this._vec).applyQuaternion(this._invQuat);
        this._absorbPos.copy(this._absorbNormal).multiplyScalar(shellRadius);
        (fx.shell.material as THREE.MeshBasicMaterial).color.setHex(hexColor(remote.color));
      }

      fx.group.visible = true;
      fx.group.scale.setScalar(shellRadius * phase.scale);
      (fx.shell.material as THREE.MeshBasicMaterial).opacity = phase.opacity;

      fx.absorb.position.copy(this._absorbPos);
      fx.absorb.visible = phase.absorb > 0.04;
      (fx.absorb.material as THREE.MeshBasicMaterial).opacity = phase.absorb * 0.95;
      fx.absorb.scale.setScalar(0.55 + (1 - phase.absorb) * 0.45);

      fx.ripple.position.copy(this._absorbPos);
      fx.ripple.lookAt(
        this._absorbPos.x + this._absorbNormal.x,
        this._absorbPos.y + this._absorbNormal.y,
        this._absorbPos.z + this._absorbNormal.z,
      );
      fx.ripple.visible = phase.ring > 0.04;
      (fx.ripple.material as THREE.MeshBasicMaterial).opacity = phase.ring * 0.7;
      fx.ripple.scale.setScalar(0.35 + (1 - phase.ring) * 1.1);
    }

    if (!activeTargets.has(localUuid)) {
      this.localShieldFx.group.visible = false;
    }

    for (const [uuid, fx] of this.remoteShieldFx) {
      if (!activeTargets.has(uuid)) {
        fx.group.visible = false;
      }
    }

    return absorbedProjectiles;
  }

  private draw(snapshot: BattleSceneSnapshot): void {
    const {
      localUuid,
      localColor,
      localShip,
      remoteShips,
      projectiles,
      hitFlashes,
      zone,
      throttle,
    } = snapshot;
    const now = performance.now();

    this.syncLocalPilotColor(localColor);

    this.playerRig.rotation.order = 'YXZ';
    this.playerRig.rotation.y = localShip.yaw;
    this.playerRig.rotation.x = localShip.pitch;

    this.arena.position.set(-localShip.worldX, -localShip.worldY, -localShip.worldZ);
    this.arena.rotation.set(0, 0, 0);

    this.domeMesh.position.set(zone.centerX, BATTLE_ARENA_FLOOR_Y, zone.centerZ);
    this.domeMesh.scale.setScalar(zone.radius);
    this.zoneRing.position.set(zone.centerX, BATTLE_ARENA_FLOOR_Y + 0.5, zone.centerZ);
    this.zoneRing.scale.set(zone.radius, zone.radius, 1);

    const thrust = 0.25 + throttle * 0.85;
    this.boostGlow = thrust + Math.sin(performance.now() * 0.02) * 0.12 * throttle;
    this.exhaust.scale.set(1, 1, this.boostGlow);
    this.localShip.rotation.z = Math.sin(performance.now() * 0.008) * 0.04;

    this.syncRemotes(remoteShips, localShip, now);
    const absorbed = this.syncHitShields(hitFlashes, localUuid, localShip, remoteShips, now);
    this.syncLasers(projectiles, localUuid, absorbed);
    this.syncLocalLasers(projectiles, localUuid, absorbed);

    this.renderer.render(this.scene, this.camera);
  }

  private makeBolt(): THREE.Group {
    const bolt = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.25, 5),
      new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, fog: false }),
    );
    core.position.z = -2.5;
    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.55, 5.5),
      new THREE.MeshBasicMaterial({
        color: N64_PALETTE.laser,
        transparent: true,
        opacity: 0.9,
        toneMapped: false,
        fog: false,
      }),
    );
    glow.position.z = -2.75;
    bolt.add(core, glow);
    return bolt;
  }

  private syncLocalLasers(
    projectiles: BattleSceneSnapshot['projectiles'],
    localUuid: string,
    absorbed: Set<string>,
  ): void {
    const seen = new Set<string>();
    const now = performance.now();
    for (const p of projectiles) {
      if (p.ownerUuid !== localUuid) continue;
      if (absorbed.has(p.id)) continue;
      seen.add(p.id);
      let bolt = this.localLaserMeshes.get(p.id);
      if (!bolt) {
        bolt = this.makeBolt();
        this.localFx.add(bolt);
        this.localLaserMeshes.set(p.id, bolt);
      }
      const age = (now - p.bornAt) / 1000;
      bolt.position.set(0, 0, -2.2 - age * 28);
      bolt.visible = age < 1.6;
    }
    for (const [id, mesh] of this.localLaserMeshes) {
      if (!seen.has(id)) {
        this.localFx.remove(mesh);
        this.localLaserMeshes.delete(id);
      }
    }
  }

  private syncRemotes(
    remotes: BattleSceneSnapshot['remoteShips'],
    local: ShipState,
    atMs: number,
  ): void {
    const seen = new Set<string>();
    for (const remote of remotes) {
      seen.add(remote.uuid);
      let entry = this.remoteMeshes.get(remote.uuid);
      if (!entry) {
        const color = hexColor(remote.color);
        const rig = new THREE.Group();
        const ship = createArwingMesh(color, 0x2244aa, { fog: false });
        tuneRemoteShipMaterials(ship, color);
        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(2.4, 10, 8),
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.92,
            fog: false,
            toneMapped: false,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
        );
        beacon.position.set(0, 0, -1.2);
        const halo = new THREE.Mesh(
          new THREE.RingGeometry(2.8, 4.6, 24),
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.72,
            side: THREE.DoubleSide,
            fog: false,
            toneMapped: false,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
        );
        rig.add(ship, beacon, halo);
        this.arena.add(rig);
        entry = { rig, ship, beacon, halo };
        this.remoteMeshes.set(remote.uuid, entry);
        const staleShield = this.remoteShieldFx.get(remote.uuid);
        if (staleShield) {
          rig.add(staleShield.group);
        }
      }
      const pos = remoteDisplayPoint(remote, atMs);
      const dx = pos.x - local.worldX;
      const dy = pos.y - local.worldY;
      const dz = pos.z - local.worldZ;
      const s = remote.ship;
      const dist = Math.hypot(dx, dy, dz);
      const visualScale = rivalVisualScale(dist);

      entry.rig.visible = s.alive;
      // Arena is already shifted by -local world; use absolute world coords here.
      entry.rig.position.set(pos.x, pos.y, pos.z);
      entry.rig.rotation.order = 'YXZ';
      entry.rig.rotation.y = s.yaw;
      entry.rig.rotation.x = s.pitch;
      entry.ship.scale.setScalar(visualScale);
      const beaconScale = rivalBeaconScale(dist);
      entry.beacon.scale.setScalar(beaconScale);
      entry.halo.scale.setScalar(beaconScale * 1.15);
      this.camera.getWorldPosition(this._vec);
      entry.halo.lookAt(this._vec);
      const rivalColor = hexColor(remote.color);
      (entry.beacon.material as THREE.MeshBasicMaterial).color.setHex(rivalColor);
      (entry.halo.material as THREE.MeshBasicMaterial).color.setHex(rivalColor);
    }
    for (const [uuid, entry] of this.remoteMeshes) {
      if (!seen.has(uuid)) {
        this.arena.remove(entry.rig);
        this.remoteMeshes.delete(uuid);
        this.remoteShieldFx.delete(uuid);
      }
    }
  }

  private syncLasers(
    projectiles: BattleSceneSnapshot['projectiles'],
    localUuid: string,
    absorbed: Set<string>,
  ): void {
    const seen = new Set<string>();
    for (const p of projectiles) {
      if (p.ownerUuid === localUuid) continue;
      if (absorbed.has(p.id)) continue;
      seen.add(p.id);
      let bolt = this.laserMeshes.get(p.id);
      if (!bolt) {
        bolt = this.makeBolt();
        this.arena.add(bolt);
        this.laserMeshes.set(p.id, bolt);
      }
      bolt.position.set(p.x, p.y, p.z);
      const speed = Math.hypot(p.vx, p.vy, p.vz) || 1;
      bolt.rotation.set(
        Math.atan2(p.vy, Math.hypot(p.vx, p.vz)),
        Math.atan2(p.vx, -p.vz),
        0,
        'YXZ',
      );
      bolt.visible = speed > 0.1;
    }
    for (const [id, mesh] of this.laserMeshes) {
      if (!seen.has(id)) {
        this.arena.remove(mesh);
        this.laserMeshes.delete(id);
      }
    }
  }
}
