import type { RspressPlugin } from '@rspress/core';
import { transformerTwoslash } from '@shikijs/twoslash';
import type { ShikiTransformerContextCommon } from '@shikijs/types';
import type { Element, ElementContent } from 'hast';
import type { Code } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { defaultHandlers, toHast } from 'mdast-util-to-hast';

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

/**
 * Plugin to applies Twoslash transformations to code blocks.
 */
export function pluginTwoslash(): RspressPlugin {
  return {
    name: '@rspress/plugin-twoslash',
    config(config) {
      config.markdown ??= {};
      config.markdown.shiki ??= {};
      config.markdown.shiki.transformers ??= [];
      config.markdown.shiki.transformers.push(
        transformerTwoslash({
          rendererRich: {
            renderMarkdown,
            renderMarkdownInline,
          },
        }),
      );
      return config;
    },
  };
}
