import { defineConfig } from '../../../packages/core/dist/index.js';
export default defineConfig({
  root: './docs',
  title: 'Midscene Docs',
  description: 'Local documentation fixture for AI E2E',
  themeConfig: {
    nav: [{ text: 'Guide', link: '/guide/start' }],
    sidebar: {
      '/': [
        { text: 'Welcome', link: '/' },
        { text: 'Getting started', link: '/guide/start' },
        { text: 'Deployment', link: '/guide/deployment' },
      ],
    },
  },
});
