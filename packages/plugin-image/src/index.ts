import type { RouteMeta, RspressPlugin } from '@rspress/shared';
import { remarkPlugin } from './remarkPlugin';

// const pkgRootPath = path.join(__dirname, '../../');
// const staticPath = path.join(pkgRootPath, 'static');

export interface PlaygroundOptions {
  foo?: boolean;
}

// eslint-disable-next-line import/no-mutable-exports
export let routeMeta: RouteMeta[];

export function pluginImage(
  options: Partial<PlaygroundOptions> = {},
): RspressPlugin {
  const { foo } = options;

  return {
    name: '@rspress/plugin-image',
    config(config) {
      // config.markdown = config.markdown || {};
      // The preview and playground plugin are mutually conflicting.
      // removePlugin('@rspress/plugin-preview');
      return config;
    },
    builderConfig: {},
    markdown: {
      remarkPlugins: [[remarkPlugin, { foo }]],
    },
  };
}
