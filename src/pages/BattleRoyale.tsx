import { useEffect } from 'react';
import { BattlePane } from '@/components/BattlePane';
import { BattleRadar } from '@/components/BattleRadar';
import { BattleRivalArrows } from '@/components/BattleRivalArrows';
import { BattleStatsHud } from '@/components/BattleStatsHud';
import { BattleShieldOverlay } from '@/components/BattleShieldOverlay';
import { BattleThrottle } from '@/components/BattleThrottle';
import { BattleGameMenu } from '@/components/BattleGameMenu';
import { BattleMobileControls } from '@/components/BattleMobileControls';
import { useBattleRoyale } from '@/game/battle/useBattleRoyale';
import { CrowdySession } from '@/game/session/CrowdySession';

function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function BattleRoyale() {
  const session = CrowdySession.getInstance();
  const game = useBattleRoyale();
  const throttlePct = Math.round(Math.max(0, Math.min(1, game.throttle)) * 100);
  const controlsDisabled = game.matchStatus !== 'fighting' || !game.localShip.alive;

  useEffect(() => {
    document.body.classList.add('battle-play-active');
    return () => document.body.classList.remove('battle-play-active');
  }, []);

  return (
    <div className="play-layout battle-layout battle-layout--play">
      <div
        className={`battle-viewport${game.matchStatus === 'eliminated' ? ' battle-viewport--eliminated' : ''}`}
      >
        <BattlePane
          getSnapshot={game.getSnapshot}
          setFiring={game.setFiring}
          applySteer={game.applySteer}
        />

        <BattleGameMenu userEmail={session.user?.email} events={game.events} />

        {game.localShip.alive && (
          <BattleStatsHud
            color={game.localColor}
            hp={game.localShip.hp}
            maxHp={game.maxHp}
            kills={game.localShip.kills}
            aliveCount={game.aliveCount}
            sectorLabel={formatTime(game.zone.remainingMs)}
            throttlePct={throttlePct}
            alive={game.localShip.alive}
          />
        )}

        {game.localShip.alive && (
          <BattleShieldOverlay outsideZone={game.outsideZone} alive={game.localShip.alive} />
        )}

        {game.localShip.alive && (
          <BattleThrottle throttle={game.throttle} className="battle-throttle--desktop" />
        )}

        <BattleRadar getSnapshot={game.getSnapshot} tick={game.tick} compactOnMobile />
        <BattleRivalArrows getSnapshot={game.getSnapshot} tick={game.tick} />

        <BattleMobileControls
          setControlKey={game.setControlKey}
          setStickSteer={game.setStickSteer}
          setFiring={game.setFiring}
          applySteer={game.applySteer}
          onBarrelRoll={game.tryBarrelRoll}
          disabled={controlsDisabled}
        />

        {game.matchStatus === 'victory' && (
          <div className="battle-banner victory battle-banner--overlay">
            Sector clear — you win!
          </div>
        )}
        {game.matchStatus === 'eliminated' && (
          <div className="battle-banner eliminated battle-banner--overlay">
            Ship destroyed — eliminated
          </div>
        )}
      </div>
    </div>
  );
}
