import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Root } from 'hast';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { type Plugin, unified } from 'unified';
import { SKIP, visit } from 'unist-util-visit';

const simpleFilePath = path.join(__dirname, 'fixtures/simple.mdx');
const complexFilePath = path.join(__dirname, 'fixtures/complex.mdx');

const mdxToMdPlugin: Plugin<[], Root> = () => {
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
      if (parent && index !== null && Array.isArray(parent.children)) {
        parent.children.splice(index, 1, ...node.children);
        return index - 1;
      }
    });

    visit(tree, 'mdxJsxTextElement', (node, index, parent) => {
      if (parent && index !== null && Array.isArray(parent.children)) {
        parent.children.splice(index, 1, ...node.children);
        return index - 1;
      }
    });
  };
};

function process(content: string) {
  return unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(mdxToMdPlugin)
    .use(remarkStringify)
    .process(content);
}

describe('Markdown', () => {
  it('remark-simple', async () => {
    const result = await process(await readFile(simpleFilePath, 'utf-8'));
    expect(result.value).toMatchSnapshot();
  });

  it('remark-complex', async () => {
    const result = await process(await readFile(complexFilePath, 'utf-8'));
    expect(result.value).toMatchSnapshot();
  });
});
