import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  route: { cleanUrls: false },
  root: path.join(import.meta.dirname, 'doc'),
});
