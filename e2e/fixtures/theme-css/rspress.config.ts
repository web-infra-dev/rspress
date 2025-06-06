import * as path from 'node:path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  globalStyles: path.join(__dirname, 'global.css'),
});
