import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { siteConfig } from './siteConfig.ts';

export default defineConfig({
  ...siteConfig,
  root: path.join(import.meta.dirname, 'doc'),
});
