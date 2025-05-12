import * as path from 'node:path';
import { pluginImage } from '@rspress/plugin-image';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [pluginImage({ foo: true })],
});
