import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { getTestOutDir } from '../../utils/getTestOutDir';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc-anchor-error'),
  outDir: getTestOutDir('rspress-anchor-error.config.ts'),
  markdown: {
    link: {
      checkAnchors: true,
    },
  },
});
