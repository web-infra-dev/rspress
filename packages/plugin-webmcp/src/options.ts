export interface PluginWebMcpToolsOptions {
  /** @default true */
  currentPage?: boolean;
  /** @default true */
  search?: boolean;
  /** @default true */
  navigate?: boolean;
}

export interface PluginWebMcpOptions {
  tools?: PluginWebMcpToolsOptions;
}

export interface WebMcpRuntimeOptions {
  tools: Required<PluginWebMcpToolsOptions>;
}

export function normalizePluginWebMcpOptions(
  options: PluginWebMcpOptions = {},
): WebMcpRuntimeOptions {
  return {
    tools: {
      currentPage: options.tools?.currentPage ?? true,
      search: options.tools?.search ?? true,
      navigate: options.tools?.navigate ?? true,
    },
  };
}
