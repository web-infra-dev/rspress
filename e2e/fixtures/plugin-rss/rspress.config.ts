import * as NodePath from 'node:path';
import { pluginRss } from '@rspress/plugin-rss';
import { defineConfig } from 'rspress/config';
import fixture from './fixture.json';

export default defineConfig({
  root: NodePath.resolve(__dirname, 'doc'),
  title: fixture.title,
  base: fixture.base,
  plugins: [
    pluginRss({
      siteUrl: fixture.siteUrl,
      feed: [
        {
          id: 'blog',
          test: '/blog/',
          output: {
            type: 'rss',
            /* use .xml for preview server */
            filename: 'blog.xml',
          },
        },
        {
          id: 'releases',
          test: '/releases/',
          title: 'FooBar Releases',
          output: { filename: 'feed.xml', dir: 'releases' },
        },
      ],
    }),
  ],
});
