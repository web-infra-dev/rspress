import { join } from 'path';
import { visit } from 'unist-util-visit';
import fs from '@modern-js/utils/fs-extra';
import type { RouteMeta } from '@rspress/shared';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';

function createPlaygroundNode(currentNode: any, code: string, lang: string) {
  Object.assign(currentNode, {
    type: 'mdxJsxFlowElement',
    name: 'Playground',
    attributes: [
      {
        type: 'mdxJsxAttribute',
        name: 'language',
        value: lang,
      },
      {
        type: 'mdxJsxAttribute',
        name: 'code',
        value: code,
      },
    ],
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
        const src: string = node.attributes.find(
          (attr: { name: string; value: string }) => attr.name === 'src',
        )?.value;
        if (!src) {
          return;
        }
        const demoPath = join(route.absolutePath, src);
        if (!fs.existsSync(demoPath)) {
          return;
        }
        const code = fs.readFileSync(demoPath, {
          encoding: 'utf8',
        });
        const lang = src.substr(src.lastIndexOf('.') + 1);
        createPlaygroundNode(node, code, lang);
      }
    });

    // 2. Internal demo, use ```j/tsx to declare demo
    visit(tree, 'code', node => {
      if (node.lang === 'jsx' || node.lang === 'tsx') {
        const isPure = node?.meta?.includes('pure');

        // do nothing for pure mode
        if (isPure) {
          return;
        }

        createPlaygroundNode(node, node.value, node.lang);
      }
    });
  };
};
