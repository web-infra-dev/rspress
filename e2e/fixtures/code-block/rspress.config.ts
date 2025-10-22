import path from 'node:path';
import { defineConfig } from '@rspress/core';
import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
} from '@shikijs/transformers';

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
