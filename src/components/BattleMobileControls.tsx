import { useCallback, useEffect, useRef, useState } from 'react';

type ControlKey = 'w' | 's' | 'a' | 'd' | 'shift' | 'ctrl';
type SteerKey = 'w' | 's' | 'a' | 'd';

interface BattleMobileControlsProps {
  setControlKey: (key: ControlKey, down: boolean) => void;
  setFiring: (active: boolean) => void;
  applySteer: (dx: number, dy: number) => void;
  onBarrelRoll: () => void;
  disabled?: boolean;
}

const AIM_SENSITIVITY = 0.0042;
const STEER_KEYS: SteerKey[] = ['w', 'a', 's', 'd'];
const JOYSTICK_DEADZONE = 0.18;

export function BattleMobileControls({
  setControlKey,
  setFiring,
  applySteer,
  onBarrelRoll,
  disabled = false,
}: BattleMobileControlsProps) {
  const activeKeysRef = useRef(new Set<ControlKey>());
  const aimTouchIdRef = useRef<number | null>(null);
  const stickTouchIdRef = useRef<number | null>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const lastAimRef = useRef({ x: 0, y: 0 });
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });

  const releaseKey = useCallback(
    (key: ControlKey) => {
      if (!activeKeysRef.current.has(key)) return;
      activeKeysRef.current.delete(key);
      setControlKey(key, false);
    },
    [setControlKey],
  );

  const pressKey = useCallback(
    (key: ControlKey) => {
      if (disabled || activeKeysRef.current.has(key)) return;
      activeKeysRef.current.add(key);
      setControlKey(key, true);
    },
    [disabled, setControlKey],
  );

  const releaseSteerKeys = useCallback(() => {
    for (const key of STEER_KEYS) releaseKey(key);
  }, [releaseKey]);

  const applyStickDeflection = useCallback(
    (normX: number, normY: number) => {
      const want: Record<SteerKey, boolean> = {
        a: normX < -JOYSTICK_DEADZONE,
        d: normX > JOYSTICK_DEADZONE,
        w: normY < -JOYSTICK_DEADZONE,
        s: normY > JOYSTICK_DEADZONE,
      };
      for (const key of STEER_KEYS) {
        if (want[key]) pressKey(key);
        else releaseKey(key);
      }
    },
    [pressKey, releaseKey],
  );

  const resetJoystick = useCallback(() => {
    stickTouchIdRef.current = null;
    setKnobOffset({ x: 0, y: 0 });
    releaseSteerKeys();
  }, [releaseSteerKeys]);

  useEffect(() => {
    if (disabled) resetJoystick();
  }, [disabled, resetJoystick]);

  useEffect(() => () => releaseSteerKeys(), [releaseSteerKeys]);

  const updateJoystick = useCallback(
    (clientX: number, clientY: number) => {
      const base = joystickRef.current;
      if (!base) return;
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const maxR = rect.width * 0.38;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxR) {
        dx = (dx / dist) * maxR;
        dy = (dy / dist) * maxR;
      }
      setKnobOffset({ x: dx, y: dy });
      applyStickDeflection(dx / maxR, dy / maxR);
    },
    [applyStickDeflection],
  );

  const onJoystickDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    stickTouchIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateJoystick(e.clientX, e.clientY);
  };

  const onJoystickMove = (e: React.PointerEvent) => {
    if (disabled || stickTouchIdRef.current !== e.pointerId) return;
    e.preventDefault();
    updateJoystick(e.clientX, e.clientY);
  };

  const endJoystick = (e: React.PointerEvent) => {
    if (stickTouchIdRef.current !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    resetJoystick();
  };

  const bindKey = (key: ControlKey) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      pressKey(key);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      releaseKey(key);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    },
    onPointerCancel: (e: React.PointerEvent) => {
      releaseKey(key);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    },
    onLostPointerCapture: () => releaseKey(key),
  });

  const onAimDown = (e: React.PointerEvent) => {
    if (disabled || e.pointerType === 'mouse') return;
    e.preventDefault();
    aimTouchIdRef.current = e.pointerId;
    lastAimRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onAimMove = (e: React.PointerEvent) => {
    if (disabled || aimTouchIdRef.current !== e.pointerId) return;
    e.preventDefault();
    const dx = e.clientX - lastAimRef.current.x;
    const dy = e.clientY - lastAimRef.current.y;
    lastAimRef.current = { x: e.clientX, y: e.clientY };
    if (dx !== 0 || dy !== 0) {
      applySteer(dx * AIM_SENSITIVITY * 40, dy * AIM_SENSITIVITY * 40);
    }
  };

  const endAim = (e: React.PointerEvent) => {
    if (aimTouchIdRef.current !== e.pointerId) return;
    aimTouchIdRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div className="battle-mobile-controls" aria-label="Touch flight controls">
      <div
        ref={joystickRef}
        className="battle-mobile-joystick"
        aria-label="Flight stick"
        onPointerDown={onJoystickDown}
        onPointerMove={onJoystickMove}
        onPointerUp={endJoystick}
        onPointerCancel={endJoystick}
        onLostPointerCapture={resetJoystick}
      >
        <div className="battle-mobile-joystick-base">
          <div
            className="battle-mobile-joystick-knob"
            style={{ transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)` }}
          />
        </div>
      </div>

      <div className="battle-mobile-throttle">
        <button
          type="button"
          className="battle-mobile-btn battle-mobile-btn--boost"
          aria-label="Boost throttle"
          {...bindKey('shift')}
        >
          +
        </button>
        <button
          type="button"
          className="battle-mobile-btn battle-mobile-btn--brake"
          aria-label="Reduce throttle"
          {...bindKey('ctrl')}
        >
          −
        </button>
      </div>

      <div className="battle-mobile-actions">
        <button
          type="button"
          className="battle-mobile-btn battle-mobile-btn--roll"
          aria-label="Barrel roll"
          disabled={disabled}
          onPointerDown={(e) => {
            if (disabled) return;
            e.preventDefault();
            onBarrelRoll();
          }}
        >
          Roll
        </button>

        <div
          className="battle-mobile-aim"
          aria-label="Aim by dragging"
          onPointerDown={onAimDown}
          onPointerMove={onAimMove}
          onPointerUp={endAim}
          onPointerCancel={endAim}
        />

        <button
          type="button"
          className="battle-mobile-btn battle-mobile-btn--fire"
          aria-label="Fire laser"
          disabled={disabled}
          onPointerDown={(e) => {
            if (disabled) return;
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            setFiring(true);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            setFiring(false);
            try {
              e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
              // ignore
            }
          }}
          onPointerCancel={() => setFiring(false)}
          onLostPointerCapture={() => setFiring(false)}
        >
          Fire
        </button>
      </div>
    </div>
  );
}
