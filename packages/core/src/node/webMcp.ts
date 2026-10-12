import type { UserConfig } from '@rspress/shared';

export function resolveWebMcpOptions(config: UserConfig, enableSSG: boolean) {
  if (config.webMcp === false) {
    return undefined;
  }
  const exposedTo =
    typeof config.webMcp === 'object' ? config.webMcp.exposedTo : undefined;
  return {
    ...(exposedTo ? { exposedTo } : {}),
    markdown: enableSSG && Boolean(config.llms),
    search: config.search !== false,
  };
}
