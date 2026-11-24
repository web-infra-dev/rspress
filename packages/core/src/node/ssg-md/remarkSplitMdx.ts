import { randomUUID } from 'node:crypto';
import { gfmToMarkdown } from 'mdast-util-gfm';
import {
  toMarkdown,
  type Options as StringifyOptions,
} from 'mdast-util-to-markdown';
import type { Root, RootContent } from 'mdast';
import {
  mdxToMarkdown,
  type MdxFlowExpression,
  type MdxJsxFlowElement,
  type MdxJsxTextElement,
  type MdxjsEsm,
  type MdxTextExpression,
} from 'mdast-util-mdx';

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

type JsxNode = MdxJsxFlowElement | MdxJsxTextElement;
type MdxNode = JsxNode | MdxFlowExpression | MdxTextExpression;

interface TransformContext {
  importMap: Map<string, string>;
  esmNodes: Set<MdxjsEsm>;
  mixedNodes: WeakSet<RootContent>;
  options: RemarkSplitMdxOptions;
}

/**
 * Converts Markdown to text while preserving executable JSX and MDX expressions.
 */
export function remarkSplitMdx(
  options: RemarkSplitMdxOptions = {},
): (tree: Root) => void {
  return (tree: Root) => {
    const context = { ...prepareTree(tree), options };
    const newChildren: RootContent[] = [...context.esmNodes];
    let markdown: RootContent[] = [];
    const flushMarkdown = () => {
      if (!markdown.length) return;
      if (markdown.some(node => context.mixedNodes.has(node))) {
        newChildren.push(
          createFragment(serializeMarkdownWithMdx(markdown, context)),
        );
      } else {
        newChildren.push({
          ...createTextExpression(stringifyMarkdown(markdown)),
          type: 'mdxFlowExpression',
        });
      }
      markdown = [];
    };

    for (const node of tree.children) {
      if (node.type === 'mdxjsEsm') continue;
      if (isMdxNode(node)) {
        flushMarkdown();
        newChildren.push(
          isJsxNode(node) ? processJsxElement(node, context) : node,
        );
      } else {
        markdown.push(node);
      }
    }
    flushMarkdown();

    tree.children = newChildren as any;
  };
}

function processJsxElement(
  node: JsxNode,
  context: TransformContext,
): JsxNode | MdxTextExpression {
  const processed = processJsxChildren(node, context);
  if (shouldKeepJsxElement(node.name, context.importMap, context.options))
    return processed;
  if (!node.children.length)
    return createTextExpression(serializeNodeToMarkdown(node));

  return createFragment([
    createTextExpression(serializeOpeningTag(node)),
    ...(processed.children as RootContent[]),
    createTextExpression(serializeClosingTag(node)),
  ]);
}

// Group Markdown children to preserve paragraph separators.
function processJsxChildren(node: JsxNode, context: TransformContext): JsxNode {
  if (!node.children || node.children.length === 0) {
    return node;
  }

  if (node.type === 'mdxJsxTextElement') {
    return {
      ...node,
      children: serializeMarkdownWithMdx(
        node.children as RootContent[],
        context,
        node,
      ) as any,
    };
  }

  const processedChildren: RootContent[] = [];
  let textBuffer: RootContent[] = [];

  const flushTextBuffer = () => {
    if (textBuffer.length === 0) return;

    processedChildren.push(...serializeMarkdownWithMdx(textBuffer, context));
    textBuffer = [];
  };

  for (const child of node.children as RootContent[]) {
    if (isJsxNode(child)) {
      // Flush any accumulated text before the JSX element
      flushTextBuffer();
      processedChildren.push(processJsxElement(child, context));
    } else if (isMdxNode(child)) {
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
  context: TransformContext,
  inlineParent?: MdxJsxTextElement,
): RootContent[] {
  if (!children.some(node => context.mixedNodes.has(node))) {
    const markdown = stringifyMarkdown(children, undefined, inlineParent);
    return markdown ? [createTextExpression(markdown)] : [];
  }

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
      return shouldKeepJsxElement(node.name, context.importMap, context.options)
        ? preserveMdx(node)
        : mdxJsxTextElementHandler(node, parent, state, info);
    },
    mdxFlowExpression: preserveMdx,
    mdxTextExpression: preserveMdx,
  };
  const markdown = stringifyMarkdown(children, handlers, inlineParent);

  if (!nodes.length) return markdown ? [createTextExpression(markdown)] : [];

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
    const processedNode = isJsxNode(node)
      ? processJsxElement(node, context)
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

function getComponentName(name: string | null): string | null {
  if (!name) return null;
  const dot = name.indexOf('.');
  return dot === -1 ? name : name.slice(0, dot);
}

function createFragment(children: RootContent[]): MdxJsxFlowElement {
  return {
    type: 'mdxJsxFlowElement',
    name: null,
    attributes: [],
    children: children as MdxJsxFlowElement['children'],
  };
}

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

function serializeClosingTag(
  node: MdxJsxFlowElement | MdxJsxTextElement,
): string {
  const name = typeof node.name === 'string' ? node.name : '';
  if (!name) return '';
  return `</${name}>`;
}

const mdxExtension = mdxToMarkdown();
const markdownOptions: StringifyOptions = {
  bullet: '-',
  emphasis: '_',
  fences: true,
  incrementListMarker: true,
  extensions: [mdxExtension, gfmToMarkdown()],
  handlers: { mdxjsEsm: () => '' },
};

const mdxJsxTextElementHandler = mdxExtension.extensions!.find(
  extension => extension.handlers?.mdxJsxTextElement,
)!.handlers!.mdxJsxTextElement!;

function stringifyMarkdown(
  children: RootContent[],
  handlers?: StringifyOptions['handlers'],
  inlineParent?: MdxJsxTextElement,
): string {
  const tree: Root = { type: 'root', children };
  if (!handlers && !inlineParent) return toMarkdown(tree, markdownOptions);

  let inlineMarkdown: string | undefined;
  const localHandlers: StringifyOptions['handlers'] = {
    ...markdownOptions.handlers,
    ...handlers,
  };
  if (inlineParent) {
    localHandlers.root = (_node, _parent, state, info) => {
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
  const markdown = toMarkdown(tree, {
    ...markdownOptions,
    handlers: localHandlers,
  });
  // Inline content must not gain a document newline.
  return inlineMarkdown ?? markdown;
}

function serializeNodeToMarkdown(node: RootContent): string {
  return stringifyMarkdown([node]);
}

// Collect imports, restore task paragraphs, and find mixed subtrees once.
function prepareTree(tree: Root): Omit<TransformContext, 'options'> {
  const importMap = new Map<string, string>();
  const esmNodes = new Set<MdxjsEsm>();
  const mixedNodes = new WeakSet<RootContent>();

  const scan = (node: Root | RootContent): boolean => {
    if (node.type === 'mdxjsEsm') {
      esmNodes.add(node);
      for (const statement of node.data?.estree?.body ?? []) {
        if (statement.type !== 'ImportDeclaration') continue;
        for (const specifier of statement.specifiers) {
          importMap.set(specifier.local.name, String(statement.source.value));
        }
      }
      return false;
    }
    if (node.type === 'listItem' && typeof node.checked === 'boolean') {
      const head = node.children[0];
      if (
        head?.type === 'mdxJsxFlowElement' ||
        head?.type === 'mdxFlowExpression'
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
    }
    let mixed = isMdxNode(node);
    if ('children' in node) {
      for (const child of node.children) {
        if (scan(child as RootContent)) mixed = true;
      }
    }
    if (mixed && node.type !== 'root') mixedNodes.add(node);
    return mixed;
  };
  scan(tree);
  return { importMap, esmNodes, mixedNodes };
}

function isJsxNode(node: Root | RootContent): node is JsxNode {
  return node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement';
}

function isMdxNode(node: Root | RootContent): node is MdxNode {
  return (
    isJsxNode(node) ||
    node.type === 'mdxFlowExpression' ||
    node.type === 'mdxTextExpression'
  );
}

function shouldKeepJsxElement(
  nameField: string | null,
  importMap: Map<string, string>,
  options: RemarkSplitMdxOptions,
): boolean {
  const componentName = getComponentName(nameField);

  if (!componentName || importMap.get(componentName)?.endsWith('.mdx')) {
    return true; // Keep fragments, including imported MDX fragments
  }

  const { includes, excludes } = options;
  const importSource = importMap.get(componentName);

  if (!includes && !excludes) {
    return true;
  }

  // Excludes take precedence.
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

  if (includes) {
    for (const [includeSpecifiers, includeSource] of includes) {
      if (
        includeSpecifiers.includes(componentName) &&
        (!importSource || importSource === includeSource)
      ) {
        return true;
      }
    }
    return false;
  }

  return true;
}
