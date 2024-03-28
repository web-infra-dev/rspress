import * as path from 'path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  replaceRules: [
    {
      search: /content/g,
      replace: 'h1',
    },
  ],
});
