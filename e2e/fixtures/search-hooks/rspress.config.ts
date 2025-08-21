import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  title: 'rspress',
  root: path.join(__dirname, 'doc'),
  search: {
    searchHooks: path.join(__dirname, 'theme/searchHooks.tsx'),
  },
});
