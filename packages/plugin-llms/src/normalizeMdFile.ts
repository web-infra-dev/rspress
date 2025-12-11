import {
  type RouteService,
  remarkFileCodeBlock,
  remarkLink,
} from '@rspress/core';
import type { Root } from 'hast';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { type PluggableList, type Plugin, unified } from 'unified';
import { SKIP, visit } from 'unist-util-visit';

// TODO: currently skip mdxElement, expose the remarkPlugin to users
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

function noopPlugin() {}

async function normalizeMdFile(
  content: string,
  filepath: string,
  routeService: RouteService,
  base: string,
  mdxToMd: boolean,
  isMd: boolean,
  remarkPlugins: PluggableList,
): Promise<string> {
  const compiler = unified()
    .use(remarkParse)
    .use(isMd ? noopPlugin : remarkMdx)
    .use(remarkFileCodeBlock, {
      filepath,
    })
    .use(!isMd && mdxToMd ? mdxToMdPlugin : noopPlugin)
    .use(remarkLink, {
      cleanUrls: '.md',
      routeService,
      remarkLinkOptions: {
        checkDeadLinks: false,
        autoPrefix: true,
      },
      __base: base,
    } satisfies Parameters<typeof remarkLink>[0])
    .use(remarkPlugins)
    .use(remarkStringify);

  const vfile = await compiler.process({
    value: content,
    path: filepath,
  });
  const result = vfile.toString();
  if (result.trim() === '') {
    return '\n'; // avoid empty file
  }
  return result;
}

export { normalizeMdFile };
