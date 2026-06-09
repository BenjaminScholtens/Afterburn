import {
  BATTLE_HIT_SHIELD_HOLD_MS,
  BATTLE_HIT_SHIELD_IN_MS,
  BATTLE_HIT_SHIELD_OUT_MS,
} from '@/config';

export const HIT_SHIELD_TOTAL_MS =
  BATTLE_HIT_SHIELD_IN_MS + BATTLE_HIT_SHIELD_HOLD_MS + BATTLE_HIT_SHIELD_OUT_MS;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function easeInCubic(t: number): number {
  return t ** 3;
}

export function hitShieldPhase(ageMs: number): {
  opacity: number;
  scale: number;
  absorb: number;
  ring: number;
} {
  if (ageMs >= HIT_SHIELD_TOTAL_MS) {
    return { opacity: 0, scale: 1, absorb: 0, ring: 0 };
  }

  const tIn = BATTLE_HIT_SHIELD_IN_MS;
  const tHold = BATTLE_HIT_SHIELD_HOLD_MS;
  const tOut = BATTLE_HIT_SHIELD_OUT_MS;

  if (ageMs < tIn) {
    const u = easeOutCubic(ageMs / tIn);
    return { opacity: u * 0.82, scale: 0.72 + u * 0.28, absorb: u, ring: u * 0.6 };
  }

  if (ageMs < tIn + tHold) {
    const u = (ageMs - tIn) / tHold;
    return { opacity: 0.82, scale: 1, absorb: 1 - u, ring: 0.6 * (1 - u * 0.5) };
  }

  const u = easeInCubic((ageMs - tIn - tHold) / tOut);
  return { opacity: 0.82 * (1 - u), scale: 1 + u * 0.12, absorb: 0, ring: 0 };
}
