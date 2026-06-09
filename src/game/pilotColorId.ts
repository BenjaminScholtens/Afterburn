import { actorColorForUuid } from '@/game/render/CanvasRenderer';
import { envScopedKey } from '@/game/envScope';

const STORAGE_KEY = envScopedKey('cks-pilot-color-id');

function createPilotColorId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `pilot-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Stable per-browser id used to pick a pilot color from localStorage. */
export function getPilotColorId(): string {
  if (typeof window === 'undefined') return 'server-pilot';
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = createPilotColorId();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return createPilotColorId();
  }
}

export function getPilotColor(): string {
  return actorColorForUuid(getPilotColorId());
}
