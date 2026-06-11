import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  themeConfig: {
    sidebar: {
      accordion: true,
      '/': [
        {
          text: 'Guide',
          collapsible: true,
          items: [
            {
              text: 'Getting Started',
              link: '/guide/getting-started',
            },
            {
              text: 'Installation',
              link: '/guide/installation',
            },
          ],
        },
        {
          text: 'API Reference',
          collapsible: true,
          items: [
            {
              text: 'Config',
              link: '/api/config',
            },
            {
              text: 'Components',
              link: '/api/components',
            },
          ],
        },
        {
          text: 'Advanced',
          collapsible: true,
          items: [
            {
              text: 'Plugins',
              link: '/advanced/plugins',
            },
            {
              text: 'Themes',
              link: '/advanced/themes',
            },
          ],
        },
      ],
    },
  },
});
