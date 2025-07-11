import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type RspressPlugin, normalizePosixPath } from '@rspress/shared';
import type { ZoomOptions } from 'medium-zoom';

// TODO: reimplement medium-zoom in https://github.com/web-infra-dev/rspress/issues/2325
interface Options {
  selector?: string;
  options?: ZoomOptions;
}

/**
 * The plugin is used to add medium-zoom to the doc site.
 */
export function pluginMediumZoom(options: Options = {}): RspressPlugin {
  const __dirname = normalizePosixPath(
    path.dirname(fileURLToPath(import.meta.url)),
  );

  return {
    name: '@rspress/plugin-medium-zoom',
    globalUIComponents: [
      [path.join(__dirname, '../static/MediumZoom.tsx'), options],
    ],
  };
}
