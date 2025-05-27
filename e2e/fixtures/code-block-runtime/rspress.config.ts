import * as path from 'node:path';
import { transformerNotationHighlight } from '@shikijs/transformers';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  markdown: {
    shiki: {
      transformers: [transformerNotationHighlight()],
    },
  },
});
