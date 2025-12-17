import type { Root, RootContent } from 'mdast';
import type {
  MdxFlowExpression,
  MdxJsxFlowElement,
  MdxJsxTextElement,
  MdxjsEsm,
  MdxTextExpression,
} from 'mdast-util-mdx';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

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
    const { importMap, importNodes } = buildImportMap(tree);

    newChildren.push(...importNodes);

    for (const node of tree.children) {
      if (node.type === 'mdxjsEsm') {
        continue;
      }

      // Process JSX elements
      if (
        node.type === 'mdxJsxFlowElement' ||
        node.type === 'mdxJsxTextElement'
      ) {
        newChildren.push(processJsxElement(node, importMap, options));
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
        newChildren.push(buildMdxFlowExpressionFragment(node));
      }
    }

    tree.children = newChildren as any;
  };
}

/**
 * Process a single JSX element - recursively handle children and decide whether to keep or convert
 */
function processJsxElement(
  node: MdxJsxFlowElement | MdxJsxTextElement,
  importMap: Map<string, string>,
  options: RemarkSplitMdxOptions,
):
  | MdxJsxFlowElement
  | MdxJsxTextElement
  | MdxFlowExpression
  | MdxJsxFlowElement {
  // Recursively process children first
  const processedNode = processJsxChildren(node, importMap, options);

  // Determine if this element should be kept
  const componentName = getComponentName((node as any).name);
  const isMdxFragment =
    componentName && importMap.get(componentName)?.endsWith('.mdx');

  console.log(componentName, isMdxFragment, importMap);

  // MDX fragments are always kept, otherwise check filtering rules
  if (
    isMdxFragment ||
    shouldKeepJsxElement((node as any).name, importMap, options)
  ) {
    return processedNode;
  }

  // Not kept - convert to text (preserving any JSX children that were kept)
  return buildMdxFlowExpressionFragment(processedNode);
}

/**
 * Recursively process children of JSX elements
 */
function processJsxChildren(
  node: MdxJsxFlowElement | MdxJsxTextElement,
  importMap: Map<string, string>,
  options: RemarkSplitMdxOptions,
): MdxJsxFlowElement | MdxJsxTextElement {
  if (!node.children || node.children.length === 0) {
    return node;
  }

  const processedChildren: RootContent[] = [];
  let textBuffer: RootContent[] = [];

  const flushTextBuffer = () => {
    if (textBuffer.length === 0) return;

    // Serialize all accumulated non-JSX content to markdown string
    const combined = textBuffer
      .map(child => serializeNodeToMarkdown(child))
      .join('');

    if (combined) {
      processedChildren.push(createTextExpression(combined) as any);
    }
    textBuffer = [];
  };

  for (const child of node.children) {
    // Only process nested JSX elements recursively
    if (
      child.type === 'mdxJsxFlowElement' ||
      child.type === 'mdxJsxTextElement'
    ) {
      // Flush any accumulated text before the JSX element
      flushTextBuffer();
      processedChildren.push(processJsxElement(child, importMap, options));
    } else {
      // Accumulate non-JSX content to be serialized as string
      textBuffer.push(child);
    }
  }

  // Flush any remaining text
  flushTextBuffer();

  return { ...node, children: processedChildren as any };
}

/**
 * Get component name from MDX JSX name field
 * Handles both simple strings and member expressions (e.g., PlatformTabs.Tab)
 */
function getComponentName(name: string | null | any): string | null {
  if (!name) {
    return null;
  }

  if (typeof name === 'string') {
    // Handle member expression in string form (e.g., "PlatformTabs.Tab")
    // Extract the root component name before the first dot
    const dotIndex = name.indexOf('.');
    if (dotIndex > 0) {
      return name.substring(0, dotIndex);
    }
    return name;
  }

  // Handle member expression as object (in case MDX AST uses object format)
  if (typeof name === 'object') {
    if (
      name.type === 'mdxJsxMemberExpression' ||
      name.type === 'mdxJsxNamespacedName'
    ) {
      // Get the root object name (e.g., 'PlatformTabs' from 'PlatformTabs.Tab')
      return getComponentName(name.object);
    }
  }

  return null;
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
  const prefix =
    parentNode.type === 'heading'
      ? `${'#'.repeat(parentNode.depth || 1)} `
      : '';
  let prefixAdded = false;

  const flushTextBuffer = () => {
    if (textBuffer.length > 0) {
      let combined = textBuffer.join('');
      if (!prefixAdded && prefix) {
        combined = prefix + combined;
        prefixAdded = true;
      }
      if (combined) {
        result.push(createTextExpression(combined));
      }
      textBuffer = [];
    } else if (!prefixAdded && prefix) {
      result.push(createTextExpression(prefix.trimEnd()));
      prefixAdded = true;
    }
  };

  for (const child of children) {
    if (
      child.type === 'mdxJsxFlowElement' ||
      child.type === 'mdxJsxTextElement'
    ) {
      flushTextBuffer();
      result.push(processJsxElement(child, importMap, options));
    } else if (child.type === 'text') {
      textBuffer.push(child.value || '');
    } else {
      const serialized = serializeNodeToMarkdown(child);
      if (serialized) {
        textBuffer.push(serialized);
      }
    }
  }

  flushTextBuffer();
  return result;
}

/**
 * Convert a markdown node to an MDX Fragment containing a Flow Expression
 * If the node contains JSX children (after processing), returns a Fragment with mixed content
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
function buildMdxFlowExpressionFragment(
  node: RootContent,
): MdxFlowExpression | MdxJsxFlowElement {
  // Check if node has children that are JSX elements (after processing)
  const children = (node as any).children;
  const hasJsxChildren = children?.some(
    (child: any) =>
      child.type === 'mdxJsxFlowElement' ||
      child.type === 'mdxJsxTextElement' ||
      child.type === 'mdxFlowExpression' ||
      child.type === 'mdxTextExpression',
  );

  if (
    hasJsxChildren &&
    (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement')
  ) {
    // Build a Fragment with mixed content
    return buildMixedContentFragment(node, children);
  }

  // Simple case: no JSX children, just serialize to string
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

/**
 * Build a Fragment with mixed content (text strings and JSX components)
 * Used when converting a JSX element to markdown but preserving nested JSX components
 */
function buildMixedContentFragment(
  node: MdxJsxFlowElement | MdxJsxTextElement,
  children: RootContent[],
): MdxJsxFlowElement {
  const result: (
    | MdxFlowExpression
    | MdxTextExpression
    | MdxJsxFlowElement
    | MdxJsxTextElement
  )[] = [];

  // Add opening tag
  const openingTag = serializeOpeningTag(node);
  if (openingTag) {
    result.push(createTextExpression(openingTag));
  }

  // Process children
  for (const child of children) {
    const isJsxOrExpression =
      child.type === 'mdxJsxFlowElement' ||
      child.type === 'mdxJsxTextElement' ||
      child.type === 'mdxFlowExpression' ||
      child.type === 'mdxTextExpression';

    if (isJsxOrExpression) {
      result.push(child as any);
    } else {
      const text = serializeNodeToMarkdown(child);
      if (text) {
        result.push(createTextExpression(text));
      }
    }
  }

  // Add closing tag
  const closingTag = serializeClosingTag(node);
  if (closingTag) {
    result.push(createTextExpression(closingTag));
  }

  return {
    type: 'mdxJsxFlowElement',
    name: null, // Fragment
    attributes: [],
    children: result as any,
  };
}

/**
 * Create a text expression node
 */
function createTextExpression(text: string): MdxTextExpression {
  const stringified = JSON.stringify(text);
  return {
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
              value: text,
              raw: stringified,
            },
          },
        ],
        sourceType: 'module',
      },
    },
  };
}

/**
 * Serialize opening tag of a JSX element
 */
function serializeOpeningTag(
  node: MdxJsxFlowElement | MdxJsxTextElement,
): string {
  const name = typeof node.name === 'string' ? node.name : '';
  if (!name) return '';

  const attrs = node.attributes
    ?.map((attr: any) => {
      if (attr.type !== 'mdxJsxAttribute') return '';

      const attrName = attr.name;
      if (attr.value === null || attr.value === undefined) {
        return attrName;
      }
      if (typeof attr.value === 'string') {
        return `${attrName}="${attr.value}"`;
      }
      if (attr.value.type === 'mdxJsxAttributeValueExpression') {
        return `${attrName}={${attr.value.value || ''}}`;
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');

  return `<${name}${attrs ? ` ${attrs}` : ''}>`;
}

/**
 * Serialize closing tag of a JSX element
 */
function serializeClosingTag(
  node: MdxJsxFlowElement | MdxJsxTextElement,
): string {
  const name = typeof node.name === 'string' ? node.name : '';
  if (!name) return '';
  return `</${name}>`;
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
function buildImportMap(tree: Root): {
  importMap: Map<string, string>;
  importNodes: Set<MdxjsEsm>;
} {
  const importMap = new Map<string, string>();
  const importNodes: Set<MdxjsEsm> = new Set();

  visit(tree, 'mdxjsEsm', node => {
    const estree = node.data?.estree;
    if (!estree) {
      return;
    }

    for (const statement of estree.body) {
      if (statement.type !== 'ImportDeclaration') continue;

      const source = statement.source.value;
      for (const specifier of statement.specifiers) {
        const localName = specifier.local?.name;
        if (localName) {
          importMap.set(localName, source as string);
          importNodes.add(node);
        }
      }
    }
  });

  return { importMap, importNodes };
}

/**
 * Check if a JSX element should be kept based on its component name and import filters
 */
function shouldKeepJsxElement(
  nameField: string | null | any,
  importMap: Map<string, string>,
  options: RemarkSplitMdxOptions,
): boolean {
  const componentName = getComponentName(nameField);

  if (!componentName) {
    return true; // Keep fragments and elements without names
  }

  const { includes, excludes } = options;
  const importSource = importMap.get(componentName);

  // If no filters specified, keep all JSX elements
  if (!includes && !excludes) {
    return true;
  }

  // Check excludes first (takes precedence over includes)
  if (excludes) {
    for (const [excludeSpecifiers, excludeSource] of excludes) {
      if (
        excludeSpecifiers.includes(componentName) &&
        (!importSource || importSource === excludeSource)
      ) {
        return false;
      }
    }
  }

  // Check includes
  if (includes) {
    for (const [includeSpecifiers, includeSource] of includes) {
      if (
        includeSpecifiers.includes(componentName) &&
        (!importSource || importSource === includeSource)
      ) {
        return true;
      }
    }
    // If includes are specified but nothing matches, exclude
    return false;
  }

  return true;
}
