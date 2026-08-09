export interface PluginWebMcpToolsOptions {
  /**
   * Expose site metadata, locales, versions, navigation, and sidebar.
   * @default true
   */
  siteInfo?: boolean;
  /**
   * Expose filtered, paginated page metadata.
   * @default true
   */
  listPages?: boolean;
  /**
   * Expose Markdown retrieval for any known route.
   * @default true
   */
  getPage?: boolean;
  /**
   * Expose metadata and Markdown for the active route.
   * @default true
   */
  currentPage?: boolean;
  /**
   * Expose documentation search when a search provider is available.
   * @default true
   */
  search?: boolean;
  /**
   * Expose navigation to known internal routes.
   * @default true
   */
  navigate?: boolean;
}

export interface PluginWebMcpOptions {
  /**
   * Secure cross-origin agents allowed to discover and execute built-in tools.
   * Same-origin and browser-integrated agents do not require this option.
   */
  exposedTo?: string[];
  tools?: PluginWebMcpToolsOptions;
}

export interface WebMcpRuntimeOptions {
  exposedTo?: string[];
  tools: Required<PluginWebMcpToolsOptions>;
}

export function normalizePluginWebMcpOptions(
  options: PluginWebMcpOptions = {},
): WebMcpRuntimeOptions {
  return {
    ...(options.exposedTo === undefined
      ? {}
      : { exposedTo: [...options.exposedTo] }),
    tools: {
      siteInfo: options.tools?.siteInfo ?? true,
      listPages: options.tools?.listPages ?? true,
      getPage: options.tools?.getPage ?? true,
      currentPage: options.tools?.currentPage ?? true,
      search: options.tools?.search ?? true,
      navigate: options.tools?.navigate ?? true,
    },
  };
}
