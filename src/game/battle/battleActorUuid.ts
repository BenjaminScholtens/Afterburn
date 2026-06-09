import { generateCrowdyUuid } from '@crowdedkingdomstudios/crowdyjs';
import { envScopedKey } from '@/game/envScope';

const STORAGE_KEY = envScopedKey('cks-battle-actor-uuid');

/** Stable per-browser battle ship id — survives refresh so UDP updates resume the same actor. */
export function getBattleActorUuid(): string {
  if (typeof window === 'undefined') return generateCrowdyUuid();
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = generateCrowdyUuid();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return generateCrowdyUuid();
  }
}

/** Drop persisted id after elimination so the next match gets a fresh ship. */
export function clearBattleActorUuid(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
