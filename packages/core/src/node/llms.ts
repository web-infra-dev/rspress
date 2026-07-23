import type { UserConfig } from '@rspress/shared';

export function isLlmsUIEnabled(config: UserConfig): boolean {
  return Boolean(config.themeConfig?.llmsUI ?? config.llms);
}

export function isLlmsHintEnabled(
  config: UserConfig,
  enableSSG: boolean,
): boolean {
  const llmsUI = config.themeConfig?.llmsUI;
  return (
    enableSSG &&
    config.ssg !== false &&
    isLlmsUIEnabled(config) &&
    (typeof llmsUI !== 'object' || llmsUI.injectLlmsHint !== false)
  );
}
