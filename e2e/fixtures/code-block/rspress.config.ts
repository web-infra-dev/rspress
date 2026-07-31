import path from 'node:path';
import { defineConfig } from '@rspress/core';
import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
} from '@shikijs/transformers';
import { getTestOutDir } from '../../utils/getTestOutDir';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  outDir: getTestOutDir(),
  markdown: {
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
