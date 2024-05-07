import { join } from 'path';
import { getHighlighter } from './highlighter';
import { rehypePluginShiki } from './rehypePlugin';
import {
  SHIKI_TRANSFORMER_LINE_NUMBER,
  createTransformerLineNumber,
} from './transformers/line-number';

import type { Lang } from 'shiki';
import type { RspressPlugin } from '@rspress/shared';
import type { ITransformer } from './types';

export interface PluginShikiOptions {
  /**
   * The theme of shiki.
   */
  theme?: string;
  /**
   * The languages to highlight.
   */
  langs?: Lang[];
  /**
   * The transformers to transform the code block.
   */
  transformers?: ITransformer[];
}

export const SHIKI_DEFAULT_HIGHLIGHT_LANGUAGES = [
  'js',
  'ts',
  'jsx',
  'tsx',
  'json',
  'css',
  'scss',
  'less',
  'xml',
  'diff',
  'yaml',
  'md',
  'mdx',
  'bash',
];

/**
 * The plugin is used to add the last updated time to the page.
 */
export function pluginShiki(options?: PluginShikiOptions): RspressPlugin {
  const {
    theme = 'css-variables',
    langs = [],
    transformers = [],
  } = options || {};

  return {
    name: '@rspress/plugin-shiki',

    async config(config) {
      config.markdown = config.markdown || {};
      // Shiki will be integrated by rehype plugin, so we should use the javascript version markdown compiler.
      config.markdown.mdxRs = false;
      config.markdown.codeHighlighter = 'shiki';
      config.markdown.rehypePlugins = config.markdown.rehypePlugins || [];
      if (
        config.markdown.showLineNumbers &&
        !transformers.includes(
          (transformerItem: ITransformer) =>
            transformerItem.name === SHIKI_TRANSFORMER_LINE_NUMBER,
        )
      ) {
        transformers.push(createTransformerLineNumber());
      }
      const highlighter = await getHighlighter({
        theme,
        langs: [...SHIKI_DEFAULT_HIGHLIGHT_LANGUAGES, ...langs] as Lang[],
        transformers,
      });

      config.markdown.rehypePlugins.push([rehypePluginShiki, { highlighter }]);
      return config;
    },
    globalStyles: join(__dirname, '../shiki.css'),
  };
}
