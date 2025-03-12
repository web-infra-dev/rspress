import type { RspressPlugin } from '@rspress/shared';

interface Options {
  /**
   * Algolia meta tag for verification
   * - <meta name="algolia-site-verification" content="YOUR_VERIFICATION_CONTENT" />
   */
  verificationContent?: string;
}

export function pluginAlgolia(options: Options = {}): RspressPlugin {
  const { verificationContent } = options;
  return {
    name: '@rspress/plugin-algolia',
    config(config) {
      config.search = false;
      return config;
    },
    builderConfig: {
      html: {
        meta: verificationContent
          ? {
              'algolia-site-verification': {
                name: 'algolia-site-verification',
                content: verificationContent,
              },
            }
          : {},
      },
    },
  };
}
