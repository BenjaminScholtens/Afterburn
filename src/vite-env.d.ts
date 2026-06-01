/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MANAGEMENT_API_URL?: string;
  readonly VITE_GAME_API_HTTP_URL?: string;
  readonly VITE_GAME_API_WS_URL?: string;
  readonly VITE_APP_ID?: string;
  readonly VITE_ORG_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
