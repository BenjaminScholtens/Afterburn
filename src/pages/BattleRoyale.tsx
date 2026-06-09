import { Link } from 'react-router-dom';
import { BattlePane } from '@/components/BattlePane';
import { BattleRadar } from '@/components/BattleRadar';
import { BattleRivalArrows } from '@/components/BattleRivalArrows';
import { BattlePilotColor } from '@/components/BattlePilotColor';
import { BattleShieldOverlay } from '@/components/BattleShieldOverlay';
import { BattleThrottle } from '@/components/BattleThrottle';
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

  return (
    <div className="play-layout battle-layout">
      <header className="play-header">
        <Link to="/">← Tutorial</Link>
        <h1>Star Fox Royale</h1>
        <p>
          Star Fox flight: <strong>WASD</strong> or <strong>arrow keys</strong> steer ·{' '}
          <strong>Shift/Ctrl</strong> throttle · <strong>Z</strong> barrel roll · optional{' '}
          <strong>mouse</strong> (click arena) · hold <strong>Space</strong> or <strong>click</strong>{' '}
          to laser
        </p>
      </header>
      <div className="play-body">
        <div className="play-main">
          <div
            className={`battle-viewport${game.matchStatus === 'eliminated' ? ' battle-viewport--eliminated' : ''}`}
          >
            <BattlePane
              getSnapshot={game.getSnapshot}
              setFiring={game.setFiring}
              applySteer={game.applySteer}
            />
            {game.localShip.alive && <BattlePilotColor color={game.localColor} />}
            {game.localShip.alive && (
              <BattleShieldOverlay
                hp={game.localShip.hp}
                maxHp={game.maxHp}
                outsideZone={game.outsideZone}
                alive={game.localShip.alive}
              />
            )}
            {game.localShip.alive && <BattleThrottle throttle={game.throttle} />}
            <BattleRadar getSnapshot={game.getSnapshot} tick={game.tick} />
            <BattleRivalArrows getSnapshot={game.getSnapshot} tick={game.tick} />
          </div>
          <div className="battle-hud n64-hud">
            <div className="hud-stat">
              <span className="label">Shield</span>
              <span className="value">{game.localShip.hp}</span>
            </div>
            <div className="hud-stat">
              <span className="label">Kills</span>
              <span className="value">{game.localShip.kills}</span>
            </div>
            <div className="hud-stat">
              <span className="label">Pilots</span>
              <span className="value" data-testid="alive-count">
                {game.aliveCount}
              </span>
            </div>
            <div className="hud-stat">
              <span className="label">Sector</span>
              <span className="value">{formatTime(game.zone.remainingMs)}</span>
            </div>
          </div>
          {game.matchStatus === 'victory' && (
            <div className="battle-banner victory">Sector clear — you win!</div>
          )}
        </div>
        <aside className="battle-sidebar">
          <p className="battle-user">{session.user?.email ?? 'Connecting…'}</p>
          <p className="battle-hint">
            Your Arwing stays centered and always flies forward — the nebula scrolls past like Star
            Fox 64. Steer with WASD or arrows (W/↑ climb, S/↓ dive, A/← and D/→ bank). Throttle
            with Shift (boost) and Ctrl (crawl). Press <strong>Z</strong> for a Star Fox barrel roll.
            Mouse works when you click the arena to lock the cursor. Use the sector radar
            (top-right) for rival bearings.
          </p>
          <ol className="battle-log">
            {game.events.slice(-8).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
