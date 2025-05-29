import type { Root } from 'hast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

export const rehypeCodeMeta: Plugin<[], Root> = () => {
  return tree => {
    visit(tree, 'element', node => {
      // <pre><code>...</code></pre>
      // 1. Find pre element
      if (
        node.tagName === 'pre' &&
        node.children[0]?.type === 'element' &&
        node.children[0].tagName === 'code'
      ) {
        const codeNode = node.children[0];
        // https://github.com/shikijs/shiki/blob/4b8e6331aca7f8cd77e280120e67933525550c36/packages/rehype/src/handlers.ts#L59C46-L59C56
        codeNode.properties.metastring = codeNode.data?.meta;
      }
    });
  };
};
