interface ImportMetaEnv {
  readonly ENABLE_WEBMCP: boolean;
  readonly WEBMCP_EXPOSED_TO: string[];
  readonly ENABLE_LLMS_HINT: boolean;
  readonly ENABLE_LLMS_UI: boolean;
  readonly ENABLE_SSG_MD: boolean;
  readonly SSG_MD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
