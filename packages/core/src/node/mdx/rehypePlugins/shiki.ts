import rehypeShiki from '@shikijs/rehype';
import type { RehypeShikiOptions } from '@shikijs/rehype';
import { createCssVariablesTheme } from 'shiki';
import {
  SHIKI_TRANSFORMER_LINE_NUMBER,
  transformerLineNumber,
} from './transformers';
import { transformerAddTitle } from './transformers/add-title';

const cssVariablesTheme = createCssVariablesTheme({
  name: 'css-variables',
  variablePrefix: '--shiki-',
  variableDefaults: {},
  fontStyle: true,
});

function createRehypeShikiOptions(
  showLineNumbers: boolean,
  options?: Partial<RehypeShikiOptions>,
): RehypeShikiOptions {
  const { transformers = [], ...restOptions } = options || {};

  const newTransformers = [transformerAddTitle(), ...transformers];
  if (
    showLineNumbers &&
    !newTransformers.some(
      transformerItem => transformerItem.name === SHIKI_TRANSFORMER_LINE_NUMBER,
    )
  ) {
    newTransformers.push(transformerLineNumber());
  }

  return {
    theme: cssVariablesTheme,
    defaultLanguage: 'txt',
    lazy: true, // Lazy loading all langs except ['tsx', 'ts', 'js'] , @see https://github.com/fuma-nama/fumadocs/blob/9b38baf2e66d7bc6f88d24b90a3857730a15fe3c/packages/core/src/mdx-plugins/rehype-code.ts#L169
    langs: ['tsx', 'ts', 'js'],
    ...restOptions,
    addLanguageClass: true,
    transformers: newTransformers,
  };
}

export { rehypeShiki, createRehypeShikiOptions };
