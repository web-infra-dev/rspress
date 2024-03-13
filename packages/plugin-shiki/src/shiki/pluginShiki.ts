import { join } from 'path';
import type { RspressPlugin } from '@rspress/shared';
import { DEFAULT_HIGHLIGHT_LANGUAGES } from '@rspress/shared';
import type { Lang } from 'shiki';
import { getHighlighter } from './highlighter';
import { rehypePluginShiki } from './rehypePlugin';
import type { ITransformer } from './types';
import {
  SHIKI_TRANSFORMER_LINE_NUMBER,
  createTransformerLineNumber,
} from './transformers/line-number';

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
        langs: [
          ...DEFAULT_HIGHLIGHT_LANGUAGES.map(item =>
            Array.isArray(item) ? item[0] : item,
          ),
          ...langs,
        ] as Lang[],
        transformers,
      });

      config.markdown.rehypePlugins.push([rehypePluginShiki, { highlighter }]);
      return config;
    },
    globalStyles: join(__dirname, '../shiki.css'),
  };
}
