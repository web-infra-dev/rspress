import type { RspressPlugin } from '@rspress/shared';

interface Options {
  selector?: string;
}

export function pluginAlgolia(options: Options = {}): RspressPlugin {
  options;
  return {
    name: '@rspress/plugin-algolia',
    builderConfig: {
      html: {
        meta: {
          'algolia-site-verification': {
            name: 'algolia-site-verification',
            content: '0F854AB11EB1D255',
          },
        },
      },
    },
  };
}
