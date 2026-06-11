import { useEffect, useRef } from 'react';
import { ThreeBattleScene } from '@/game/render/ThreeBattleScene';
import type { BattleSceneSnapshot } from '@/game/battle/types';

interface BattlePaneProps {
  getSnapshot: () => BattleSceneSnapshot;
  setFiring?: (active: boolean) => void;
  applySteer?: (dx: number, dy: number) => void;
}

const COARSE_POINTER =
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: coarse)').matches;

export function BattlePane({ getSnapshot, setFiring, applySteer }: BattlePaneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ThreeBattleScene | null>(null);
  const snapshotRef = useRef(getSnapshot);
  const steerRef = useRef(applySteer);
  snapshotRef.current = getSnapshot;
  steerRef.current = applySteer;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = new ThreeBattleScene(host);
    sceneRef.current = scene;
    scene.startLoop(() => snapshotRef.current());

    const onResize = () => scene.resize();
    window.addEventListener('resize', onResize);

    const resizeObserver = new ResizeObserver(() => scene.resize());
    resizeObserver.observe(host);

    const steerFromDelta = (dx: number, dy: number) => {
      if (dx === 0 && dy === 0) return;
      steerRef.current?.(dx, dy);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (document.pointerLockElement !== host) return;
      steerFromDelta(e.movementX, e.movementY);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (COARSE_POINTER) return;
      host.focus();
      setFiring?.(true);
      void host.requestPointerLock();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (COARSE_POINTER) return;
      setFiring?.(false);
    };

    const onPointerLeave = () => {
      if (COARSE_POINTER) return;
      setFiring?.(false);
    };

    host.addEventListener('pointermove', onPointerMove);
    host.addEventListener('pointerdown', onPointerDown);
    host.addEventListener('pointerup', onPointerUp);
    host.addEventListener('pointerleave', onPointerLeave);

    return () => {
      window.removeEventListener('resize', onResize);
      resizeObserver.disconnect();
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerdown', onPointerDown);
      host.removeEventListener('pointerup', onPointerUp);
      host.removeEventListener('pointerleave', onPointerLeave);
      scene.dispose();
      sceneRef.current = null;
    };
  }, [setFiring]);

  return (
    <div className="battle-pane demo-pane">
      <div ref={hostRef} className="battle-3d-host" tabIndex={0} aria-label="Star Fox 3D arena" />
    </div>
  );
}
