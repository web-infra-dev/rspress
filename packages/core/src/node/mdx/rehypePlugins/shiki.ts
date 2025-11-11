import type { RehypeShikiOptions } from '@shikijs/rehype';
import rehypeShiki from '@shikijs/rehype';
import { createCssVariablesTheme } from 'shiki';
import { transformerLineNumber, transformerWrapCode } from './transformers';
import { transformerAddLang } from './transformers/add-lang';
import { transformerAddTitle } from './transformers/add-title';

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
    // Always add line number transformer with default config
    transformerLineNumber({ defaultShowLineNumbers: showLineNumbers }),
    // Always add wrap code transformer with default config
    transformerWrapCode({ defaultWrapCode }),
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
