interface ImportMetaEnv {
  /** Rspress sets this to true when building the SSG-MD bundle. */
  readonly SSG_MD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
