import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RspressPlugin } from '@rspress/shared';
import rehypePluginShiki from '@shikijs/rehype';
import type { RehypeShikiOptions } from '@shikijs/rehype';
import { createCssVariablesTheme } from 'shiki';
import {
  SHIKI_TRANSFORMER_LINE_NUMBER,
  transformerLineNumber,
} from './transformers';
import { transformerAddTitle } from './transformers/add-title';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @see https://github.com/shikijs/shiki/blob/main/packages/rehype/src/types.ts
 */
export type PluginShikiOptions = RehypeShikiOptions;

const cssVariablesTheme = createCssVariablesTheme({
  name: 'css-variables',
  variablePrefix: '--shiki-',
  variableDefaults: {},
  fontStyle: true,
});

/**
 * The plugin is used to add the last updated time to the page.
 */
export function pluginShiki(
  options?: Partial<PluginShikiOptions>,
): RspressPlugin {
  const { langs, transformers = [], ...restOptions } = options || {};

  return {
    name: '@rspress/plugin-shiki',

    async config(config) {
      const newTransformers = [transformerAddTitle(), ...transformers];
      config.markdown = config.markdown || {};
      // Shiki will be integrated by rehype plugin, so we should use the javascript version markdown compiler.
      config.markdown.rehypePlugins = config.markdown.rehypePlugins || [];
      if (
        config.markdown.showLineNumbers &&
        !newTransformers.some(
          transformerItem =>
            transformerItem.name === SHIKI_TRANSFORMER_LINE_NUMBER,
        )
      ) {
        newTransformers.push(transformerLineNumber());
      }

      config.markdown.rehypePlugins.push([
        rehypePluginShiki,
        {
          theme: cssVariablesTheme,
          defaultLanguage: 'txt',
          lazy: true, // lazy load the langs, @seehttps://github.com/fuma-nama/fumadocs/blob/9b38baf2e66d7bc6f88d24b90a3857730a15fe3c/packages/core/src/mdx-plugins/rehype-code.ts#L169
          langs: ['tsx', 'ts', 'js'],
          ...restOptions,
          addLanguageClass: true,
          transformers: newTransformers,
        } satisfies RehypeShikiOptions,
      ]);
      return config;
    },
    globalStyles: join(__dirname, './shiki.css'),
  };
}
