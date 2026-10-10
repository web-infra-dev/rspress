import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  // Exclude the index route from SSG so it falls back to CSR, while other
  // routes are still statically rendered
  ssg: {
    experimentalExcludeRoutePaths: [/^\/$/],
  },
});
