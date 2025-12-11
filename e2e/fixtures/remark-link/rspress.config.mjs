import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  base: '/base',
  markdown: {
    link: {
      checkDeadLinks: {
        excludes: ['/ignored'],
      },
    },
  },
  plugins: [
    {
      name: 'virtal',
      addPages() {
        return [
          {
            routePath: '/virtual',
            content: 'Virtual Content',
          },
        ];
      },
    },
  ],
});
