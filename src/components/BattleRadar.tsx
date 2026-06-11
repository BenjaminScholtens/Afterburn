import { useEffect, useRef } from 'react';
import { remoteDisplayPoint } from '@/game/battle/remoteSync';
import type { BattleSceneSnapshot } from '@/game/battle/types';
import { BATTLE_RADAR_RANGE } from '@/config';

const RADAR_PX = 148;

interface BattleRadarProps {
  getSnapshot: () => BattleSceneSnapshot;
  tick: number;
  compactOnMobile?: boolean;
}

function hexToRgb(hex: string): string {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgb(${r},${g},${b})`;
}

export function BattleRadar({ getSnapshot, tick, compactOnMobile }: BattleRadarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapshotRef = useRef(getSnapshot);
  snapshotRef.current = getSnapshot;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { localShip, localColor, remoteShips, zone } = snapshotRef.current();
    const now = performance.now();

    const cx = RADAR_PX / 2;
    const cy = RADAR_PX / 2;
    const r = RADAR_PX / 2 - 8;

    ctx.clearRect(0, 0, RADAR_PX, RADAR_PX);

    ctx.fillStyle = 'rgba(8, 6, 24, 0.88)';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.fill();

    const zoneDx = zone.centerX - localShip.worldX;
    const zoneDz = zone.centerZ - localShip.worldZ;
    const scale = r / BATTLE_RADAR_RANGE;

    ctx.strokeStyle = 'rgba(85, 170, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const zoneR = Math.min(r, zone.radius * scale);
    ctx.arc(cx + zoneDx * scale, cy + zoneDz * scale, zoneR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(120, 180, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.stroke();

    const nose = localShip.yaw;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(nose);
    ctx.fillStyle = hexToRgb(localColor);
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(-5, 6);
    ctx.lineTo(5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.25;
    ctx.stroke();
    ctx.restore();

    for (const remote of remoteShips) {
      if (!remote.ship.alive) continue;
      const pos = remoteDisplayPoint(remote, now);
      const dx = pos.x - localShip.worldX;
      const dz = pos.z - localShip.worldZ;
      const dist = Math.hypot(dx, dz);
      const bearing = Math.atan2(dx, -dz);

      const mx = cx + dx * scale;
      const my = cy + dz * scale;
      const onMap = Math.hypot(mx - cx, my - cy) <= r - 4;

      if (onMap) {
        ctx.fillStyle = hexToRgb(remote.color);
        ctx.beginPath();
        ctx.arc(mx, my, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.stroke();
      }

      const arrowR = r - 2;
      const ax = cx + Math.sin(bearing) * arrowR;
      const ay = cy - Math.cos(bearing) * arrowR;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(bearing);
      ctx.fillStyle = hexToRgb(remote.color);
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(-4, 4);
      ctx.lineTo(4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      if (!onMap || dist > 80) {
        ctx.fillStyle = 'rgba(200,220,255,0.7)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        const labelX = cx + Math.sin(bearing) * (r - 16);
        const labelY = cy - Math.cos(bearing) * (r - 16) + 3;
        ctx.fillText(`${Math.round(dist)}m`, labelX, labelY);
      }
    }
  }, [tick]);

  return (
    <div
      className={`battle-radar${compactOnMobile ? ' battle-radar--compact-mobile' : ''}`}
      aria-label="Sector radar"
    >
      <canvas ref={canvasRef} width={RADAR_PX} height={RADAR_PX} />
      <ul className="battle-radar-legend">
        <li>
          <span className="swatch you" /> You
        </li>
        <li>
          <span className="swatch rival" /> Other pilots
        </li>
        <li>
          <span className="swatch arrow" /> ▲ Bearing
        </li>
        <li>
          <span className="swatch zone" /> Sector edge
        </li>
      </ul>
    </div>
  );
}
