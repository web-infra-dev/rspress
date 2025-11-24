import path from 'node:path';
import type { RspressPlugin } from '@rspress/shared';
import type { ZoomOptions } from 'medium-zoom';
import { PACKAGE_ROOT } from '../constants';

// TODO: reimplement medium-zoom in https://github.com/web-infra-dev/rspress/issues/2325
interface Options {
  selector?: string;
  options?: ZoomOptions;
}

/**
 * The plugin is used to add medium-zoom to the doc site.
 */
export function pluginMediumZoom(options: Options = {}): RspressPlugin {
  return {
    name: '@rspress/plugin-medium-zoom',
    globalUIComponents: [
      [path.join(PACKAGE_ROOT, './static/MediumZoom.tsx'), options],
    ],
  };
}
