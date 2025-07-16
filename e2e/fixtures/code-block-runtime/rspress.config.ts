import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { transformerNotationHighlight } from '@shikijs/transformers';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  markdown: {
    shiki: {
      transformers: [transformerNotationHighlight()],
    },
  },
});
