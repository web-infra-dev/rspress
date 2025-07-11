import path from 'node:path';
import type { RspressPlugin } from 'rspress/core';
import type { RedirectsOptions } from './types';

/**
 * The plugin is used to add client redirect feature to the doc site.
 */
export function pluginClientRedirects(
  options: RedirectsOptions = {},
): RspressPlugin {
  return {
    name: '@rspress/plugin-client-redirects',
    globalUIComponents: [
      [path.join(__dirname, '../static/Redirect.tsx'), options],
    ],
  };
}
