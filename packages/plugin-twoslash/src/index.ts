import path from 'node:path';
import type { RspressPlugin } from '@rspress/core';
import { logger } from '@rspress/core';
import { transformerTwoslash } from '@shikijs/twoslash';
import type { ShikiTransformerContextCommon } from '@shikijs/types';
import type { Element, ElementContent } from 'hast';
import type { Code } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { defaultHandlers, toHast } from 'mdast-util-to-hast';
import picocolors from 'picocolors';
import type { TwoslashOptions } from 'twoslash';
import { removeTwoslashNotations } from 'twoslash';

const staticPath = path.join(__dirname, '../static');

const loggerPrefix = picocolors.dim('[@rspress/plugin-twoslash]');

function prettyPrintCode(code: string): string {
  return code
    .split(/\n/g)
    .slice(0, 15) // Show only first 15 lines of code
    .map((line, index) => {
      return `${picocolors.dim(String(index + 1).padStart(2))} | ${line}`;
    })
    .join('\n')
    .trim();
}

function onError(error: unknown, code: string): string {
  logger.error(
    loggerPrefix,
    `Twoslash error in code:\n${prettyPrintCode(code)}`,
    `\n${picocolors.dim(String(error))}`,
  );

  // Ignore the error during development to avoid stopping the build, and return the original code
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (!isDevelopment) {
    throw error;
  }
  return removeTwoslashNotations(code);
}

function renderMarkdown(
  this: ShikiTransformerContextCommon,
  markdown: string,
): ElementContent[] {
  return (
    toHast(
      fromMarkdown(
        // Replace JSDoc {@link ...} with inline code
        markdown.replaceAll(/\{@link ([^}]*)}/g, '`$1`'),
        {
          mdastExtensions: [gfmFromMarkdown()],
        },
      ),
      {
        handlers: {
          code: (state, node: Code) => {
            if (node.lang) {
              return <Element>{
                type: 'element',
                tagName: 'code',
                properties: {},
                // Use Shikijs codeToHast to handle syntax highlighting
                // See: https://github.com/shikijs/shiki/blob/9260f3fd109eca7bece80c92196f627ccae202d0/packages/twoslash/src/renderer-rich.ts#L245-L254
                children: this.codeToHast(node.value, {
                  ...this.options,
                  lang: node.lang,
                  transformers: [],
                  structure: node.value.trim().includes('\n')
                    ? 'classic'
                    : 'inline',
                }).children,
              };
            }
            return defaultHandlers.code(state, node);
          },
        },
      },
    ) as Element
  ).children;
}

function renderMarkdownInline(
  this: ShikiTransformerContextCommon,
  md: string,
): ElementContent[] {
  const children = renderMarkdown.call(
    this,
    // Wrap the first word with backticks to make it stand out
    md.replace(/^([\w$-]+)/, '`$1` '),
  );

  // If the result is a single paragraph, unwrap it to return just its children
  if (
    children.length === 1 &&
    children[0]!.type === 'element' &&
    children[0]!.tagName === 'p'
  ) {
    return children[0]!.children;
  }

  return children;
}

export interface PluginTwoslashOptions {
  /**
   * Requires twoslash to be presented in the code block meta to apply this transformer
   * @default true
   */
  explicitTrigger?: boolean;
  /**
   * Cache the TypeScript language servers based on compiler options when calling `createTwoslasher`
   * @default true
   */
  cache?: boolean;
  /**
   * Options to pass to Twoslash
   */
  twoslashOptions?: TwoslashOptions;
}

/**
 * Plugin to applies Twoslash transformations to code blocks.
 */
export function pluginTwoslash(options?: PluginTwoslashOptions): RspressPlugin {
  const {
    explicitTrigger = true,
    cache = true,
    twoslashOptions,
  } = options || {};

  return {
    name: '@rspress/plugin-twoslash',
    globalUIComponents: [
      path.join(staticPath, 'global-components', 'TwoslashPopup.tsx'),
    ],
    globalStyles: path.join(staticPath, 'global-styles', 'twoslash.css'),
    config(config) {
      config.markdown ??= {};
      config.markdown.shiki ??= {};
      config.markdown.shiki.transformers ??= [];
      config.markdown.shiki.transformers.push(
        transformerTwoslash({
          explicitTrigger,
          cache,
          twoslashOptions,
          onShikiError: onError,
          onTwoslashError: onError,
          rendererRich: {
            renderMarkdown,
            renderMarkdownInline,
            hast: {
              completionToken: {
                tagName: 'twoslash-popup-trigger',
                properties: {
                  class: 'twoslash-popup-trigger',
                },
              },
              // TODO: css changes
              // completionPopup: {
              //   properties: {
              //     class: 'twoslash-popup-inner',
              //   },
              // },
              completionCompose: ({ cursor, popup }) => [
                cursor,
                <Element>{
                  type: 'element',
                  tagName: 'twoslash-popup-container',
                  properties: {
                    class: 'twoslash-popup-container rp-copy-ignore',
                    'data-always': 'true',
                  },
                  children: [
                    {
                      type: 'element',
                      tagName: 'twoslash-popup-arrow',
                      properties: { class: 'twoslash-popup-arrow' },
                      children: [],
                    },
                    {
                      type: 'element',
                      tagName: 'div',
                      properties: { class: 'twoslash-popup-inner' },
                      children: [popup],
                    },
                  ],
                },
              ],
              hoverToken: {
                tagName: 'twoslash-popup-trigger',
                // TODO: css changes
                // properties: {
                //   class: 'twoslash-popup-trigger',
                // },
              },
              hoverPopup: {
                tagName: 'twoslash-popup-container',
                properties: {
                  class: 'twoslash-popup-container rp-copy-ignore',
                },
                children: elements => [
                  {
                    type: 'element',
                    tagName: 'twoslash-popup-arrow',
                    properties: { class: 'twoslash-popup-arrow' },
                    children: [],
                  },
                  {
                    type: 'element',
                    tagName: 'div',
                    properties: { class: 'twoslash-popup-inner' },
                    children: elements,
                  },
                ],
              },
              queryToken: {
                tagName: 'twoslash-popup-trigger',
                properties: {
                  class: 'twoslash-popup-trigger',
                },
              },
              queryPopup: {
                tagName: 'twoslash-popup-container',
                properties: {
                  class: 'twoslash-popup-container rp-copy-ignore',
                  'data-always': 'true',
                },
                children: elements => [
                  {
                    type: 'element',
                    tagName: 'twoslash-popup-arrow',
                    properties: { class: 'twoslash-popup-arrow' },
                    children: [],
                  },
                  {
                    type: 'element',
                    tagName: 'div',
                    properties: { class: 'twoslash-popup-inner' },
                    // First element is an arrow, so exclude it
                    // See: https://github.com/shikijs/shiki/blob/9260f3fd109eca7bece80c92196f627ccae202d0/packages/twoslash/src/renderer-rich.ts#L396-L401
                    children: elements.slice(1),
                  },
                ],
              },
            },
          },
        }),
      );
      return config;
    },
  };
}
