import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginTwoslash } from '@rspress/plugin-twoslash';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  plugins: [pluginTwoslash()],
});
