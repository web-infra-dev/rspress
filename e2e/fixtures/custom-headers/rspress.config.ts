import * as path from 'node:path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  head: [
    '<meta name="config-string-head" content="config-string-head-value">',
    ['meta', { name: 'config-tuple-head', content: 'config-tuple-head-value' }],
    route =>
      `<meta name="config-fn-string-head" content="${route.absolutePath}">`,
    route => {
      console.log({ route });

      return [
        'meta',
        { name: 'config-fn-tuple-head', content: route.absolutePath },
      ];
    },
  ],
});
