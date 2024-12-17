import path from 'node:path';
import {
  createTransformerLineNumber,
  pluginShiki,
} from '@rspress/plugin-shiki';
import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
} from '@shikijs/transformers';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [
    pluginShiki({
      transformers: [
        transformerNotationDiff(),
        transformerNotationErrorLevel(),
        transformerNotationHighlight(),
        transformerNotationFocus(),
        createTransformerLineNumber(),
      ],
    }),
  ],
});
