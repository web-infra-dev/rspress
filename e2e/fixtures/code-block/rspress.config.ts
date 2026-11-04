import path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  markdown: {
    shiki: {
      langAlias: {
        ejs: 'js', // 'js' is in the langs array
      },
    },
  },
});
