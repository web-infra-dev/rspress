import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { docPluginDemo } from './plugin';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  plugins: [docPluginDemo()],
});
