import * as NodePath from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginRss } from '@rspress/plugin-rss';
import fixture from './fixture.json' with { type: 'json' };
import { getTestOutDir } from '../../utils/getTestOutDir';

export default defineConfig({
  root: NodePath.resolve(import.meta.dirname, 'doc'),
  outDir: getTestOutDir(),
  title: fixture.title,
  base: fixture.base,
  plugins: [
    pluginRss({
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
