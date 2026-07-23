/// <reference types='@rslib/core/types' />

interface ImportMetaEnv {
  readonly ENABLE_LLMS_HINT: boolean;
  readonly ENABLE_LLMS_UI: boolean;
  readonly SSG_MD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
