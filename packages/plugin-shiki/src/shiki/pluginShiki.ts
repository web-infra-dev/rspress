import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RspressPlugin } from '@rspress/shared';
import {
  type BuiltinLanguage,
  type BuiltinTheme,
  type ShikiTransformer,
  type SpecialLanguage,
  createCssVariablesTheme,
} from 'shiki';
import { getHighlighter } from './highlighter';
import { rehypePluginShiki } from './rehypePlugin';
import {
  SHIKI_TRANSFORMER_LINE_NUMBER,
  createTransformerLineNumber,
} from './transformers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface PluginShikiOptions {
  /**
   * Code highlighting theme, @see https://shiki.style/themes
   */
  theme: BuiltinTheme | 'css-variables';
  /**
   * Code highlighting language, @see https://shiki.style/languages
   */
  langs: Array<BuiltinLanguage | SpecialLanguage>;
  /**
   * Custom shiki transformer, @see https://shiki.style/guide/transformers
   */
  transformers: ShikiTransformer[];
}

export const SHIKI_DEFAULT_HIGHLIGHT_LANGUAGES: BuiltinLanguage[] = [
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
        !transformers.some(
          transformerItem =>
            transformerItem.name === SHIKI_TRANSFORMER_LINE_NUMBER,
        )
      ) {
        transformers.push(createTransformerLineNumber());
      }
      const highlighter = await getHighlighter({
        themes: [cssVariablesTheme],
        langs: [...SHIKI_DEFAULT_HIGHLIGHT_LANGUAGES, ...langs],
        transformers,
      });

      config.markdown.rehypePlugins.push([
        rehypePluginShiki,
        { highlighter, theme },
      ]);
      return config;
    },
    globalStyles: join(__dirname, '../shiki.css'),
  };
}
