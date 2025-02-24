import type { Root } from 'hast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

export const rehypePluginCodeMeta: Plugin<[], Root> = () => {
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
        // language-foo
        codeNode.properties.meta = codeNode.data?.meta as string;
      }
    });
  };
};
