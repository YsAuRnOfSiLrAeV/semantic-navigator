/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_DEFAULT_POINTS_LIMIT: string;
  readonly VITE_LIMIT_INPUT_DEBOUNCE_MS: string;
  readonly VITE_MAX_REVIEW_TAGS: string;
  readonly VITE_SEMANTIC_TOP_K: string;
  readonly VITE_DEFAULT_DATASET_ID: string;
  readonly VITE_ENABLED_DATASET_IDS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
