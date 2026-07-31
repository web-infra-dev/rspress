import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { getTestOutDir } from '../../utils/getTestOutDir';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  outDir: getTestOutDir(),
  base: '/base/',
});
