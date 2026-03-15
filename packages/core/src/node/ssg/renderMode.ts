import type { UserConfig } from '@rspress/shared';

export type SsgRenderMode = 'ssr' | 'rsc';

export function getSsgRenderMode(config: UserConfig): SsgRenderMode {
  const ssg = config.ssg;
  if (
    ssg &&
    typeof ssg === 'object' &&
    'renderMode' in ssg &&
    ssg.renderMode === 'rsc'
  ) {
    return 'rsc';
  }

  return 'ssr';
}

export function isRscRenderMode(config: UserConfig): boolean {
  return getSsgRenderMode(config) === 'rsc';
}
