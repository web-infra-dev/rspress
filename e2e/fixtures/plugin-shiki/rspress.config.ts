import path from 'node:path';
import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
} from '@shikijs/transformers';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  markdown: {
    showLineNumbers: true,
    shiki: {
      langAlias: {
        ejs: 'js', // 'js' is in the langs array
      },
      transformers: [
        transformerNotationDiff(),
        transformerNotationErrorLevel(),
        transformerNotationHighlight(),
        transformerNotationFocus(),
      ],
    },
  },
});
