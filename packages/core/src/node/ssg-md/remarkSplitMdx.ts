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
 * Mixed Markdown stays structured until executable MDX has resolved.
 */
export function remarkSplitMdx(
  options: RemarkSplitMdxOptions = {},
): (tree: Root) => void {
  return (tree: Root) => {
    const newChildren: RootContent[] = [];
    const { importMap, esmNodes } = collectEsmMetadata(tree);

    // MDX unwraps JSX-only paragraphs; task labels still require a paragraph
    // for GFM's checkbox handler and must be resolved in inline context.
    visit(tree, 'listItem', node => {
      const head = node.children[0];
      if (
        typeof node.checked === 'boolean' &&
        head &&
        (head.type === 'mdxJsxFlowElement' || head.type === 'mdxFlowExpression')
      ) {
        node.children[0] = {
          type: 'paragraph',
          children: [
            {
              ...head,
              type:
                head.type === 'mdxJsxFlowElement'
                  ? 'mdxJsxTextElement'
                  : 'mdxTextExpression',
            } as MdxJsxTextElement | MdxTextExpression,
          ],
        };
      }
    });

    // Keep ESM declarations available to the MDX compiler. They are omitted
    // only when content is stringified to Markdown.
    newChildren.push(...esmNodes);

    for (const node of tree.children) {
      if (node.type === 'mdxjsEsm') {
        continue;
      }

      // Preserve MDX expressions as-is (e.g., {window.foo})
      if (
        node.type === 'mdxFlowExpression' ||
        node.type === 'mdxTextExpression'
      ) {
        newChildren.push(node);
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

      if (containsMdx(node)) {
        newChildren.push(buildMarkdownRegion([node], importMap, options));
      } else {
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

  // MDX fragments are always kept, otherwise check filtering rules
  if (
    isMdxFragment ||
    shouldKeepJsxElement((node as any).name, importMap, options)
  ) {
    return processedNode;
  }

  // Not kept - convert to text (preserving any JSX children that were kept)
  const opening = processedNode.children.length
    ? serializeOpeningTag(processedNode)
    : serializeNodeToMarkdown(node).replace(/\n$/, '');
  return {
    type: 'mdxJsxFlowElement',
    name: null,
    attributes: [],
    children: [
      host('rspress-md-literal', { value: opening }, []),
      ...(processedNode.children.length
        ? [
            ...processedNode.children,
            host(
              'rspress-md-literal',
              { value: serializeClosingTag(processedNode) },
              [],
            ),
          ]
        : []),
    ] as any,
  };
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

  // MDX can classify a same-line JSX container as flow while retaining
  // phrasing children. Keep those siblings in one region as well.
  if (
    node.type === 'mdxJsxTextElement' ||
    (node.children.some(child => !isMdx(child)) &&
      node.children.every(child =>
        [
          'text',
          'emphasis',
          'strong',
          'delete',
          'link',
          'linkReference',
          'inlineCode',
          'break',
          'image',
          'imageReference',
          'footnoteReference',
          'mdxJsxTextElement',
          'mdxTextExpression',
          'mdxJsxFlowElement',
          'mdxFlowExpression',
        ].includes(child.type),
      ))
  ) {
    return {
      ...node,
      children: [
        buildMarkdownRegion(
          node.children as RootContent[],
          importMap,
          options,
          true,
        ),
      ] as any,
    };
  }

  const processedChildren: RootContent[] = [];
  let buffer: RootContent[] = [];
  const flush = () => {
    if (!buffer.length) return;
    if (buffer.some(containsMdx)) {
      processedChildren.push(buildMarkdownRegion(buffer, importMap, options));
    } else {
      processedChildren.push(
        createTextExpression(
          processor.stringify({ type: 'root', children: buffer }),
        ),
      );
    }
    buffer = [];
  };
  for (const child of node.children as RootContent[]) {
    if (isMdx(child)) {
      flush();
      processedChildren.push(
        isJsx(child) ? processJsxElement(child, importMap, options) : child,
      );
    } else {
      buffer.push(child);
    }
  }
  flush();
  return { ...node, children: processedChildren as any };
}

function isJsx(
  node: RootContent,
): node is MdxJsxFlowElement | MdxJsxTextElement {
  return node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement';
}

function isMdx(node: RootContent): boolean {
  return (
    isJsx(node) ||
    node.type === 'mdxFlowExpression' ||
    node.type === 'mdxTextExpression'
  );
}

function containsMdx(node: RootContent): boolean {
  let found = false;
  visit(
    node,
    [
      'mdxJsxFlowElement',
      'mdxJsxTextElement',
      'mdxFlowExpression',
      'mdxTextExpression',
    ],
    () => {
      found = true;
    },
  );
  return found;
}

/**
 * Keep authored Markdown as a tree of host nodes until React resolves MDX.
 * Each node owns its children, so nested, duplicated, or suppressed children
 * do not depend on positional slots or a separate marker registry.
 */
function buildMarkdownRegion(
  children: RootContent[],
  importMap: Map<string, string>,
  options: RemarkSplitMdxOptions,
  inline = false,
): MdxJsxFlowElement {
  const build = (node: RootContent): MdxJsxFlowElement => {
    if (isMdx(node)) {
      return host(
        'rspress-md-slot',
        {
          inline:
            node.type === 'mdxJsxTextElement' ||
            node.type === 'mdxTextExpression',
        },
        [isJsx(node) ? processJsxElement(node, importMap, options) : node],
      );
    }
    const {
      children: descendants,
      position: _position,
      data: _data,
      ...metadata
    } = node as RootContent & { children?: RootContent[] };
    return host('rspress-md-node', metadata, descendants?.map(build) ?? []);
  };
  return host('rspress-md-region', { inline }, children.map(build));
}

function host(
  name: string,
  metadata: object,
  children: RootContent[],
): MdxJsxFlowElement {
  return {
    type: 'mdxJsxFlowElement',
    name,
    attributes: [
      {
        type: 'mdxJsxAttribute',
        name: 'data-md',
        value: JSON.stringify(metadata),
      },
    ],
    data: { _mdxExplicitJsx: true } as MdxJsxFlowElement['data'],
    children: children as any,
  };
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
function buildMdxFlowExpressionFragment(
  node: RootContent,
): MdxFlowExpression | MdxJsxFlowElement {
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
const processor = unified()
  .use(remarkMdx)
  .use(remarkGfm)
  .use(remarkStringify, {
    bullet: '-',
    emphasis: '_',
    fences: true,
    incrementListMarker: true,
    handlers: {
      mdxjsEsm: () => '',
    },
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
function collectEsmMetadata(tree: Root): {
  importMap: Map<string, string>;
  esmNodes: Set<MdxjsEsm>;
} {
  const importMap = new Map<string, string>();
  const esmNodes = new Set<MdxjsEsm>();

  visit(tree, 'mdxjsEsm', node => {
    esmNodes.add(node);

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
        }
      }
    }
  });

  return { importMap, esmNodes };
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
