import type { Element, ElementContent, Root, Text } from 'hast';
import { fromHtml } from 'hast-util-from-html';
import type { BuiltinTheme, Highlighter } from 'shiki';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

interface Options {
  highlighter: Highlighter;
  theme: BuiltinTheme;
}

// TODO: migrate to official @shikijs/rehype plugin after upgrading unified/remark/rehype packages
export const rehypePluginShiki: Plugin<[Options], Root> =
  ({ highlighter, theme }) =>
  (tree: Root) => {
    visit(tree, 'element', (node, index, parent) => {
      // <pre><code>...</code></pre>
      if (
        node.tagName === 'pre' &&
        node.children[0]?.type === 'element' &&
        node.children[0].tagName === 'code'
      ) {
        const codeNode = node.children[0];
        const codeContent = (codeNode.children[0] as Text).value;
        const codeClassName = codeNode.properties?.className?.toString() || '';

        const codeMeta = codeNode.properties?.meta?.toString() || '';
        const highlightLinesReg = /{[\d,-]*}/i;
        const highlightResult = highlightLinesReg.exec(codeMeta);
        let highlightLines: number[] = [];
        if (highlightResult) {
          const highlightMatch = highlightResult[0];
          highlightLines = highlightMatch
            ?.replace(/[{}]/g, '')
            .split(',')
            .flatMap(item => {
              const [start, end] = item.split('-');
              if (end) {
                return Array.from(
                  { length: Number(end) - Number(start) + 1 },
                  (_, i) => i + Number(start),
                );
              }
              return Number(start);
            });
        }
        // for example: language-js {1,2,3-5}
        const lang = codeClassName.split(' ')[0].split('-')[1];
        if (!lang) {
          return;
        }
        const highlightedCode = highlighter.codeToHtml(codeContent, {
          lang,
          theme,
        });
        const fragmentAst = fromHtml(highlightedCode, { fragment: true });
        const preElement = fragmentAst.children[0] as Element;
        const codeElement = preElement.children[0] as Element;
        codeElement.properties!.className = `language-${lang}`;
        codeElement.properties!.meta = codeMeta;
        const codeLines = codeElement.children;
        // Take the odd lines as highlighted lines
        codeLines
          ?.filter((_, index: number) => index % 2 === 0)
          .forEach((line, index: number) => {
            if (
              line.type === 'element' &&
              highlightLines?.includes(index + 1)
            ) {
              (line.properties!.className as string[]).push(
                'code-line-highlighted',
              );
            }
          });

        // Strip the final empty span
        const lastLine = codeLines[codeLines.length - 1];
        if (lastLine.type === 'element' && lastLine.children.length === 0) {
          codeLines.pop();
        }

        parent?.children.splice(index!, 1, {
          type: 'element',
          tagName: 'pre',
          properties: {
            className: 'code',
          },
          children: [...fragmentAst.children] as ElementContent[],
        });
      }
    });
  };
