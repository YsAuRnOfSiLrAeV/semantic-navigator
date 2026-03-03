/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_DEFAULT_POINTS_LIMIT: string;
  readonly VITE_LIMIT_INPUT_DEBOUNCE_MS: string;
  readonly VITE_MAX_REVIEW_TAGS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
