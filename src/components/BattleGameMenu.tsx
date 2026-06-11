import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const CONTROLS = [
  { keys: 'W / ↑', action: 'Climb' },
  { keys: 'S / ↓', action: 'Dive' },
  { keys: 'A / ←', action: 'Bank left' },
  { keys: 'D / →', action: 'Bank right' },
  { keys: 'Shift', action: 'Boost throttle' },
  { keys: 'Ctrl', action: 'Reduce throttle' },
  { keys: 'Z', action: 'Barrel roll' },
  { keys: 'Space', action: 'Fire laser' },
  { keys: 'Click arena', action: 'Lock cursor & fire (desktop)' },
  { keys: 'Mouse move', action: 'Aim when locked (desktop)' },
];

interface BattleGameMenuProps {
  userEmail?: string;
  events: string[];
}

export function BattleGameMenu({ userEmail, events }: BattleGameMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <div className="battle-game-menu" ref={rootRef}>
      <button
        type="button"
        className="battle-game-menu-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
      >
        ☰
      </button>

      {open && (
        <div className="battle-game-menu-popover" role="dialog" aria-label="Game menu">
          <div className="battle-game-menu-header">
            <h2>Menu</h2>
            <button
              type="button"
              className="battle-game-menu-close"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>

          <Link to="/" className="battle-game-menu-link" onClick={() => setOpen(false)}>
            ← Tutorial
          </Link>

          <section className="battle-game-menu-section">
            <h3>Connection</h3>
            <p className="battle-game-menu-user">{userEmail ?? 'Connecting…'}</p>
          </section>

          <section className="battle-game-menu-section">
            <h3>Log</h3>
            <ol className="battle-game-menu-log">
              {events.length === 0 ? (
                <li className="battle-game-menu-log-empty">Waiting for events…</li>
              ) : (
                events.slice(-12).map((e) => <li key={e}>{e}</li>)
              )}
            </ol>
          </section>

          <section className="battle-game-menu-section battle-game-menu-section--controls">
            <h3>Controls</h3>
            <p className="battle-game-menu-note battle-game-menu-note--desktop">
              Hold keys to ramp steering and throttle.
            </p>
            <p className="battle-game-menu-note battle-game-menu-note--mobile">
              Use the on-screen joystick, throttle, and fire buttons.
            </p>
            <dl className="battle-game-menu-controls">
              {CONTROLS.map(({ keys, action }) => (
                <div key={keys} className="battle-game-menu-control-row">
                  <dt>{keys}</dt>
                  <dd>{action}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
