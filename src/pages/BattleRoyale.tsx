import { Link } from 'react-router-dom';
import { BattlePane } from '@/components/BattlePane';
import { BattleRadar } from '@/components/BattleRadar';
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
          N64 open-sector flight — click arena to focus: <strong>W</strong> boost ·{' '}
          <strong>A/D</strong> bank · <strong>↑/↓</strong> climb/dive · hold <strong>Space</strong>{' '}
          or <strong>click</strong> to laser
        </p>
      </header>
      <div className="play-body">
        <div className="play-main">
          <div className="battle-viewport">
            <BattlePane getSnapshot={game.getSnapshot} setFiring={game.setFiring} />
            <BattleRadar
              localShip={game.localShip}
              remoteShips={game.remoteShips}
              zone={game.zone}
            />
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
          {game.matchStatus === 'eliminated' && (
            <div className="battle-banner eliminated">Ship destroyed — respawn next round.</div>
          )}
        </div>
        <aside className="battle-sidebar">
          <p className="battle-user">{session.user?.email ?? 'Connecting…'}</p>
          <p className="battle-hint">
            Your Arwing stays centered — the nebula scrolls past like Star Fox 64. Use the sector
            radar (top-right) for rival bearings; colored arrows point toward other pilots.
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
