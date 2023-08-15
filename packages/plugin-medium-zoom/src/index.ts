import path from 'path';
import { fileURLToPath } from 'url';
import type { RspressPlugin } from '@rspress/shared';

/**
 * The plugin is used to add medium-zoom to the doc site.
 */
export function pluginMediumZoom(): RspressPlugin {
  const __dirname = path
    .dirname(fileURLToPath(import.meta.url))
    // Fix: adapt windows
    .replace(/\\/g, '/');
  return {
    name: '@rspress/plugin-medium-zoom',
    globalUIComponents: [
      path.posix.join(__dirname, '../src/components/MediumZoom.tsx'),
    ],
  };
}
