import type { RspressPlugin } from '@rspress/shared';

interface Options {
  /**
   * Algolia appId for link preconnect performance
   * - <link rel="preconnect" href="https://YOUR_APP_ID-dsn.algolia.net" crossorigin />
   * @link https://docsearch.algolia.com/docs/docsearch-v3#preconnect
   */
  appId?: string;
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
