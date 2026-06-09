import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CrowdySession } from '@/game/session/CrowdySession';
import { ActorSender } from '@/game/session/ActorSender';
import { actorColorForUuid } from '@/game/render/CanvasRenderer';
import { getPilotColorId } from '@/game/pilotColorId';
import {
  clearBattleActorUuid,
  getBattleActorUuid,
} from '@/game/battle/battleActorUuid';
import {
  BATTLE_FIRE_COOLDOWN_MS,
  BATTLE_HIT_RADIUS,
  BATTLE_INVERT_RECOVER_DELAY_MS,
  BATTLE_INVERT_RECOVER_RATE,
  BATTLE_LASER_MUZZLE_OFFSET,
  BATTLE_MOUSE_SENSITIVITY,
  BATTLE_PITCH_RATE,
  BATTLE_PROJECTILE_LIFETIME_MS,
  BATTLE_PROJECTILE_SPEED,
  BATTLE_REMOTE_ACTOR_TIMEOUT_MS,
  BATTLE_THROTTLE_DEFAULT,
  BATTLE_THROTTLE_MAX_SPEED,
  BATTLE_THROTTLE_MIN_SPEED,
  BATTLE_THROTTLE_RATE,
  BATTLE_SHIP_MAX_HP,
  BATTLE_SHOT_DAMAGE,
  BATTLE_YAW_RATE,
  BATTLE_ZONE_DAMAGE_PER_SEC,
  BATTLE_ACTOR_SYNC_INTERVAL_MS,
} from '@/config';
import { worldToChunkInput } from '@/game/world/coordinates';
import {
  decodeShipState,
  encodeShipState,
  shipStateToPose,
  type ShipState,
} from '@/game/battle/shipState';
import {
  applyInvertRecovery,
  isShipInverted,
  shipForward,
  tamePitch,
} from '@/game/battle/flight';
import {
  distancePointToSegment,
  extrapolateRemotePoint,
  remoteDisplayPoint,
  shouldApplyRemoteUpdate,
  upsertRemoteShip,
} from '@/game/battle/remoteSync';
import { applyArenaCollisions } from '@/game/battle/arena';
import { distanceToZoneEdge, getMatchStartMs, getZoneState } from '@/game/battle/zone';
import { randomSpawn } from '@/game/battle/spawn';
import {
  listBattleFires,
  listBattlePeers,
  postBattleFire,
  postBattlePresence,
} from '@/game/battle/battlePresence';
import {
  EVENT_FIRE,
  EVENT_HIT,
  type BattleSceneSnapshot,
  type FireEventPayload,
  type HitEventPayload,
  type HitFlash,
  type Projectile,
  type RemoteShip,
} from '@/game/battle/types';
import { HIT_SHIELD_TOTAL_MS } from '@/game/battle/hitShieldFx';

function encodeJsonPayload(payload: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function decodeJsonPayload<T>(state: string): T | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(state)))) as T;
  } catch {
    return null;
  }
}

function chunkAt(x: number, z: number) {
  return worldToChunkInput(x, z);
}

export function useBattleRoyale() {
  const session = useMemo(() => CrowdySession.getInstance(), []);
  const battleActorUuid = useMemo(() => getBattleActorUuid(), []);
  const pilotColorId = useMemo(() => getPilotColorId(), []);
  const localColor = useMemo(() => actorColorForUuid(pilotColorId), [pilotColorId]);
  const actorSenderRef = useRef(
    new ActorSender(session, BATTLE_ACTOR_SYNC_INTERVAL_MS),
  );
  const remoteRef = useRef(new Map<string, RemoteShip>());
  const projectilesRef = useRef<Projectile[]>([]);
  const keysRef = useRef(new Set<string>());
  const steerRef = useRef({ yaw: 0, pitch: 0 });
  const throttleRef = useRef(BATTLE_THROTTLE_DEFAULT);
  const localShipRef = useRef<ShipState>(randomSpawn(battleActorUuid));
  const lastFireRef = useRef(0);
  const eventSeqRef = useRef(0);
  const rafRef = useRef(0);
  const lastFrameRef = useRef(performance.now());
  const hitProjectilesRef = useRef(new Set<string>());
  const firingRef = useRef(false);
  const presenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const presencePostIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const projectilePrevPosRef = useRef(new Map<string, { x: number; y: number; z: number }>());
  const hitFlashesRef = useRef<HitFlash[]>([]);
  const matchStartRef = useRef(getMatchStartMs());
  const everHadOpponentRef = useRef(false);
  const matchStatusRef = useRef<'fighting' | 'victory' | 'eliminated'>('fighting');
  const outsideZoneRef = useRef(false);
  const invertedMsRef = useRef(0);
  const lastCrashAtRef = useRef(0);

  const [tick, setTick] = useState(0);
  const [events, setEvents] = useState<string[]>([]);
  const [matchStatus, setMatchStatus] = useState<'fighting' | 'victory' | 'eliminated'>('fighting');

  const setMatch = useCallback((status: 'fighting' | 'victory' | 'eliminated') => {
    matchStatusRef.current = status;
    setMatchStatus(status);
  }, []);

  const bump = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    return session.onEvent(() => setEvents([...session.events]));
  }, [session]);

  const fireProjectile = useCallback(
    async (ship: ShipState) => {
      const now = performance.now();
      if (now - lastFireRef.current < BATTLE_FIRE_COOLDOWN_MS) return;
      if (!ship.alive) return;
      lastFireRef.current = now;

      const fwd = shipForward(ship);
      const id = `${battleActorUuid.slice(0, 8)}-${eventSeqRef.current++}`;
      const vx = fwd.x * BATTLE_PROJECTILE_SPEED;
      const vy = fwd.y * BATTLE_PROJECTILE_SPEED;
      const vz = fwd.z * BATTLE_PROJECTILE_SPEED;
      const muzzle = BATTLE_LASER_MUZZLE_OFFSET;
      const px = ship.worldX + fwd.x * muzzle;
      const py = ship.worldY + fwd.y * muzzle;
      const pz = ship.worldZ + fwd.z * muzzle;
      const payload: FireEventPayload = {
        id,
        ownerUuid: battleActorUuid,
        x: px,
        y: py,
        z: pz,
        vx,
        vy,
        vz,
      };
      projectilesRef.current.push({
        id,
        ownerUuid: battleActorUuid,
        x: px,
        y: py,
        z: pz,
        vx,
        vy,
        vz,
        bornAt: now,
      });
      projectilePrevPosRef.current.set(id, { x: px, y: py, z: pz });
      const { chunk } = chunkAt(px, pz);
      void session.sendClientEvent({
        chunk,
        eventType: EVENT_FIRE,
        state: encodeJsonPayload(payload),
        sequenceNumber: eventSeqRef.current % 256,
        distance: 8,
        decayRate: 0,
        uuid: battleActorUuid,
      });
      void postBattleFire(payload);
      bump();
    },
    [session, bump, battleActorUuid],
  );

  const registerHitFlash = useCallback((payload: HitEventPayload) => {
    let x = payload.x;
    let y = payload.y;
    let z = payload.z;
    if (x == null || y == null || z == null) {
      const proj = projectilesRef.current.find((p) => p.id === payload.projectileId);
      if (proj) {
        x = proj.x;
        y = proj.y;
        z = proj.z;
      } else if (payload.targetUuid === battleActorUuid) {
        const s = localShipRef.current;
        x = s.worldX;
        y = s.worldY;
        z = s.worldZ;
      } else {
        const remote = remoteRef.current.get(payload.targetUuid);
        if (!remote) return;
        const pos = remoteDisplayPoint(remote);
        x = pos.x;
        y = pos.y;
        z = pos.z;
      }
    }

    const now = performance.now();
    hitFlashesRef.current = hitFlashesRef.current.filter(
      (f) => now - f.startedAt < HIT_SHIELD_TOTAL_MS + 80,
    );
    hitFlashesRef.current.push({
      projectileId: payload.projectileId,
      targetUuid: payload.targetUuid,
      x,
      y,
      z,
      startedAt: now,
    });
  }, [battleActorUuid]);

  const applyHit = useCallback(
    async (payload: HitEventPayload) => {
      if (hitProjectilesRef.current.has(payload.projectileId)) return;
      hitProjectilesRef.current.add(payload.projectileId);
      registerHitFlash(payload);

      if (payload.targetUuid === battleActorUuid) {
        const ship = localShipRef.current;
        if (!ship.alive) return;
        ship.hp = Math.max(0, ship.hp - payload.damage);
        if (ship.hp <= 0) {
          ship.alive = false;
          clearBattleActorUuid();
          setMatch('eliminated');
        }
        bump();
        return;
      }

      const remote = remoteRef.current.get(payload.targetUuid);
      if (!remote || !remote.ship.alive) return;
      remote.ship.hp = Math.max(0, remote.ship.hp - payload.damage);
      if (remote.ship.hp <= 0) {
        remote.ship.alive = false;
        if (payload.projectileId.startsWith(battleActorUuid.slice(0, 8))) {
          localShipRef.current.kills += 1;
        }
      }
      bump();
    },
    [battleActorUuid, bump, setMatch, registerHitFlash],
  );

  useEffect(() => {
    const unsubs: Array<() => void> = [];
    let cancelled = false;

    void (async () => {
      await session.ensureGuestAuth();
      await session.bootstrap();
      await session.connectUdp();
      if (cancelled) return;

      actorSenderRef.current.setActorUuid(battleActorUuid);

      unsubs.push(
        session.onNotification('ActorUpdateNotification', (n) => {
          if (n.__typename !== 'ActorUpdateNotification') return;
          if (n.uuid === battleActorUuid) return;
          const ship = decodeShipState(n.state);
          if (!ship) return;
          const seq = Number(n.sequenceNumber);
          const serverMs = Number(n.epochMillis);
          const prev = remoteRef.current.get(n.uuid);
          if (!shouldApplyRemoteUpdate(prev, seq, serverMs)) return;
          upsertRemoteShip(
            remoteRef.current,
            n.uuid,
            ship,
            actorColorForUuid(ship.colorId ?? n.uuid),
            'udp',
            performance.now(),
            { seq, serverMs },
          );
          bump();
        }),
      );

      unsubs.push(
        session.onNotification('ClientEventNotification', (n) => {
          if (n.__typename !== 'ClientEventNotification') return;
          if (n.eventType === EVENT_FIRE) {
            const payload = decodeJsonPayload<FireEventPayload>(n.state);
            if (!payload || payload.ownerUuid === battleActorUuid) return;
            if (projectilesRef.current.some((p) => p.id === payload.id)) return;
            projectilesRef.current.push({
              id: payload.id,
              ownerUuid: payload.ownerUuid,
              x: payload.x,
              y: payload.y ?? 0,
              z: payload.z ?? 0,
              vx: payload.vx,
              vy: payload.vy ?? 0,
              vz: payload.vz ?? 0,
              bornAt: performance.now(),
            });
            bump();
            return;
          }
          if (n.eventType === EVENT_HIT) {
            const payload = decodeJsonPayload<HitEventPayload>(n.state);
            if (!payload) return;
            void applyHit(payload);
          }
        }),
      );

      actorSenderRef.current.setStateEncoder(() =>
        encodeShipState(
          { ...localShipRef.current, colorId: pilotColorId },
          pilotColorId,
        ),
      );
      actorSenderRef.current.setProvider({
        getPose: () => shipStateToPose(localShipRef.current),
      });
      actorSenderRef.current.start();
      await actorSenderRef.current.sendNow();
      if (cancelled) return;

      const postPresence = () => {
        void postBattlePresence(battleActorUuid, localShipRef.current, pilotColorId);
      };

      const syncPeers = async () => {
        try {
          const peers = await listBattlePeers(battleActorUuid);
          const now = performance.now();
          for (const peer of peers) {
            const existing = remoteRef.current.get(peer.uuid);
            const color = actorColorForUuid(peer.colorId ?? peer.uuid);
            if (existing) {
              const udpStale = now - (existing.lastSeenAt ?? 0) > 220;
              if (existing.positionSource === 'relay' || udpStale) {
                upsertRemoteShip(
                  remoteRef.current,
                  peer.uuid,
                  { ...peer.ship, colorId: peer.colorId },
                  color,
                  'relay',
                  now,
                  { serverMs: peer.updatedAt },
                );
              } else {
                remoteRef.current.set(peer.uuid, { ...existing, color });
              }
              continue;
            }
            upsertRemoteShip(
              remoteRef.current,
              peer.uuid,
              { ...peer.ship, colorId: peer.colorId },
              color,
              'relay',
              now,
              { serverMs: peer.updatedAt },
            );
          }

          for (const fire of await listBattleFires()) {
            if (fire.ownerUuid === battleActorUuid) continue;
            if (projectilesRef.current.some((p) => p.id === fire.id)) continue;
            projectilesRef.current.push({
              id: fire.id,
              ownerUuid: fire.ownerUuid,
              x: fire.x,
              y: fire.y ?? 0,
              z: fire.z ?? 0,
              vx: fire.vx,
              vy: fire.vy ?? 0,
              vz: fire.vz ?? 0,
              bornAt: fire.firedAt,
            });
          }

          bump();
        } catch {
          // Presence relay is best-effort in dev
        }
      };

      postPresence();
      await syncPeers();
      presencePostIntervalRef.current = setInterval(
        postPresence,
        BATTLE_ACTOR_SYNC_INTERVAL_MS,
      );
      presenceIntervalRef.current = setInterval(() => {
        void syncPeers();
      }, 250);
      bump();
    })();

    return () => {
      cancelled = true;
      for (const unsub of unsubs) unsub();
      actorSenderRef.current.stop();
      actorSenderRef.current.setActorUuid(null);
      if (presencePostIntervalRef.current) {
        clearInterval(presencePostIntervalRef.current);
        presencePostIntervalRef.current = null;
      }
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
        presenceIntervalRef.current = null;
      }
    };
  }, [session, bump, applyHit, pilotColorId, battleActorUuid]);

  const trackKey = useCallback((e: KeyboardEvent, down: boolean) => {
    const codeMap: Record<string, string> = {
      KeyW: 'w',
      KeyS: 's',
      KeyA: 'a',
      KeyD: 'd',
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ShiftLeft: 'shift',
      ShiftRight: 'shift',
      ControlLeft: 'ctrl',
      ControlRight: 'ctrl',
    };
    const key = codeMap[e.code] ?? e.key.toLowerCase();
    if (['w', 's', 'a', 'd', 'up', 'down', 'left', 'right', 'shift', 'ctrl'].includes(key)) {
      if (down) keysRef.current.add(key);
      else keysRef.current.delete(key);
      e.preventDefault();
    }
    if (e.key === ' ' || e.code === 'Space') {
      if (down) {
        e.preventDefault();
        firingRef.current = true;
        void fireProjectile(localShipRef.current);
      } else {
        firingRef.current = false;
      }
    }
  }, [fireProjectile]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => trackKey(e, true);
    const onKeyUp = (e: KeyboardEvent) => trackKey(e, false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [trackKey]);

  useEffect(() => {
    const loop = (now: number) => {
      const dt = Math.min(32, now - lastFrameRef.current) / 16.67;
      lastFrameRef.current = now;

      const roundStart = getMatchStartMs();
      if (roundStart !== matchStartRef.current) {
        matchStartRef.current = roundStart;
        localShipRef.current = randomSpawn(battleActorUuid);
        steerRef.current = { yaw: 0, pitch: 0 };
        throttleRef.current = BATTLE_THROTTLE_DEFAULT;
        outsideZoneRef.current = false;
        invertedMsRef.current = 0;
        lastCrashAtRef.current = 0;
        projectilesRef.current = [];
        projectilePrevPosRef.current.clear();
        hitProjectilesRef.current.clear();
        everHadOpponentRef.current = false;
        setMatch('fighting');
      }

      const ship = localShipRef.current;
      const zone = getZoneState();
      const keys = keysRef.current;
      const status = matchStatusRef.current;

      if (ship.alive && status !== 'eliminated') {
        if (firingRef.current) {
          void fireProjectile(ship);
        }

        if (keys.has('a') || keys.has('left')) ship.yaw += BATTLE_YAW_RATE * dt;
        if (keys.has('d') || keys.has('right')) ship.yaw -= BATTLE_YAW_RATE * dt;
        if (keys.has('w') || keys.has('up')) {
          ship.pitch += BATTLE_PITCH_RATE * dt;
        }
        if (keys.has('s') || keys.has('down')) {
          ship.pitch -= BATTLE_PITCH_RATE * dt;
        }
        if (keys.has('shift')) {
          throttleRef.current = Math.min(1, throttleRef.current + BATTLE_THROTTLE_RATE * dt);
        }
        if (keys.has('ctrl')) {
          throttleRef.current = Math.max(0, throttleRef.current - BATTLE_THROTTLE_RATE * dt);
        }

        const steer = steerRef.current;
        const pitchSteer = steer.pitch;
        ship.yaw += steer.yaw;
        ship.pitch += pitchSteer;
        steerRef.current = { yaw: 0, pitch: 0 };

        const pitchingInput =
          keys.has('w') ||
          keys.has('s') ||
          keys.has('up') ||
          keys.has('down') ||
          Math.abs(pitchSteer) > 0.0001;
        const inverted = isShipInverted(ship.pitch);
        if (inverted && !pitchingInput) {
          invertedMsRef.current += (dt * 16.67);
        } else {
          invertedMsRef.current = 0;
        }
        if (inverted && !pitchingInput) {
          ship.pitch = applyInvertRecovery(
            ship.pitch,
            invertedMsRef.current,
            BATTLE_INVERT_RECOVER_DELAY_MS,
            BATTLE_INVERT_RECOVER_RATE,
            dt,
          );
        }
        ship.pitch = tamePitch(ship.pitch);

        const fwd = shipForward(ship);
        const cruise =
          BATTLE_THROTTLE_MIN_SPEED +
          (BATTLE_THROTTLE_MAX_SPEED - BATTLE_THROTTLE_MIN_SPEED) * throttleRef.current;
        const speed = cruise * dt;
        ship.worldX += fwd.x * speed;
        ship.worldY += fwd.y * speed;
        ship.worldZ += fwd.z * speed;

        const crash = applyArenaCollisions(
          ship,
          zone,
          lastCrashAtRef.current,
          performance.now(),
        );
        lastCrashAtRef.current = crash.crashAt;
        if (crash.damaged && ship.hp <= 0) {
          ship.alive = false;
          clearBattleActorUuid();
          setMatch('eliminated');
        }

        const edge = distanceToZoneEdge(ship.worldX, ship.worldZ, zone);
        outsideZoneRef.current = edge < 0;
        if (outsideZoneRef.current) {
          ship.hp = Math.max(0, ship.hp - (BATTLE_ZONE_DAMAGE_PER_SEC * dt) / 60);
          if (ship.hp <= 0) {
            ship.alive = false;
            clearBattleActorUuid();
            setMatch('eliminated');
          }
        }
      } else {
        outsideZoneRef.current = false;
      }

      const flashNow = performance.now();
      hitFlashesRef.current = hitFlashesRef.current.filter(
        (f) => flashNow - f.startedAt < HIT_SHIELD_TOTAL_MS + 80,
      );

      const staleCutoff = performance.now() - BATTLE_REMOTE_ACTOR_TIMEOUT_MS;
      for (const [uuid, remote] of remoteRef.current) {
        if (remote.lastSeenAt != null && remote.lastSeenAt < staleCutoff) {
          remoteRef.current.delete(uuid);
        }
      }

      const aliveRemotes = [...remoteRef.current.values()].filter((r) => r.ship.alive);
      if (remoteRef.current.size > 0) {
        everHadOpponentRef.current = true;
      }
      if (
        ship.alive &&
        everHadOpponentRef.current &&
        aliveRemotes.length === 0 &&
        status === 'fighting'
      ) {
        setMatch('victory');
      }

      const projectiles = projectilesRef.current;
      const prevPos = projectilePrevPosRef.current;
      const hitNow = performance.now();
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i]!;
        const before = prevPos.get(p.id) ?? { x: p.x, y: p.y, z: p.z };
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        prevPos.set(p.id, { x: p.x, y: p.y, z: p.z });

        if (performance.now() - p.bornAt > BATTLE_PROJECTILE_LIFETIME_MS) {
          projectiles.splice(i, 1);
          prevPos.delete(p.id);
          continue;
        }

        if (p.ownerUuid !== battleActorUuid) continue;

        for (const target of aliveRemotes) {
          const s = target.ship;
          if (!s.alive) continue;
          const aim = extrapolateRemotePoint(target, hitNow);
          const dist = distancePointToSegment(
            aim.x,
            aim.y,
            aim.z,
            before.x,
            before.y,
            before.z,
            p.x,
            p.y,
            p.z,
          );
          if (dist > BATTLE_HIT_RADIUS) continue;
          if (hitProjectilesRef.current.has(p.id)) continue;

          const payload: HitEventPayload = {
            projectileId: p.id,
            targetUuid: target.uuid,
            damage: BATTLE_SHOT_DAMAGE,
            x: p.x,
            y: p.y,
            z: p.z,
          };
          const { chunk } = chunkAt(p.x, p.z);
          void session.sendClientEvent({
            chunk,
            eventType: EVENT_HIT,
            state: encodeJsonPayload(payload),
            sequenceNumber: eventSeqRef.current++ % 256,
            distance: 8,
            decayRate: 0,
            uuid: battleActorUuid,
          });
          void applyHit(payload);
          if (target.ship.hp <= 0) {
            localShipRef.current.kills += 1;
          }
          projectiles.splice(i, 1);
          prevPos.delete(p.id);
          break;
        }
      }

      bump();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [battleActorUuid, bump, applyHit, setMatch]);

  const getSnapshot = useCallback(
    (): BattleSceneSnapshot => ({
      localUuid: battleActorUuid,
      localColor,
      localShip: localShipRef.current,
      remoteShips: [...remoteRef.current.values()],
      projectiles: projectilesRef.current,
      hitFlashes: hitFlashesRef.current,
      zone: getZoneState(),
      throttle: throttleRef.current,
      tick,
    }),
    [battleActorUuid, localColor, tick],
  );

  const setFiring = useCallback((active: boolean) => {
    firingRef.current = active;
    if (active) void fireProjectile(localShipRef.current);
  }, [fireProjectile]);

  const applySteer = useCallback((dx: number, dy: number) => {
    steerRef.current.yaw -= dx * BATTLE_MOUSE_SENSITIVITY;
    steerRef.current.pitch -= dy * BATTLE_MOUSE_SENSITIVITY;
  }, []);

  const zone = getZoneState();
  const remoteShips = [...remoteRef.current.values()];
  const aliveCount =
    (localShipRef.current.alive ? 1 : 0) +
    remoteShips.filter((r) => r.ship.alive).length;

  return {
    getSnapshot,
    localShip: localShipRef.current,
    localColor,
    remoteShips,
    projectiles: projectilesRef.current,
    zone,
    aliveCount,
    matchStatus,
    events,
    setFiring,
    applySteer,
    throttle: throttleRef.current,
    outsideZone: outsideZoneRef.current,
    maxHp: BATTLE_SHIP_MAX_HP,
    tick,
  };
}
