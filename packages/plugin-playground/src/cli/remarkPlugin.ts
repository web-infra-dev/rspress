import path, { join } from 'path';
import { visit } from 'unist-util-visit';
import fs from '@modern-js/utils/fs-extra';
import type { RouteMeta } from '@rspress/shared';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import { getNodeAttribute, getNodeMeta } from './utils';

function createPlaygroundNode(
  currentNode: any,
  attrs: Array<[string, string]>,
) {
  Object.assign(currentNode, {
    type: 'mdxJsxFlowElement',
    name: 'Playground',
    attributes: attrs.map(it => ({
      type: 'mdxJsxAttribute',
      name: it[0],
      value: it[1],
    })),
  });
}

/**
 * remark plugin to transform code to demo
 */
export const remarkPlugin: Plugin<
  [
    {
      getRouteMeta: () => RouteMeta[];
    },
  ],
  Root
> = ({ getRouteMeta }) => {
  const routeMeta = getRouteMeta();

  return (tree, vfile) => {
    const route = routeMeta.find(
      meta => meta.absolutePath === (vfile.path || vfile.history[0]),
    );
    if (!route) {
      return;
    }

    // 1. External demo , use <code src="xxx" /> to declare demo
    tree.children.forEach((node: any) => {
      if (node.type === 'mdxJsxFlowElement' && node.name === 'code') {
        const src = getNodeAttribute(node, 'src');
        if (!src) {
          return;
        }
        const demoPath = join(path.dirname(route.absolutePath), src);
        if (!fs.existsSync(demoPath)) {
          return;
        }
        const direction = getNodeAttribute(node, 'direction') || 'horizontal';
        const code = fs.readFileSync(demoPath, {
          encoding: 'utf8',
        });
        const language = src.substr(src.lastIndexOf('.') + 1);
        createPlaygroundNode(node, [
          ['code', code],
          ['language', language],
          ['direction', direction],
        ]);
      }
    });

    // 2. Internal demo, use ```j/tsx to declare demo
    visit(tree, 'code', node => {
      if (node.lang === 'jsx' || node.lang === 'tsx') {
        const isPure = getNodeMeta(node, 'pure') === 'pure';

        // do nothing for pure mode
        if (isPure) {
          return;
        }

        const direction = getNodeMeta(node, 'direction') || 'horizontal';

        createPlaygroundNode(node, [
          ['code', node.value],
          ['language', node.lang],
          ['direction', direction],
        ]);
      }
    });
  };
};
