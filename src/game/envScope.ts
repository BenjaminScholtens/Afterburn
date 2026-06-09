const ENV_MARKER_KEY = 'cks-demo-env-handle';
const DEFAULT_GAME_HTTP =
  'https://game.e-zt0psk82q3bi.dev.cks-env.com/graphql';

/** Derive env slug from game URL (e.g. game.e-zt0psk82q3bi.dev.cks-env.com → e-zt0psk82q3bi). */
export function resolveEnvHandle(): string {
  const explicit = import.meta.env.VITE_ENV_HANDLE?.trim();
  if (explicit) return explicit;
  const gameHttp =
    import.meta.env.VITE_GAME_API_HTTP_URL ?? DEFAULT_GAME_HTTP;
  const m = gameHttp.match(/game\.([a-z0-9-]+)\.dev\.cks-env\.com/i);
  return m?.[1] ?? 'default';
}

export const ENV_HANDLE = resolveEnvHandle();

const SCOPED_PREFIXES = [
  'cks-canvas-token',
  'cks-canvas-guest-creds',
  'cks-battle-actor-uuid',
  'cks-pilot-color-id',
];

/** Namespaced localStorage key — isolates sessions per CKS environment. */
export function envScopedKey(base: string): string {
  return `${base}:${ENV_HANDLE}`;
}

function clearLegacyUnscopedKeys(): void {
  if (typeof localStorage === 'undefined') return;
  for (const base of SCOPED_PREFIXES) {
    try {
      localStorage.removeItem(base);
    } catch {
      // ignore
    }
  }
}

/**
 * When the configured game/mgmt URLs change, drop cached tokens and battle ids
 * from the previous environment so UDP multiplayer can reconnect cleanly.
 */
export function ensureEnvScope(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const prev = localStorage.getItem(ENV_MARKER_KEY);
    if (prev && prev !== ENV_HANDLE) {
      for (const base of SCOPED_PREFIXES) {
        localStorage.removeItem(envScopedKey(base));
      }
      clearLegacyUnscopedKeys();
    } else if (!prev) {
      // First run with env scoping — remove old unscoped keys from prior builds.
      clearLegacyUnscopedKeys();
    }
    localStorage.setItem(ENV_MARKER_KEY, ENV_HANDLE);
  } catch {
    // ignore
  }
}
