import type { Root } from 'hast';
import type { Plugin } from 'unified';
import { SKIP, visit } from 'unist-util-visit';

// TODO: currently skip mdxElement, expose the remarkPlugin to users
export const remarkMdxToMd: Plugin<[], Root> = () => {
  return tree => {
    // 1. remove all the import
    visit(tree, 'mdxjsEsm', node => {
      if (node.data?.estree?.body[0].type === 'ImportDeclaration') {
        node.value = '';
        return SKIP;
      }
    });

    // 2. mdxJsxFlowElement -> normal element
    visit(tree, 'mdxJsxFlowElement', (node, index, parent) => {
      if (parent && index !== undefined && Array.isArray(parent.children)) {
        parent.children.splice(index, 1, ...node.children);
        return index - 1;
      }
    });

    visit(tree, 'mdxJsxTextElement', (node, index, parent) => {
      if (parent && index !== undefined && Array.isArray(parent.children)) {
        parent.children.splice(index, 1, ...node.children);
        return index - 1;
      }
    });
  };
};
