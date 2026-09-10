import path from 'node:path';
import { defineConfig } from '@rspress/core';
import config from './rspress.config';

export default defineConfig({
  ...config,
  root: path.join(import.meta.dirname, 'doc-empty'),
});
