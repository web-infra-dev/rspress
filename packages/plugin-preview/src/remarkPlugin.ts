import { join, isAbsolute, dirname } from 'path';
import { visit } from 'unist-util-visit';
import { normalizePosixPath } from '@rspress/shared';
import fs from '@rspress/shared/fs-extra';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';
import type { RemarkPluginOptions } from './types';
import { injectDemoBlockImport, generateId } from './utils';
import { demoBlockComponentPath, virtualDir } from './constant';
import { demoRuntimeModule, demos } from './virtual-module';

/**
 * remark plugin to transform code to demo
 */
export const remarkCodeToDemo: Plugin<[RemarkPluginOptions], Root> = ({
  getRouteMeta,
  previewMode,
  defaultRenderMode,
  position,
}) => {
  const routeMeta = getRouteMeta();
  fs.ensureDirSync(virtualDir);
  return (tree, vfile) => {
    const demoMdx: MdxjsEsm[] = [];
    const route = routeMeta.find(
      meta =>
        normalizePosixPath(meta.absolutePath) ===
        normalizePosixPath(vfile.path || vfile.history[0]),
    );
    if (!route) {
      return;
    }
    const { pageName } = route;
    // clear all demo in this pageName and recollect, bacause we may delete the demo
    demos[pageName] = [];
    let title = pageName;
    let index = 1;
    let externalDemoIndex = 0;

    function constructDemoNode(
      demoId: string,
      demoPath: string,
      currentNode: any,
      isMobileMode: boolean,
      // Only for external demo
      externalDemoIndex?: number,
    ) {
      if (isMobileMode) {
        demos[pageName].push({
          title,
          id: demoId,
          path: isAbsolute(demoPath)
            ? demoPath
            : join(vfile.dirname || dirname(vfile.path), demoPath),
        });
      } else {
        demoMdx.push(getASTNodeImport(`Demo${demoId}`, demoPath));
      }

      // get external demo content
      const tempVar = `externalDemoContent${externalDemoIndex}`;
      if (externalDemoIndex !== undefined) {
        // Such as `import externalDemoContent0 from '!!xxx?raw'`
        // `!!` prefix is used to avoid other loaders in rspack
        demoMdx.push(getASTNodeImport(tempVar, `!!${demoPath}?raw`));
      }

      if (isMobileMode && position === 'fixed') {
        // Only show the code block
        externalDemoIndex !== undefined &&
          Object.assign(currentNode, getExternalDemoContent(tempVar));
      } else {
        // Use container to show the code and view
        Object.assign(currentNode, {
          type: 'mdxJsxFlowElement',
          name: 'Container',
          attributes: [
            {
              type: 'mdxJsxAttribute',
              name: 'isMobile',
              value: isMobileMode,
            },
            {
              type: 'mdxJsxAttribute',
              name: 'demoId',
              value: demoId,
            },
          ],
          children: [
            externalDemoIndex === undefined
              ? {
                  ...currentNode,
                  hasVisited: true,
                }
              : getExternalDemoContent(tempVar),
            isMobileMode
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
        if (node.children) {
          title = (node.children[0] as any)?.value || title;
        }
      }
    });

    // 1. External demo , use <code src="xxx" /> to declare demo
    visit(tree, 'mdxJsxFlowElement', (node: any) => {
      if (node.name === 'code') {
        const src = node.attributes.find(
          (attr: { name: string; value: string }) => attr.name === 'src',
        )?.value;
        if (!src) {
          return;
        }

        // don't support expression syntax
        const currtentMode =
          node.attributes.find(
            (attr: { name: string; value: boolean }) =>
              attr.name === 'previewMode',
          )?.value ?? previewMode;

        // TODO: remove isMobileAttribute
        let isMobileMode = node.attributes.find(
          (attr: { name: string; value: boolean }) => attr.name === 'isMobile',
        )?.value;
        if (isMobileMode === undefined) {
          // isMobile is not specified, eg: <code />
          isMobileMode = currtentMode === 'iframe';
        } else if (isMobileMode === null) {
          // true by default, eg: <code isMobile />
          isMobileMode = true;
        } else if (typeof isMobileMode === 'object') {
          // jsx value, isMobileMode.value now must be string, even if input is
          // any complex struct rather than primitive type
          // eg: <code isMobile={ anyOfOrOther([true, false, 'true', 'false', {}]) } />
          isMobileMode = isMobileMode.value !== 'false';
        } else {
          // string value, eg: <code isMobile="true" />
          isMobileMode = isMobileMode !== 'false';
        }

        const id = generateId(pageName, index++);
        constructDemoNode(id, src, node, isMobileMode, externalDemoIndex++);
      }
    });

    // 2. Internal demo, use ```j/tsx to declare demo
    visit(tree, 'code', node => {
      // hasVisited is a custom property
      if ('hasVisited' in node) {
        return;
      }

      if (node.lang === 'jsx' || node.lang === 'tsx') {
        const value = injectDemoBlockImport(node.value, demoBlockComponentPath);

        // do not anything for pure mode
        if (
          node?.meta?.includes('pure') ||
          (!node?.meta?.includes('preview') && defaultRenderMode === 'pure')
        ) {
          return;
        }

        // every code block can change their preview mode by meta
        const isMobileMode =
          node?.meta?.includes('mobile') ||
          node?.meta?.includes('iframe') ||
          (!node?.meta?.includes('web') &&
            !node?.meta?.includes('internal') &&
            previewMode === 'iframe');

        const id = generateId(pageName, index++);
        const virtualModulePath = join(virtualDir, `${id}.tsx`);
        constructDemoNode(id, virtualModulePath, node, isMobileMode);
        // Only when the content of the file changes, the file will be written
        // Avoid to trigger the hmr indefinitely
        if (fs.existsSync(virtualModulePath)) {
          const content = fs.readFileSync(virtualModulePath, 'utf-8');
          if (content === value) {
            return;
          }
        }
        fs.writeFileSync(virtualModulePath, value);
      }
    });

    tree.children.unshift(...demoMdx);

    // maybe rewrite, but it is necessary
    const meta = `
      export const demos = ${JSON.stringify(demos)}
      `;
    demoRuntimeModule.writeModule('virtual-meta', meta);
  };
};

const getASTNodeImport = (name: string, from: string) =>
  ({
    type: 'mdxjsEsm',
    value: `import ${name} from ${JSON.stringify(from)}`,
    data: {
      estree: {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ImportDeclaration',
            specifiers: [
              {
                type: 'ImportDefaultSpecifier',
                local: { type: 'Identifier', name },
              },
            ],
            source: {
              type: 'Literal',
              value: from,
              raw: `${JSON.stringify(from)}`,
            },
          },
        ],
      },
    },
  } as MdxjsEsm);

const getExternalDemoContent = (tempVar: string) => ({
  /**
   * We create a empty parent node here. If we don't do this, the `pre` tag won't be rendered as our custom mdx component and will be rendered as a normal `pre` tag, which will cause the code block to be displayed incorrectly.
   */
  type: 'mdxJsxFlowElement',
  name: '',
  attributes: [],
  children: [
    {
      type: 'mdxJsxFlowElement',
      name: 'pre',
      attributes: [],
      children: [
        {
          type: 'mdxJsxFlowElement',
          name: 'code',
          attributes: [
            {
              type: 'mdxJsxAttribute',
              name: 'className',
              value: 'language-tsx',
            },
            {
              type: 'mdxJsxAttribute',
              name: 'children',
              value: {
                type: 'mdxJsxExpressionAttribute',
                value: tempVar,
                data: {
                  estree: {
                    type: 'Program',
                    body: [
                      {
                        type: 'ExpressionStatement',
                        expression: {
                          type: 'Identifier',
                          name: tempVar,
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
});
