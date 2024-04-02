import { dirname, join, resolve } from 'path';
import { visit } from 'unist-util-visit';
import fs from '@rspress/shared/fs-extra';
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

    // 1. External demo , use <code src="foo" /> to declare demo
    visit(tree, 'mdxJsxFlowElement', (node: any) => {
      if (node.name === 'code') {
        const src = getNodeAttribute(node, 'src');
        if (!src) {
          return;
        }
        const demoPath = join(dirname(route.absolutePath), src);
        if (!fs.existsSync(demoPath)) {
          return;
        }
        const direction = getNodeAttribute(node, 'direction') || '';
        const code = fs.readFileSync(demoPath, {
          encoding: 'utf8',
        });
        const language = src.substr(src.lastIndexOf('.') + 1);
        createPlaygroundNode(node, [
          ['code', code],
          ['language', language],
          ['direction', direction],
          ['editorPosition', editorPosition],
        ]);
      }
    });

    // 2. Internal demo, use ```j/tsx to declare demo
    visit(tree, 'code', node => {
      if (node.lang === 'jsx' || node.lang === 'tsx') {
        const hasPureMeta = node?.meta?.includes('pure');
        const hasPlaygroundMeta = node?.meta?.includes('playground');

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
