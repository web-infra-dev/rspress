import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { docPluginDemo } from './plugin';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [docPluginDemo()],
});
