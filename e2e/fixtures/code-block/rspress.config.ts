import path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  // The test fixture serves emitted files directly without URL rewriting.
  route: { cleanUrls: false },
  markdown: {
    shiki: {
      langAlias: {
        ejs: 'js', // 'js' is in the langs array
      },
    },
  },
});
