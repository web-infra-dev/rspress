import * as path from 'node:path';
import { pluginImage } from '@rsbuild-image/rspress';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [pluginImage({ ipx: {} })],
});
