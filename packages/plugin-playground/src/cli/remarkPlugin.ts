import { resolve } from 'node:path';
import type { RouteMeta } from '@rspress/shared';
import type { Code, Root } from 'mdast';
import type {
  MdxJsxAttributeValueExpression,
  MdxJsxFlowElement,
} from 'mdast-util-mdx-jsx';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { getNodeMeta } from './utils';

function createPlaygroundNode(
  currentNode: Code | MdxJsxFlowElement,
  attrs: Array<[string, string | MdxJsxAttributeValueExpression]>,
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

interface RemarkPluginProps {
  getRouteMeta: () => RouteMeta[];
  editorPosition: 'left' | 'right';
  defaultRenderMode: 'pure' | 'playground';
}

/**
 * remark plugin to transform code to demo
 */
export const remarkPlugin: Plugin<[RemarkPluginProps], Root> = ({
  getRouteMeta,
  editorPosition,
  defaultRenderMode,
}) => {
  const routeMeta = getRouteMeta();

  return (tree, vfile) => {
    const route = routeMeta.find(
      meta =>
        resolve(meta.absolutePath) === resolve(vfile.path || vfile.history[0]),
    );
    if (!route) {
      return;
    }

    // Internal demo, use ```j/tsx to declare demo
    visit(tree, 'code', node => {
      if (node.lang === 'jsx' || node.lang === 'tsx') {
        const hasPureMeta = node.meta?.includes('pure');
        const hasPlaygroundMeta = node.meta?.includes('playground');

        let noTransform;
        switch (defaultRenderMode) {
          case 'pure':
            noTransform = !hasPlaygroundMeta;
            break;
          case 'playground':
            noTransform = hasPureMeta;
            break;
          default:
            break;
        }

        // do not anything for pure mode
        if (noTransform) {
          return;
        }

        const direction = getNodeMeta(node, 'direction') || '';

        createPlaygroundNode(node, [
          ['code', node.value],
          ['language', node.lang],
          ['direction', direction],
          ['editorPosition', editorPosition],
        ]);
      }
    });
  };
};
