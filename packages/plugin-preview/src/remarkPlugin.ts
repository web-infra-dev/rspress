import { dirname, join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { normalizePosixPath } from '@rspress/core';
import type { Code, Root } from 'mdast';
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { getASTNodeImport } from './ast';
import { parsePreviewInfoFromMeta } from './parsePreviewInfoFromMeta';
import type { DemoInfo, Options, RemarkPluginOptions } from './types';
import { generateId, getLangFileExt } from './utils';

/**
 * remark plugin to transform code to demo
 */
export const remarkPlugin: Plugin<[RemarkPluginOptions], Root> = function ({
  getRouteMeta,
  defaultPreviewMode,
  defaultRenderMode,
  previewLanguages,
  previewCodeTransform,
  store,
}) {
  const routeMeta = getRouteMeta();
  const data = this.data() as {
    pageMeta: Record<string, unknown>;
  };
  return (tree, vfile) => {
    const route = routeMeta.find(
      meta =>
        normalizePosixPath(meta.absolutePath) ===
        normalizePosixPath(vfile.path || vfile.history[0]),
    );
    if (!route) {
      return;
    }
    const { pageName } = route;
    // clear all demo in this pageName and recollect, because we may delete the demo
    let title = pageName;
    let index = 1;

    const demoMdxImports: MdxjsEsm[] = [];
    const demosInCurrPage: DemoInfo = { [pageName]: [] };
    function handleCodeBlockByPreviewMode(
      demoId: string,
      demoPath: string,
      currentNode: Code,
      previewMode: Options['defaultPreviewMode'],
    ) {
      if (previewMode === 'iframe-fixed' || previewMode === 'iframe-follow') {
        demosInCurrPage[pageName].push({
          title,
          id: demoId,
          path: demoPath,
          previewMode,
        });
      } else {
        demoMdxImports.push(getASTNodeImport(`Demo${demoId}`, demoPath));
      }

      // 1. Use Preview for internal and iframe-follow mode,
      // 2. Use Device for iframe-fixed mode
      if (previewMode === 'internal' || previewMode === 'iframe-follow') {
        const originalCodeAst = { ...currentNode, hasVisited: true };
        Object.assign(currentNode, {
          type: 'mdxJsxFlowElement',
          name: 'Preview',
          attributes: [
            {
              type: 'mdxJsxAttribute',
              name: 'previewMode',
              value: previewMode,
            },
            {
              type: 'mdxJsxAttribute',
              name: 'demoId',
              value: demoId,
            },
          ],
          children: [
            originalCodeAst,
            previewMode === 'iframe-follow'
              ? {
                  type: 'mdxJsxFlowElement',
                  name: null,
                }
              : {
                  type: 'mdxJsxFlowElement',
                  name: `Demo${demoId}`,
                },
          ],
        });
      }
    }
    visit(tree, 'heading', node => {
      if (node.depth === 1) {
        const firstChild = node.children[0];
        title =
          (firstChild && 'value' in firstChild && firstChild.value) || title;
      }
    });

    // Internal demo, such as using ```jsx to declare demo
    visit(tree, 'code', node => {
      // hasVisited is a custom property
      if ('hasVisited' in node && node.hasVisited === true) {
        return;
      }
      if (node.lang && previewLanguages.includes(node.lang)) {
        const { isPure, previewMode } = parsePreviewInfoFromMeta({
          meta: node.meta,
          defaultPreviewMode,
          defaultRenderMode,
        });

        if (isPure || !previewMode) {
          return;
        }

        const virtualFileContent = previewCodeTransform({
          language: node.lang,
          code: node.value,
        });

        const id = generateId(pageName, index++);
        const mdxDir = dirname(vfile.path || vfile.history[0]);
        const virtualModulePath = join(
          mdxDir,
          `_rspress_demo_${id}.${getLangFileExt(node.lang)}`,
        );
        store.writeModule(virtualModulePath, virtualFileContent);

        handleCodeBlockByPreviewMode(id, virtualModulePath, node, previewMode);
      }
    });

    tree.children.unshift(...demoMdxImports);
    if (demosInCurrPage[pageName].some(i => i.previewMode === 'iframe-fixed')) {
      data.pageMeta.haveIframeFixedDemos = true;
    }

    if (
      !isDeepStrictEqual(store.demos[pageName] ?? [], demosInCurrPage[pageName])
    ) {
      store.isDirty = true;
    }

    if (demosInCurrPage[pageName].length !== 0) {
      store.demos[pageName] = demosInCurrPage[pageName];
    }
  };
};
