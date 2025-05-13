import { pluginImage as builderPluginImage } from '@rsbuild-image/core';
import type { PluginImageOptions as CoreOptions } from '@rsbuild-image/core';
import type { RouteMeta, RspressPlugin } from '@rspress/shared';
import { remarkPlugin } from './remarkPlugin';

// const pkgRootPath = path.join(__dirname, '../../');
// const staticPath = path.join(pkgRootPath, 'static');

export interface PluginImageOptions extends CoreOptions {}

// eslint-disable-next-line import/no-mutable-exports
export let routeMeta: RouteMeta[];

export function pluginImage(options: PluginImageOptions = {}): RspressPlugin {
  const { ...coreOpts } = options;

  return {
    name: '@rspress/plugin-image',
    config(config) {
      // config.markdown = config.markdown || {};
      // The preview and playground plugin are mutually conflicting.
      // removePlugin('@rspress/plugin-preview');
      return config;
    },
    builderConfig: {
      plugins: [builderPluginImage(coreOpts)],
    },
    markdown: {
      remarkPlugins: [[remarkPlugin, {}]],
    },
  };
}
