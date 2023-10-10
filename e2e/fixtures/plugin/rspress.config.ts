import path from 'path';
import { defineConfig } from 'rspress/config';
import { docPluginDemo } from './plugin';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [
    docPluginDemo(),
  ],
});
