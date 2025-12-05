import { extname } from 'node:path';
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';

export const getASTNodeImport = (name: string, from: string) =>
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
  }) as MdxjsEsm;

export const getExternalDemoContent = (
  tempVar: string,
  language: string = 'tsx',
) => ({
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
              value: `language-${language}`,
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

function createProp(propName: string, propValue: any) {
  return {
    type: 'mdxJsxAttribute',
    name: propName,
    value: {
      type: 'mdxJsxAttributeValueExpression',
      value: JSON.stringify(propValue),
      data: {
        estree: {
          type: 'Program',
          body: [propValue],
          sourceType: 'module',
        },
      },
    },
  };
}

export function createOtherFilesProp(otherFilesAttr: string[]) {
  return createProp('otherFiles', {
    type: 'ExpressionStatement',
    expression: {
      type: 'ArrayExpression',
      elements: otherFilesAttr.map(file => ({
        type: 'Literal',
        value: file,
        raw: JSON.stringify(file),
      })),
    },
  });
}

const SUPPORTED_CODE_LANGUAGES = new Set([
  'js',
  'jsx',
  'ts',
  'tsx',
  'json',
  'css',
  'less',
  'scss',
  'sass',
  'md',
  'mdx',
  'html',
]);

const sanitizeLanguageValue = (language: string) => {
  const normalized = language.replace(/[^0-9a-z-]/gi, '');
  return normalized || 'tsx';
};

export const inferLanguageFromPath = (filePath: string) => {
  const ext = sanitizeLanguageValue(extname(filePath).slice(1).toLowerCase());
  if (!ext) {
    return 'tsx';
  }
  if (SUPPORTED_CODE_LANGUAGES.has(ext)) {
    return ext;
  }
  if (ext === 'mjs' || ext === 'cjs') {
    return 'js';
  }
  return 'tsx';
};
