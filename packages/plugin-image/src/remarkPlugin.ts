import type {} from '@mdx-js/mdx';
import { walk } from 'estree-walker';
import type { Root } from 'mdast';
import type { MdxJsxAttribute } from 'mdast-util-mdx-jsx';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { invariant } from './utils';

declare module 'mdast-util-mdx-jsx' {
  export interface MdxJsxFlowElement {
    from?: 'mark' | 'jsx';
  }
}

// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
export interface RemarkPluginProps {}

/**
 * remark plugin to transform code to demo
 */
export const remarkPlugin: Plugin<[RemarkPluginProps], Root> = () => {
  return (tree, _vfile) => {
    visit(tree, 'mdxjsEsm', node => {
      if (!node.data?.estree) return;
      if (node.position !== undefined) return;
      walk(node.data.estree, {
        enter(node) {
          if (node.type !== 'ImportDeclaration') return;
          if (node.loc !== undefined) return;

          const { source } = node;
          let sourceName = source.value;
          invariant(typeof sourceName === 'string');

          if (!sourceName.endsWith('.png')) return;
          sourceName = `${sourceName}?image`;
          source.value = sourceName;
          source.raw = `"${sourceName}"`;
        },
      });
    });

    tree.children.push({
      type: 'mdxjsEsm',
      value:
        'import { Image as RsbuildImageComponent$1 } from "@rsbuild-image/react";',
      data: {
        estree: {
          type: 'Program',
          sourceType: 'module',
          body: [
            {
              type: 'ImportDeclaration',
              source: {
                type: 'Literal',
                value: '@rsbuild-image/react',
                raw: '"@rsbuild-image/react"',
              },
              specifiers: [
                {
                  type: 'ImportSpecifier',
                  imported: {
                    type: 'Identifier',
                    name: 'Image',
                  },
                  local: {
                    type: 'Identifier',
                    name: 'RsbuildImageComponent$1',
                  },
                },
              ],
            },
          ],
        },
      },
    });

    visit(tree, 'mdxJsxFlowElement', node => {
      if (node.name !== 'img') return;
      if (node.from !== 'mark') return;
      node.name = 'RsbuildImageComponent$1';
      const attrs: MdxJsxAttribute[] = [
        {
          type: 'mdxJsxAttribute',
          name: 'placeholder',
          value: 'blur',
        },
        {
          type: 'mdxJsxAttribute',
          name: 'sizes',
          value: `(max-width: 1280px) 100vw, ${992 - 64 * 2}px`,
        },
      ];
      const names = attrs.map(attr => attr.name);
      node.attributes = node.attributes.filter(
        attr => attr.type !== 'mdxJsxAttribute' || !names.includes(attr.name),
      );
      node.attributes.push(...attrs);
    });
  };
};
