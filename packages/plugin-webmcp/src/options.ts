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

export interface NormalizedPluginWebMcpOptions {
  tools: Required<PluginWebMcpToolsOptions>;
}

export type WebMcpRuntimeOptions = NormalizedPluginWebMcpOptions;

export function normalizePluginWebMcpOptions(
  options: PluginWebMcpOptions = {},
): NormalizedPluginWebMcpOptions {
  return {
    tools: {
      currentPage: options.tools?.currentPage ?? true,
      search: options.tools?.search ?? true,
      navigate: options.tools?.navigate ?? true,
    },
  };
}
