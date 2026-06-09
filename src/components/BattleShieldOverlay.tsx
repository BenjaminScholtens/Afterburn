import { BATTLE_SHIP_MAX_HP } from '@/config';

interface BattleShieldOverlayProps {
  hp: number;
  maxHp?: number;
  outsideZone: boolean;
  alive?: boolean;
}

export function BattleShieldOverlay({
  hp,
  maxHp = BATTLE_SHIP_MAX_HP,
  outsideZone,
  alive = true,
}: BattleShieldOverlayProps) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const low = pct <= 35;
  const critical = pct <= 15;

  return (
    <>
      <div
        className={`battle-shield-hud${!alive ? ' dead' : ''}${low ? ' low' : ''}${critical ? ' critical' : ''}`}
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

      <div
        className={`battle-damage-vignette${outsideZone && alive ? ' active' : ''}`}
        aria-hidden
      />
    </>
  );
}
