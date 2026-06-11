import { BATTLE_SHIP_MAX_HP } from '@/config';
import { pilotColorLabel } from '@/game/render/CanvasRenderer';

interface BattleStatsHudProps {
  color: string;
  hp: number;
  maxHp?: number;
  kills: number;
  aliveCount: number;
  sectorLabel: string;
  throttlePct: number;
  alive?: boolean;
}

export function BattleStatsHud({
  color,
  hp,
  maxHp = BATTLE_SHIP_MAX_HP,
  kills,
  aliveCount,
  sectorLabel,
  throttlePct,
  alive = true,
}: BattleStatsHudProps) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const low = pct <= 35;
  const critical = pct <= 15;
  const label = pilotColorLabel(color);

  return (
    <div className="battle-stats-hud" aria-label="Combat status">
      <div className="battle-stats-pilot">
        <span className="battle-pilot-swatch" style={{ backgroundColor: color }} />
        <span className="battle-stats-pilot-name">{label}</span>
      </div>

      <div
        className={`battle-stats-shield${!alive ? ' dead' : ''}${low ? ' low' : ''}${critical ? ' critical' : ''}`}
        aria-label={`Shield ${hp} of ${maxHp}`}
      >
        <span className="battle-shield-label">Shield</span>
        <div className="battle-shield-bar">
          <div className="battle-shield-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="battle-shield-value" data-testid="shield-hp">
          {hp}
        </span>
      </div>

      <div className="battle-stats-grid">
        <div className="battle-stats-item">
          <span className="label">Kills</span>
          <span className="value">{kills}</span>
        </div>
        <div className="battle-stats-item">
          <span className="label">Pilots left</span>
          <span className="value" data-testid="alive-count">
            {aliveCount}
          </span>
        </div>
        <div className="battle-stats-item">
          <span className="label">Sector</span>
          <span className="value">{sectorLabel}</span>
        </div>
        <div className="battle-stats-item battle-stats-item--spd">
          <span className="label">Spd</span>
          <span className="value" data-testid="throttle-hud">
            {throttlePct}
          </span>
        </div>
      </div>
    </div>
  );
}
