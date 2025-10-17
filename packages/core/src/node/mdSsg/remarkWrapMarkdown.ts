import type { Root, RootContent } from 'mdast';
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

export interface RemarkWrapMarkdownOptions {
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
export function remarkWrapMarkdown(
  options: RemarkWrapMarkdownOptions = {},
): (tree: Root) => void {
  return (tree: Root) => {
    const newChildren: any[] = [];
    const importMap = buildImportMap(tree);

    for (const node of tree.children) {
      // Process imports - only keep those that match the filter
      if (node.type === 'mdxjsEsm') {
        const shouldKeep = shouldKeepImport(node, options);
        if (shouldKeep) {
          newChildren.push(node);
        }
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
          const textContent = serializeNodeToMarkdown(node);
          if (textContent) {
            newChildren.push({
              type: 'mdxJsxFlowElement',
              name: null, // Fragment
              attributes: [],
              children: [
                {
                  type: 'text',
                  value: textContent,
                },
              ],
            });
          }
        }
        continue;
      }

      // For any other markdown node (heading, paragraph, blockquote, list, code, etc.)
      // wrap it in a Fragment with its raw text representation
      const textContent = serializeNodeToMarkdown(node);

      if (textContent) {
        newChildren.push({
          type: 'mdxJsxFlowElement',
          name: null, // Fragment
          attributes: [],
          children: [
            {
              type: 'text',
              value: textContent,
            },
          ],
        });
      }
    }

    tree.children = newChildren as any;
  };
}

/**
 * Serialize a markdown node back to its markdown text representation
 * Uses remark-stringify for proper serialization of all node types
 */
function serializeNodeToMarkdown(node: RootContent): string {
  if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
    // return raw source string via position
    return node.name || '';
  }
  // Create a temporary root node containing only this node
  const tempRoot: Root = {
    type: 'root',
    children: [node],
  };

  // Use unified with remark-stringify to convert the node back to markdown
  const processor = unified().use(remarkStringify, {
    bullet: '-',
    emphasis: '_',
    fences: true,
    incrementListMarker: true,
  });

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
 * Check if an import statement should be kept based on options
 */
function shouldKeepImport(
  node: any,
  options: RemarkWrapMarkdownOptions,
): boolean {
  if (!node.data?.estree) {
    return true; // Keep if we can't parse it
  }

  const { includes, excludes } = options;

  // If no filters specified, keep all imports
  if (!includes && !excludes) {
    return true;
  }

  const estree = node.data.estree;

  for (const statement of estree.body) {
    if (statement.type === 'ImportDeclaration') {
      const source = statement.source.value;
      const specifiers = statement.specifiers
        .map((spec: any) => {
          if (spec.type === 'ImportDefaultSpecifier') {
            return spec.local.name;
          } else if (spec.type === 'ImportSpecifier') {
            return spec.local.name;
          } else if (spec.type === 'ImportNamespaceSpecifier') {
            return spec.local.name;
          }
          return null;
        })
        .filter(Boolean);

      // Check excludes first (takes precedence)
      if (excludes) {
        for (const [excludeSpecifiers, excludeSource] of excludes) {
          // If source matches
          if (excludeSource === source) {
            // Check if any specifier matches
            if (excludeSpecifiers.some(spec => specifiers.includes(spec))) {
              return false;
            }
          }
        }
      }

      // Check includes
      if (includes) {
        let matchesAnyRule = false;

        for (const [includeSpecifiers, includeSource] of includes) {
          // If source matches
          if (includeSource === source) {
            // Check if any specifier matches
            if (includeSpecifiers.some(spec => specifiers.includes(spec))) {
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
    }
  }

  return true;
}

/**
 * Check if a JSX element should be kept based on its component name and import filters
 */
function shouldKeepJsxElement(
  componentName: string | null,
  importMap: Map<string, string>,
  options: RemarkWrapMarkdownOptions,
): boolean {
  if (!componentName) {
    return true; // Keep fragments and elements without names
  }

  const { includes, excludes } = options;

  // If no filters specified, keep all JSX elements
  if (!includes && !excludes) {
    return true;
  }

  const importSource = importMap.get(componentName);

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
