import { randomUUID } from 'node:crypto';
import type { Root, RootContent } from 'mdast';
import {
  mdxToMarkdown,
  type MdxFlowExpression,
  type MdxJsxFlowElement,
  type MdxJsxTextElement,
  type MdxjsEsm,
  type MdxTextExpression,
} from 'mdast-util-mdx';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkStringify, {
  type Options as StringifyOptions,
} from 'remark-stringify';
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
 * Converts Markdown to text while preserving executable JSX and MDX expressions.
 */
export function remarkSplitMdx(
  options: RemarkSplitMdxOptions = {},
): (tree: Root) => void {
  return (tree: Root) => {
    const newChildren: RootContent[] = [];
    const { importMap, esmNodes } = collectEsmMetadata(tree);

    // Restore JSX-only task paragraphs so GFM keeps the checkbox.
    visit(tree, 'listItem', node => {
      const head = node.children[0];
      if (
        typeof node.checked === 'boolean' &&
        (head?.type === 'mdxJsxFlowElement' ||
          head?.type === 'mdxFlowExpression')
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

      // Find executable MDX at any depth.
      let hasMdxDescendants = false;
      visit(
        node,
        [
          'mdxJsxFlowElement',
          'mdxJsxTextElement',
          'mdxFlowExpression',
          'mdxTextExpression',
        ],
        () => {
          hasMdxDescendants = true;
        },
      );

      if (hasMdxDescendants) {
        newChildren.push({
          type: 'mdxJsxFlowElement',
          name: null, // Fragment
          attributes: [],
          // @ts-expect-error mdxJsxFlowElement children type
          children: serializeMarkdownWithMdx([node], importMap, options),
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

  if (shouldKeepJsxElement(node.name, importMap, options)) {
    return processedNode;
  }

  // Not kept - convert to text (preserving any JSX children that were kept)
  return buildMdxFlowExpressionFragment(processedNode);
}

// Group Markdown children to preserve paragraph separators.
function processJsxChildren(
  node: MdxJsxFlowElement | MdxJsxTextElement,
  importMap: Map<string, string>,
  options: RemarkSplitMdxOptions,
): MdxJsxFlowElement | MdxJsxTextElement {
  if (!node.children || node.children.length === 0) {
    return node;
  }

  if (node.type === 'mdxJsxTextElement') {
    return {
      ...node,
      children: serializeMarkdownWithMdx(
        node.children,
        importMap,
        options,
        node,
      ) as any,
    };
  }

  const processedChildren: RootContent[] = [];
  let textBuffer: RootContent[] = [];

  const flushTextBuffer = () => {
    if (textBuffer.length === 0) return;

    processedChildren.push(
      ...serializeMarkdownWithMdx(textBuffer, importMap, options),
    );
    textBuffer = [];
  };

  for (const child of node.children as RootContent[]) {
    if (
      child.type === 'mdxJsxFlowElement' ||
      child.type === 'mdxJsxTextElement'
    ) {
      // Flush any accumulated text before the JSX element
      flushTextBuffer();
      processedChildren.push(processJsxElement(child, importMap, options));
    } else if (
      child.type === 'mdxFlowExpression' ||
      child.type === 'mdxTextExpression'
    ) {
      // Preserve MDX expressions as-is
      flushTextBuffer();
      processedChildren.push(child as any);
    } else {
      // Buffer Markdown with nested MDX.
      textBuffer.push(child);
    }
  }

  // Flush any remaining text
  flushTextBuffer();

  return { ...node, children: processedChildren as any };
}

// Serialize Markdown, then restore executable MDX in place.
function serializeMarkdownWithMdx(
  children: RootContent[],
  importMap: Map<string, string>,
  options: RemarkSplitMdxOptions,
  inlineParent?: MdxJsxTextElement,
): RootContent[] {
  type MdxNode =
    | MdxJsxFlowElement
    | MdxJsxTextElement
    | MdxFlowExpression
    | MdxTextExpression;

  // Give each serialization pass unique markers.
  const prefix = `rspress${randomUUID().replaceAll('-', '')}mdx`;
  const nodes: MdxNode[] = [];
  const markers = new Map<MdxNode, string>();

  // Serializer lookahead can visit the same node twice.
  const preserveMdx = (node: MdxNode) => {
    let marker = markers.get(node);
    if (!marker) {
      marker = `${prefix}${nodes.length}end`;
      nodes.push(node);
      markers.set(node, marker);
    }
    return marker;
  };

  const handlers: StringifyOptions['handlers'] = {
    mdxJsxFlowElement: preserveMdx,
    mdxJsxTextElement(node, parent, state, info) {
      return shouldKeepJsxElement(node.name, importMap, options)
        ? preserveMdx(node)
        : mdxJsxTextElementHandler(node, parent, state, info);
    },
    mdxFlowExpression: preserveMdx,
    mdxTextExpression: preserveMdx,
  };
  let inlineMarkdown: string | undefined;
  if (inlineParent) {
    handlers.root = (_node, _parent, state, info) => {
      const exit = state.enter(inlineParent.type);
      inlineMarkdown = state.containerPhrasing(inlineParent, {
        ...info,
        before: '>',
        after: '<',
      });
      exit();
      return inlineMarkdown;
    };
  }
  const serialized = createMarkdownProcessor(handlers).stringify({
    type: 'root',
    children,
  });
  // Inline content must not gain a document newline.
  const markdown = inlineMarkdown ?? serialized;

  const result: RootContent[] = [];
  const restored = new Set<number>();
  let offset = 0;
  // Emphasis handlers can encode marker edges as character references.
  for (const match of markdown.matchAll(
    new RegExp(`(?:r|&#x72;)${prefix.slice(1)}(\\d+)en(?:d|&#x64;)`, 'g'),
  )) {
    if (match.index > offset) {
      result.push(createTextExpression(markdown.slice(offset, match.index)));
    }
    const index = Number(match[1]);
    const node = nodes[index];
    if (!node || restored.has(index)) {
      throw new Error(
        '[SSG-MD] Invalid or duplicate MDX marker during Markdown serialization.',
      );
    }
    restored.add(index);
    const processedNode =
      node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement'
        ? processJsxElement(node, importMap, options)
        : node;
    if (
      node.type === 'mdxJsxTextElement' ||
      node.type === 'mdxTextExpression'
    ) {
      result.push({
        type: 'mdxJsxTextElement',
        name: 'span',
        attributes: [],
        // Bypass components.span to keep the native inline boundary.
        data: { _mdxExplicitJsx: true } as MdxJsxTextElement['data'],
        children: [processedNode] as MdxJsxTextElement['children'],
      });
    } else {
      result.push(processedNode);
    }
    offset = match.index + match[0].length;
  }
  // Never drop components or leak markers.
  if (restored.size !== nodes.length) {
    throw new Error(
      '[SSG-MD] Could not restore all MDX markers after Markdown serialization.',
    );
  }
  if (offset < markdown.length) {
    result.push(createTextExpression(markdown.slice(offset)));
  }
  return result;
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
const processor = createMarkdownProcessor();

// Keep filtered tags in their original inline context.
const mdxJsxTextElementHandler = mdxToMarkdown().extensions!.find(
  extension => extension.handlers?.mdxJsxTextElement,
)!.handlers!.mdxJsxTextElement!;

// Isolate handlers between recursive calls.
function createMarkdownProcessor(handlers: StringifyOptions['handlers'] = {}) {
  return unified()
    .use(remarkMdx)
    .use(remarkGfm)
    .use(remarkStringify, {
      bullet: '-',
      emphasis: '_',
      fences: true,
      incrementListMarker: true,
      handlers: {
        mdxjsEsm: () => '',
        ...handlers,
      },
    });
}

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

  if (!componentName || importMap.get(componentName)?.endsWith('.mdx')) {
    return true; // Keep fragments, including imported MDX fragments
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
