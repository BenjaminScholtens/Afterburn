export const SHIP_EXPLOSION_TOTAL_MS = 1400;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function easeInCubic(t: number): number {
  return t ** 3;
}

export function explosionPhase(ageMs: number): {
  active: boolean;
  flash: number;
  coreOpacity: number;
  coreScale: number;
  ringOpacity: number;
  ringScale: number;
  sparkOpacity: number;
  sparkSpread: number;
} {
  if (ageMs < 0 || ageMs >= SHIP_EXPLOSION_TOTAL_MS) {
    return {
      active: false,
      flash: 0,
      coreOpacity: 0,
      coreScale: 0,
      ringOpacity: 0,
      ringScale: 0,
      sparkOpacity: 0,
      sparkSpread: 0,
    };
  }

  const flashT = Math.min(1, ageMs / 120);
  const flash = (1 - easeOutCubic(flashT)) * 0.95;

  const coreT = Math.min(1, ageMs / 520);
  const coreOpacity = (1 - easeInCubic(coreT)) * 0.92;
  const coreScale = 0.35 + easeOutCubic(coreT) * 2.8;

  const ringT = Math.min(1, Math.max(0, (ageMs - 80) / 900));
  const ringOpacity = (1 - easeInCubic(ringT)) * 0.78;
  const ringScale = 0.5 + easeOutCubic(ringT) * 4.2;

  const sparkT = Math.min(1, ageMs / 1100);
  const sparkOpacity = (1 - easeInCubic(sparkT)) * 0.88;
  const sparkSpread = easeOutCubic(sparkT) * 3.6;

  return {
    active: true,
    flash,
    coreOpacity,
    coreScale,
    ringOpacity,
    ringScale,
    sparkOpacity,
    sparkSpread,
  };
}
