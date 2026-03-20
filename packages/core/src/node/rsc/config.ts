import type { UserConfig } from '@rspress/shared';

export function isRscEnabled(config: UserConfig): boolean {
  return (
    Boolean(config.rsc && typeof config.rsc === 'object') || config.rsc === true
  );
}

export function isSsgEnabled(config: UserConfig): boolean {
  if (config.ssg === false) {
    return Boolean(config.llms);
  }

  return true;
}

export function shouldUseRscSsg(
  config: UserConfig,
  enableSSG: boolean,
): boolean {
  return enableSSG && config.ssg !== false && isRscEnabled(config);
}
