import type { Root, RootContent } from 'mdast';
import type {
  MdxFlowExpression,
  MdxJsxFlowElement,
  MdxJsxTextElement,
  MdxTextExpression,
} from 'mdast-util-mdx';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';

/**
 * Filter rule format: [specifiers, source]
 * - specifiers: Array of component/function names to match
 * - source: Import source to match
 *
 * Example: [['Table', 'Button'], '@lynx']
 * Matches: import { Table, Button } from '@lynx'
 */
export type FilterRule = [string[], string];

export interface RemarkSplitMdxOptions {
  /**
   * Include rules for filtering imports and JSX elements
   * Format: [[specifiers, source], ...]
   *
   * @example
   * includes: [
   *   [['Table', 'Button'], '@lynx'],
   *   [['Card'], 'antd']
   * ]
   */
  includes?: FilterRule[];

  /**
   * Exclude rules for filtering imports and JSX elements
   * Takes precedence over includes
   * Format: [[specifiers, source], ...]
   *
   * @example
   * excludes: [
   *   [['LegacyTable'], '@lynx']
   * ]
   */
  excludes?: FilterRule[];
}

/**
 * Custom remark plugin that wraps markdown content in React Fragment
 * Only processes top-level markdown nodes, keeps JSX elements and their children intact
 */
export function remarkSplitMdx(
  options: RemarkSplitMdxOptions = {},
): (tree: Root) => void {
  return (tree: Root) => {
    const newChildren: RootContent[] = [];
    const importMap = buildImportMap(tree);

    for (const node of tree.children) {
      // Process imports - keep all the import
      if (node.type === 'mdxjsEsm') {
        newChildren.push(node);
        continue;
      }

      // Process JSX elements - check if they should be kept based on import filters
      if (
        node.type === 'mdxJsxFlowElement' ||
        node.type === 'mdxJsxTextElement'
      ) {
        const componentName = (node as any).name;
        const shouldKeep = shouldKeepJsxElement(
          componentName,
          importMap,
          options,
        );

        if (shouldKeep) {
          newChildren.push(node);
        } else {
          // Convert to markdown text if not kept
          newChildren.push(buildMdxFlowExpressionFragment(node));
        }
        continue;
      }

      // For any other markdown node (heading, paragraph, blockquote, list, code, etc.)
      // Check if it has JSX children that need to be extracted
      const hasJsxChildren = (node as any).children?.some(
        (child: any) =>
          child.type === 'mdxJsxFlowElement' ||
          child.type === 'mdxJsxTextElement',
      );

      if (hasJsxChildren) {
        // Process mixed content nodes (e.g., heading with JSX)
        const processedChildren = processMixedContent(
          node,
          (node as any).children || [],
          importMap,
          options,
        );

        newChildren.push({
          type: 'mdxJsxFlowElement',
          name: null, // Fragment
          attributes: [],
          // @ts-expect-error mdxJsxFlowElement children type
          children: processedChildren,
        });
      } else {
        // Pure markdown node - serialize to text
        const fragment = buildMdxFlowExpressionFragment(node);
        newChildren.push(fragment);
      }
    }

    tree.children = newChildren as any;
  };
}

/**
 * Process mixed content that contains both markdown and JSX elements
 * Returns an array of children suitable for a Fragment
 */
function processMixedContent(
  parentNode: RootContent,
  children: RootContent[],
  importMap: Map<string, string>,
  options: RemarkSplitMdxOptions,
): (
  | MdxJsxFlowElement
  | MdxJsxTextElement
  | MdxFlowExpression
  | MdxTextExpression
)[] {
  const result: (
    | MdxJsxFlowElement
    | MdxJsxTextElement
    | MdxFlowExpression
    | MdxTextExpression
  )[] = [];
  let textBuffer: string[] = [];

  // Get markdown prefix for certain node types (e.g., heading)
  const getPrefix = () => {
    if (parentNode.type === 'heading') {
      const depth = parentNode.depth || 1;
      return `${'#'.repeat(depth)} `;
    }
    return '';
  };

  const prefix = getPrefix();
  let prefixAdded = false;

  const flushTextBuffer = () => {
    if (textBuffer.length > 0) {
      let combined = textBuffer.join('');

      // Add prefix to the first text chunk if not yet added
      if (!prefixAdded && prefix) {
        combined = prefix + combined;
        prefixAdded = true;
      }

      // Only add if there's actual content
      if (combined) {
        const stringified = JSON.stringify(combined);
        result.push({
          type: 'mdxTextExpression',
          value: stringified,
          data: {
            estree: {
              type: 'Program',
              body: [
                {
                  type: 'ExpressionStatement',
                  expression: {
                    type: 'Literal',
                    value: combined,
                    raw: stringified,
                  },
                },
              ],
              sourceType: 'module',
            },
          },
        });
      }
      textBuffer = [];
    } else if (!prefixAdded && prefix) {
      // If textBuffer is empty but we haven't added prefix yet,
      // we still need to add the prefix (e.g., when first child is JSX)
      const trimmedPrefix = prefix.trimEnd();
      const stringified = JSON.stringify(trimmedPrefix);
      result.push({
        type: 'mdxTextExpression',
        value: stringified,
        data: {
          estree: {
            type: 'Program',
            body: [
              {
                type: 'ExpressionStatement',
                expression: {
                  type: 'Literal',
                  value: trimmedPrefix,
                  raw: stringified,
                },
              },
            ],
            sourceType: 'module',
          },
        },
      });
      prefixAdded = true;
    }
  };

  for (const child of children) {
    if (
      child.type === 'mdxJsxFlowElement' ||
      child.type === 'mdxJsxTextElement'
    ) {
      // Flush any accumulated text before the JSX element
      flushTextBuffer();

      const componentName = child.name;
      const shouldKeep = shouldKeepJsxElement(
        componentName,
        importMap,
        options,
      );

      if (shouldKeep) {
        result.push(child);
      } else {
        // Convert excluded JSX to text
        const fragment = buildMdxFlowExpressionFragment(child);
        result.push(fragment);
      }
    } else if (child.type === 'text') {
      // Accumulate text node value directly
      textBuffer.push(child.value || '');
    } else {
      // For other inline elements (strong, em, code, etc.), serialize and accumulate
      const serialized = serializeNodeToMarkdown(child);
      if (serialized) {
        textBuffer.push(serialized);
      }
    }
  }

  // Flush any remaining text
  flushTextBuffer();

  return result;
}

/**
 * Convert a markdown node to an MDX Fragment containing a Flow Expression
 * @example
 * input
 *
 * ```mdx
 * # Heading
 * Some **bold** text.
 * ```
 *
 * output
 *
 * ```jsx
 * <>{"# Heading\nSome **bold** text."}</>
 * ```
 */
function buildMdxFlowExpressionFragment(node: RootContent): MdxFlowExpression {
  const textContent = serializeNodeToMarkdown(node);
  // <>{"string"}</>
  const stringified = JSON.stringify(textContent);

  const fragment: MdxFlowExpression = {
    type: 'mdxFlowExpression',
    value: stringified,
    data: {
      estree: {
        type: 'Program',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'Literal',
              value: textContent,
              raw: stringified,
            },
          },
        ],
        sourceType: 'module',
      },
    },
  };

  return fragment;
}

// Use unified with remark-stringify to convert the node back to markdown
const processor = unified().use(remarkMdx).use(remarkGfm).use(remarkStringify, {
  bullet: '-',
  emphasis: '_',
  fences: true,
  incrementListMarker: true,
});

/**
 * Serialize a markdown node back to its markdown text representation
 * Uses remark-stringify for proper serialization of all node types
 */
function serializeNodeToMarkdown(node: RootContent): string {
  // Create a temporary root node containing only this node
  const tempRoot: Root = {
    type: 'root',
    children: [node],
  };

  const result = processor.stringify(tempRoot);

  return result;
}

/**
 * Build a map of component names to their import sources
 * Example: { Table: '@lynx', Button: 'react' }
 */
function buildImportMap(tree: Root): Map<string, string> {
  const importMap = new Map<string, string>();

  for (const node of tree.children) {
    if (node.type === 'mdxjsEsm' && (node as any).data?.estree) {
      const estree = (node as any).data.estree;

      for (const statement of estree.body) {
        if (statement.type === 'ImportDeclaration') {
          const source = statement.source.value;

          for (const specifier of statement.specifiers) {
            let localName: string | null = null;

            if (specifier.type === 'ImportDefaultSpecifier') {
              // import Table from '@lynx'
              localName = specifier.local.name;
            } else if (specifier.type === 'ImportSpecifier') {
              // import { Table as Tab } from '@lynx'
              localName = specifier.local.name;
            } else if (specifier.type === 'ImportNamespaceSpecifier') {
              // import * as Lynx from '@lynx'
              localName = specifier.local.name;
            }

            if (localName) {
              importMap.set(localName, source);
            }
          }
        }
      }
    }
  }

  return importMap;
}

/**
 * Check if a JSX element should be kept based on its component name and import filters
 */
function shouldKeepJsxElement(
  componentName: string | null,
  importMap: Map<string, string>,
  options: RemarkSplitMdxOptions,
): boolean {
  if (!componentName) {
    return true; // Keep fragments and elements without names
  }

  const { includes, excludes } = options;

  // If no filters specified, keep all JSX elements, includes all
  if (!includes && !excludes) {
    return true;
  }

  const importSource = importMap.get(componentName);

  if (importSource?.endsWith('.mdx')) {
    // Mdx Fragments should always be kept
    return true;
  }

  // Check excludes first (takes precedence)
  if (excludes) {
    for (const [excludeSpecifiers, excludeSource] of excludes) {
      // If component name matches and source matches (if component was imported)
      if (excludeSpecifiers.includes(componentName)) {
        if (!importSource || importSource === excludeSource) {
          return false;
        }
      }
    }
  }

  // Check includes
  if (includes) {
    let matchesAnyRule = false;

    for (const [includeSpecifiers, includeSource] of includes) {
      // If component name matches and source matches (if component was imported)
      if (includeSpecifiers.includes(componentName)) {
        if (!importSource || importSource === includeSource) {
          matchesAnyRule = true;
          break;
        }
      }
    }

    // If includes are specified but nothing matches, exclude
    if (!matchesAnyRule) {
      return false;
    }
  }

  return true;
}
