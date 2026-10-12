import type { UserConfig } from '@rspress/shared';

export function resolveWebMcpOptions(config: UserConfig, enableSSG: boolean) {
  if (!config.webMcp) {
    return undefined;
  }
  if (enableSSG && !config.llms) {
    throw new Error(
      '[Rspress] webMcp requires llms: true to generate Markdown pages.',
    );
  }
  const exposedTo =
    typeof config.webMcp === 'object' ? config.webMcp.exposedTo : undefined;
  return {
    ...(exposedTo ? { exposedTo } : {}),
    markdown: enableSSG && Boolean(config.llms),
    search: config.search !== false,
  };
}
