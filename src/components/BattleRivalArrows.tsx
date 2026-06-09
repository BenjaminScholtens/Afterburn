import { useMemo } from 'react';
import { computeRivalHudIndicators } from '@/game/battle/rivalHud';
import type { BattleSceneSnapshot } from '@/game/battle/types';

interface BattleRivalArrowsProps {
  getSnapshot: () => BattleSceneSnapshot;
  tick: number;
}

export function BattleRivalArrows({ getSnapshot, tick }: BattleRivalArrowsProps) {
  const indicators = useMemo(() => {
    const snap = getSnapshot();
    return computeRivalHudIndicators(
      snap.localShip,
      snap.remoteShips,
      performance.now(),
    );
  }, [getSnapshot, tick]);

  if (indicators.length === 0) return null;

  return (
    <div className="battle-rival-arrows" aria-label="Rival bearing indicators">
      {indicators.map((ind) => {
        const deg = (ind.bearing * 180) / Math.PI;
        const hpPct = Math.max(0, Math.min(100, (ind.hp / ind.maxHp) * 100));
        const low = hpPct <= 35;
        const critical = hpPct <= 15;

        if (ind.mode === 'track') {
          return (
            <div
              key={ind.uuid}
              className="battle-rival-arrow battle-rival-arrow--track"
              style={{
                left: `${ind.left}%`,
                top: `${ind.top}%`,
                transform: 'translate(-50%, -50%)',
                ['--rival-color' as string]: ind.color,
              }}
            >
              <div
                className="battle-rival-track-stack"
                style={{ transform: `scale(${ind.arrowScale})` }}
              >
                <div
                  className={`battle-rival-shield${low ? ' low' : ''}${critical ? ' critical' : ''}`}
                  aria-label={`Rival shield ${ind.hp} of ${ind.maxHp}`}
                >
                  <div className="battle-rival-shield-bar">
                    <div
                      className="battle-rival-shield-fill"
                      style={{ width: `${hpPct}%` }}
                    />
                  </div>
                  <span className="battle-rival-shield-value">{ind.hp}</span>
                </div>
                <div
                  className="battle-rival-arrow-mark"
                  style={{ transform: `rotate(${deg}deg)` }}
                >
                  <svg
                    className="battle-rival-arrow-icon"
                    viewBox="0 0 32 40"
                    width="32"
                    height="40"
                    aria-hidden
                  >
                    <path
                      d="M16 2 L30 34 L16 28 L2 34 Z"
                      fill="currentColor"
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={ind.uuid}
            className="battle-rival-arrow"
            style={{
              left: `${ind.left}%`,
              top: `${ind.top}%`,
              transform: `translate(-50%, -50%) rotate(${deg}deg) scale(${ind.arrowScale})`,
              ['--rival-color' as string]: ind.color,
            }}
          >
            <svg
              className="battle-rival-arrow-icon"
              viewBox="0 0 32 40"
              width="32"
              height="40"
              aria-hidden
            >
              <path
                d="M16 2 L30 34 L16 28 L2 34 Z"
                fill="currentColor"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            <span className="battle-rival-arrow-dist">{Math.round(ind.distance)}</span>
          </div>
        );
      })}
    </div>
  );
}
