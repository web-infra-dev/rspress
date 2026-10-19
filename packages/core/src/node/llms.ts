import type { UserConfig } from '@rspress/shared';

export function isLlmsUIEnabled(config: UserConfig): boolean {
  return Boolean(config.themeConfig?.llmsUI ?? config.llms);
}

export function isLlmsHintEnabled(
  config: UserConfig,
  enableSSG: boolean,
  output: 'html' | 'markdown' = 'html',
): boolean {
  const llmsUI = config.themeConfig?.llmsUI;
  return (
    enableSSG &&
    (output === 'markdown' ? Boolean(config.llms) : config.ssg !== false) &&
    isLlmsUIEnabled(config) &&
    (typeof llmsUI !== 'object' || llmsUI.injectLlmsHint !== false)
  );
}
