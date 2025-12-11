import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginTwoslash } from '@rspress/plugin-twoslash';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [pluginTwoslash()],
});
