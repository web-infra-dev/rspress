import type { RspressPlugin } from '@rspress/shared';

interface Options {
  selector?: string;
}

export function pluginAlgolia(options: Options = {}): RspressPlugin {
  options;
  return {
    name: '@rspress/plugin-algolia',
    builderConfig: {
      source: {
        define: {
          'process.env.IS_ALGOLIA': true,
        },
      },
      html: {
        tags: [
          {
            tag: 'link',
            attrs: {
              rel: 'preconnect',
              href: 'https://YOUR_APP_ID-dsn.algolia.net',
              crossorigin: true,
            },
          },
        ],
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
