import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginTwoslash } from '@rspress/plugin-twoslash';
import { getTestOutDir } from '../../utils/getTestOutDir';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  outDir: getTestOutDir(),
  plugins: [pluginTwoslash()],
});
