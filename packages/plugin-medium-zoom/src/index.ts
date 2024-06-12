import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePosixPath, type RspressPlugin } from '@rspress/shared';
import type { ZoomOptions } from 'medium-zoom';

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
      [path.posix.join(__dirname, '../src/components/MediumZoom.tsx'), options],
    ],
  };
}
