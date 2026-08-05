import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { getTestOutDir } from '../../utils/getTestOutDir';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  outDir: getTestOutDir('rspress-csr.config.ts'),
  ssg: false,
  title: 'Rspress SSG MDX Test',
  description: 'Rspress SSG MDX Test Description',
  markdown: {
    link: {
      checkDeadLinks: false,
    },
  },
});
