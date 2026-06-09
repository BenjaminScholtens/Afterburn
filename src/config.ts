/** Fixed dev-tier configuration for the collaborative canvas tutorial. */
/** Proxied by Vite (local) or Netlify `_redirects` (production). */
export const MANAGEMENT_URL =
  import.meta.env.VITE_MANAGEMENT_API_URL ?? '/mgmt-api';

/** Always set explicitly — older CrowdyJS on GitHub does not append /graphql. */
export const MANAGEMENT_GRAPHQL_URL =
  import.meta.env.VITE_MANAGEMENT_GRAPHQL_URL ??
  `${MANAGEMENT_URL.replace(/\/$/, '')}/graphql`;

export const GAME_HTTP_URL =
  import.meta.env.VITE_GAME_API_HTTP_URL ??
  'https://game.e-zt0psk82q3bi.dev.cks-env.com/graphql';

export const GAME_WS_URL =
  import.meta.env.VITE_GAME_API_WS_URL ??
  'wss://game.e-zt0psk82q3bi.dev.cks-env.com/graphql';

export const APP_ID = import.meta.env.VITE_APP_ID ?? '1';
export const ORG_ID = import.meta.env.VITE_ORG_ID ?? '1';
export { ENV_HANDLE } from '@/game/envScope';

/** Paint cell size in world pixels. */
export const TILE_SIZE = 8;

/** Server voxels per chunk axis. */
export const CHUNK_VOXEL_SIZE = 16;

export const ACTOR_SYNC_INTERVAL_MS = 100;
/** Battle pose sync — 30 Hz keeps rival positions tight at cruise speed. */
export const BATTLE_ACTOR_SYNC_INTERVAL_MS = 33;
export const ACTOR_STATE_BYTES = 96;

/** Viewport dimensions in world pixels. */
export const VIEWPORT_WIDTH = 640;
export const VIEWPORT_HEIGHT = 480;

/** Edge margin (px) before viewport scroll / push activates. */
export const VIEWPORT_EDGE_MARGIN = 24;

/** Single-player edge scroll speed (world px / frame at 60fps baseline). */
export const VIEWPORT_SCROLL_SPEED = 4;

/** Collaborative push speed multiplier. */
export const VIEWPORT_PUSH_SPEED = 3;

/** Star Fox–style battle royale arena (world pixels). */
export const BATTLE_ARENA_CENTER_X = 0;
export const BATTLE_ARENA_CENTER_Y = 0;
export const BATTLE_ARENA_CENTER_Z = 0;
/** Playable sector scale — 4× default arena for more room to fly. */
export const BATTLE_ARENA_SCALE = 4;
/** Solid arena floor — dome shell sits on this Y plane. */
export const BATTLE_ARENA_FLOOR_Y = -64 * BATTLE_ARENA_SCALE;
export const BATTLE_INITIAL_ZONE_RADIUS = 1400 * BATTLE_ARENA_SCALE;
export const BATTLE_MIN_ZONE_RADIUS = 120 * BATTLE_ARENA_SCALE;
/** Radar shows blips within this world distance. */
export const BATTLE_RADAR_RANGE = 650 * BATTLE_ARENA_SCALE;
export const BATTLE_MATCH_MS = 480_000;
export const BATTLE_ZONE_DAMAGE_PER_SEC = 10;
export const BATTLE_SHIP_MAX_HP = 100;
export const BATTLE_SHOT_DAMAGE = 14;
/** World-space hit radius against rival ship centers (with extrapolation). */
export const BATTLE_HIT_RADIUS = 22;
/** Hit shield VFX timing (ms). */
export const BATTLE_HIT_SHIELD_IN_MS = 120;
export const BATTLE_HIT_SHIELD_HOLD_MS = 200;
export const BATTLE_HIT_SHIELD_OUT_MS = 450;
export const BATTLE_FIRE_COOLDOWN_MS = 200;
/** Throttle range — 0% crawl to 100% max boost (Star Fox 64 style). */
export const BATTLE_THROTTLE_MIN_SPEED = 0.35;
export const BATTLE_THROTTLE_MAX_SPEED = 5.5;
export const BATTLE_THROTTLE_DEFAULT = 0.55;
export const BATTLE_THROTTLE_RATE = 0.022;
/** @deprecated Use BATTLE_THROTTLE_MAX_SPEED */
export const BATTLE_SHIP_CRUISE_SPEED = BATTLE_THROTTLE_MAX_SPEED;
export const BATTLE_YAW_RATE = 0.05;
export const BATTLE_PITCH_RATE = 0.038;
export const BATTLE_MOUSE_SENSITIVITY = 0.0024;
/** Star Fox 64 barrel roll — full spin duration and cooldown (ms). */
export const BATTLE_BARREL_ROLL_MS = 520;
export const BATTLE_BARREL_ROLL_COOLDOWN_MS = 900;
/** Peak lateral strafe speed during a barrel roll (world units / frame @ 60fps). */
export const BATTLE_BARREL_ROLL_STRAFE_RATE = 5.2;
/** Ms upside-down without pitch input before gravity auto-level begins. */
export const BATTLE_INVERT_RECOVER_DELAY_MS = 1_800;
/** Pitch correction speed when auto-leveling (rad / frame @ 60fps). */
export const BATTLE_INVERT_RECOVER_RATE = 0.022;
/** @deprecated Use BATTLE_SHIP_CRUISE_SPEED */
export const BATTLE_SHIP_MAX_SPEED = BATTLE_SHIP_CRUISE_SPEED;
export const BATTLE_PROJECTILE_SPEED = 22;
export const BATTLE_PROJECTILE_LIFETIME_MS = 1800;
export const BATTLE_LASER_MUZZLE_OFFSET = 3.5;
/** Drop remote ships with no UDP update for this long (ms). */
export const BATTLE_REMOTE_ACTOR_TIMEOUT_MS = 4_000;
/** Collision hull radius for floor / dome impacts. */
export const BATTLE_SHIP_HULL_RADIUS = 4;
export const BATTLE_FLOOR_CRASH_DAMAGE = 15;
export const BATTLE_DOME_CRASH_DAMAGE = 12;
export const BATTLE_CRASH_COOLDOWN_MS = 350;

export const DOCS_BASE = 'https://docs.crowdedkingdoms.com/build-a-game';

export const CONFIG_DISPLAY = {
  ManagementApiUrl: MANAGEMENT_URL,
  GameApiHttpUrl: GAME_HTTP_URL,
  GameApiWsUrl: GAME_WS_URL,
  AppId: APP_ID,
  OrgId: ORG_ID,
} as const;
