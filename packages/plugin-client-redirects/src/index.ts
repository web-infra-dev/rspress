import path from 'node:path';
import type { RspressPlugin } from '@rspress/core';
import { getInlineRedirectScript } from './inlineRedirect';
import type { RedirectsOptions } from './types';

/**
 * The plugin is used to add client redirect feature to the doc site.
 */
export function pluginClientRedirects(
  options: RedirectsOptions = {},
): RspressPlugin {
  const plugin: RspressPlugin = {
    name: '@rspress/plugin-client-redirects',
    config(config, _utils, isProd) {
      const inlineRedirectScript = getInlineRedirectScript(
        options,
        config.base,
      );
      plugin.globalUIComponents = isProd
        ? [[path.join(__dirname, '../static/Redirect.tsx'), options]]
        : undefined;
      plugin.builderConfig =
        isProd && inlineRedirectScript
          ? {
              html: {
                tags: [
                  {
                    tag: 'script',
                    children: inlineRedirectScript,
                    append: false,
                  },
                ],
              },
            }
          : undefined;

      return config;
    },
  };

  return plugin;
}
