import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'docs'),
  globalUIComponents: [
    path.join(import.meta.dirname, '../multi-version/Navigation.tsx'),
  ],
  multiVersion: {
    default: 'v1',
    versions: ['v1', 'v2'],
  },
});
