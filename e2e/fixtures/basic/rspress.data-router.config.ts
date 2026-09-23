import path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'data-router-doc'),
  outDir: 'dist-data-router',
  base: '/docs/',
  llms: true,
  route: { cleanUrls: true },
  globalUIComponents: [
    path.join(import.meta.dirname, 'data-router-doc/_controls.tsx'),
  ],
});
