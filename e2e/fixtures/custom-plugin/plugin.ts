import path from 'node:path';
import type { RspressPlugin } from '@rspress/shared';

export function docPluginDemo(): RspressPlugin {
  return {
    name: 'doc-plugin-demo',
    addPages() {
      return [
        {
          routePath: '/filepath-route',
          filepath: path.join(__dirname, 'blog', 'index.md'),
        },
        {
          routePath: '/content-route',
          content: '# Demo2',
        },
      ];
    },
  };
}
