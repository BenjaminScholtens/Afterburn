import { useEffect, useRef } from 'react';
import { ThreeBattleScene } from '@/game/render/ThreeBattleScene';
import type { BattleSceneSnapshot } from '@/game/battle/types';

interface BattlePaneProps {
  getSnapshot: () => BattleSceneSnapshot;
  setFiring?: (active: boolean) => void;
  width?: number;
  height?: number;
}

export function BattlePane({
  getSnapshot,
  setFiring,
  width = 640,
  height = 480,
}: BattlePaneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ThreeBattleScene | null>(null);
  const snapshotRef = useRef(getSnapshot);
  snapshotRef.current = getSnapshot;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = new ThreeBattleScene(host);
    sceneRef.current = scene;
    scene.startLoop(() => snapshotRef.current());

    const onResize = () => scene.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  return (
    <div
      className="battle-pane demo-pane"
      style={{ width, height }}
      onPointerDown={() => {
        hostRef.current?.focus();
        setFiring?.(true);
      }}
      onPointerUp={() => setFiring?.(false)}
      onPointerLeave={() => setFiring?.(false)}
    >
      <div ref={hostRef} className="battle-3d-host" tabIndex={0} aria-label="Star Fox 3D arena" />
    </div>
  );
}
