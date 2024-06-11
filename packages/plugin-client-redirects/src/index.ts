import path from 'path';
import { type RspressPlugin } from '@rspress/shared';
import { RedirectsOptions } from './types';

/**
 * The plugin is used to add client redirect feature to the doc site.
 */
export function pluginClientRedirects(
  options: RedirectsOptions = {},
): RspressPlugin {
  return {
    name: '@rspress/plugin-client-redirects',
    globalUIComponents: [
      [path.join(__dirname, '../src/components/Redirect.tsx'), options],
    ],
  };
}
