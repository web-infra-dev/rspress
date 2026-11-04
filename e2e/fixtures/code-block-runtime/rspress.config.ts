import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { transformerNotationHighlight } from '@rspress/core/shiki-transformers';

export default defineConfig({
  root: path.join(import.meta.dirname, 'docs'),
  markdown: {
    shiki: {
      transformers: [transformerNotationHighlight()],
    },
  },
});
