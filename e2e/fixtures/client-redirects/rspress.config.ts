import * as path from 'node:path';
import { defineConfig } from 'rspress/config';
import { pluginClientRedirects } from '@rspress/plugin-client-redirects';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [
    pluginClientRedirects({
      redirects: [
        {
          from: '/docs/old1',
          to: '/docs/new1',
        },
        {
          from: ['/docs/2022', '/docs/2023'],
          to: '/docs/2024',
        },
        {
          from: '^/docs/old2',
          to: '/docs/new2',
        },
        {
          from: '/docs/old3$',
          to: '/docs/new3',
        },
        {
          from: '/docs/old4',
          to: 'https://example.com',
        },
      ],
    }),
  ],
});
