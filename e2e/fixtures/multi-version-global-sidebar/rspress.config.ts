import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'docs'),
  multiVersion: {
    default: 'v1',
    versions: ['v1', 'v2'],
  },
});
