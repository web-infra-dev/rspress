import * as path from 'node:path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  base: '/base/',
  root: path.join(__dirname, 'doc'),
});
