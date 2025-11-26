import {
  transformerAddLang,
  transformerAddLineNumbers,
  transformerAddTitle,
  transformerAddWrapCode,
} from '@rspress/core/shiki-transformers';
import type { RehypeShikiOptions } from '@shikijs/rehype';
import rehypeShiki from '@shikijs/rehype';
import { createCssVariablesTheme } from 'shiki';

const cssVariablesTheme = createCssVariablesTheme({
  name: 'css-variables',
  variablePrefix: '--shiki-',
  variableDefaults: {},
  fontStyle: true,
});

function createRehypeShikiOptions(
  showLineNumbers: boolean,
  defaultWrapCode: boolean,
  options?: Partial<RehypeShikiOptions>,
): RehypeShikiOptions {
  const { transformers = [], ...restOptions } = options || {};

  const newTransformers = [
    transformerAddTitle(),
    transformerAddLang(),
    transformerAddLineNumbers({ defaultShowLineNumbers: showLineNumbers }),
    transformerAddWrapCode({ defaultWrapCode }),
    ...transformers,
  ];

  return {
    theme: cssVariablesTheme,
    defaultLanguage: 'txt',
    lazy: true, // Lazy loading all langs except ['tsx', 'ts', 'js'] , @see https://github.com/fuma-nama/fumadocs/blob/9b38baf2e66d7bc6f88d24b90a3857730a15fe3c/packages/core/src/mdx-plugins/rehype-code.ts#L169
    langs: ['tsx', 'ts', 'js'],
    ...restOptions,
    transformers: newTransformers,
  };
}

export { rehypeShiki, createRehypeShikiOptions };
