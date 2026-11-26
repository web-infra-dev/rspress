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

const nativeInlineTags = new Set([
  'a',
  'abbr',
  'b',
  'bdi',
  'bdo',
  'cite',
  'del',
  'dfn',
  'em',
  'i',
  'ins',
  'kbd',
  'mark',
  'q',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'u',
  'var',
]);

const phrasingTypes = new Set<RootContent['type']>([
  'break',
  'delete',
  'emphasis',
  'footnoteReference',
  'html',
  'image',
  'imageReference',
  'inlineCode',
  'link',
  'linkReference',
  'mdxJsxTextElement',
  'mdxTextExpression',
  'strong',
  'text',
]);

function hasInlineChildren(node: JsxNode): boolean {
  return (
    node.type === 'mdxJsxTextElement' ||
    (node.name !== null &&
      nativeInlineTags.has(node.name) &&
      node.children.every(child => phrasingTypes.has(child.type)))
  );
}

interface TransformContext {
  importMap: Map<string, string>;
  esmNodes: Set<MdxjsEsm>;
  mixedNodes: WeakSet<RootContent>;
  options: RemarkSplitMdxOptions;
}

export function remarkSplitMdx(options: RemarkSplitMdxOptions = {}) {
  return (tree: Root) => {
    const context = { ...prepareTree(tree), options };
    const writer = new MarkdownWriter(context);
    writer.flow(tree.children);
    tree.children = [
      ...context.esmNodes,
      {
        type: 'mdxJsxFlowElement',
        name: null,
        attributes: [],
        children: writer.finish() as MdxJsxFlowElement['children'],
      },
    ];
  };
}

// Buffer text until an executable node interrupts it.
class MarkdownWriter {
  private text = '';
  private readonly output: RootContent[] = [];
  private lineStart = true;
  private prefix = '';
  private inTable = false;
  private isLiteralText = false;
  private readonly context: TransformContext;

  constructor(context: TransformContext) {
    this.context = context;
  }

  private write(value: string) {
    if (!value) return;
    if (this.inTable) value = value.replace(/(?<!\\)\|/g, '\\|');
    if (!this.prefix) {
      this.text += value;
      this.lineStart = value.endsWith('\n');
      return;
    }
    for (const line of value.split(/(?<=\n)/)) {
      if (!line) continue;
      const prefix =
        line === '\n'
          ? this.prefix.includes('>')
            ? this.prefix.trimEnd()
            : ''
          : this.prefix;
      this.text += (this.lineStart ? prefix : '') + line;
      this.lineStart = line.endsWith('\n');
    }
  }

  private emit(node: MdxNode) {
    if (this.lineStart) {
      this.text += this.prefix;
      this.lineStart = false;
    }
    if (this.text) {
      this.output.push(createTextExpression(this.text));
      this.text = '';
    }
    this.output.push(node);
  }

  finish(): RootContent[] {
    if (this.text) this.output.push(createTextExpression(this.text));
    return this.output;
  }

  flow(children: RootContent[]) {
    if (this.isLiteralText) {
      this.phrasing(children);
      return;
    }
    let markdown: RootContent[] = [];
    let afterMdx = false;
    const flush = (beforeMdx = false) => {
      if (!markdown.length) return;
      if (markdown.every(node => !this.context.mixedNodes.has(node))) {
        this.write(stringifyMarkdown(markdown));
      } else {
        this.blocks(markdown);
        this.write('\n');
      }
      if (beforeMdx) this.write('\n');
      markdown = [];
    };
    for (const node of children) {
      if (node.type === 'mdxjsEsm') continue;
      if (afterMdx) this.write('\n');
      afterMdx = isMdxNode(node);
      if (afterMdx) {
        flush(true);
        this.node(node);
      } else markdown.push(node);
    }
    flush();
  }

  private blocks(children: RootContent[], separator = '\n\n') {
    children.forEach((node, index) => {
      if (index) this.write(separator);
      // MDX unwraps JSX-only paragraphs in lists and footnotes.
      this.node(node, isMdxNode(node));
    });
  }

  private phrasing(children: RootContent[]) {
    for (const child of children) this.node(child, true);
  }

  private indented(prefix: string, action: () => void) {
    const previous = this.prefix;
    this.prefix += prefix;
    action();
    this.prefix = previous;
  }

  private jsx(node: JsxNode) {
    if (
      !shouldKeepJsxElement(
        node.name,
        this.context.importMap,
        this.context.options,
      )
    ) {
      if (!node.children.length)
        this.write(stringifyMarkdown([node]).replace(/\n$/, ''));
      else {
        this.write(serializeOpeningTag(node));
        if (hasInlineChildren(node))
          this.phrasing(node.children as RootContent[]);
        else this.flow(node.children as RootContent[]);
        this.write(serializeClosingTag(node));
      }
      return;
    }
    if (!node.children.length) return node;
    const writer = new MarkdownWriter(this.context);
    writer.inTable = this.inTable;
    writer.isLiteralText =
      this.isLiteralText || node.name === 'code' || node.name === 'pre';
    if (hasInlineChildren(node))
      writer.phrasing(node.children as RootContent[]);
    else writer.flow(node.children as RootContent[]);
    return { ...node, children: writer.finish() } as JsxNode;
  }

  private node(node: RootContent, inline = false) {
    if (isMdxNode(node)) {
      const processed = isJsxNode(node) ? this.jsx(node) : node;
      if (!processed) return;
      this.emit(
        inline ||
          node.type === 'mdxJsxTextElement' ||
          node.type === 'mdxTextExpression'
          ? inlineNode(processed)
          : processed,
      );
      return;
    }
    if ((inline || this.isLiteralText) && node.type === 'text') {
      this.write(
        this.isLiteralText
          ? node.value
          : node.value.replace(/[\\`*_[\]<>~]/g, '\\$&'),
      );
      return;
    }
    if (this.isLiteralText && node.type === 'paragraph') {
      this.phrasing(node.children);
      return;
    }
    if (!this.context.mixedNodes.has(node)) {
      this.write(stringifyMarkdown([node]).replace(/\n$/, ''));
      return;
    }
    switch (node.type) {
      case 'paragraph':
        this.phrasing(node.children);
        break;
      case 'heading':
        this.write('#'.repeat(node.depth) + ' ');
        this.phrasing(node.children);
        break;
      case 'emphasis':
        this.wrap('_', node.children);
        break;
      case 'strong':
        this.wrap('**', node.children);
        break;
      case 'delete':
        this.wrap('~~', node.children);
        break;
      case 'link': {
        this.write('[');
        this.phrasing(node.children);
        // Use the native serializer for destination and title escaping.
        const link = stringifyMarkdown([
          { ...node, children: [{ type: 'text', value: 'label' }] },
        ]);
        this.write(link.slice(link.indexOf(']')).replace(/\n$/, ''));
        break;
      }
      case 'linkReference':
        this.write('[');
        this.phrasing(node.children);
        this.write(
          ']' +
            (node.referenceType === 'full'
              ? '[' + escapeLabel(node.label ?? node.identifier) + ']'
              : node.referenceType === 'collapsed'
                ? '[]'
                : ''),
        );
        break;
      case 'blockquote':
        this.indented('> ', () => this.blocks(node.children));
        break;
      case 'list':
        this.list(node);
        break;
      case 'footnoteDefinition':
        this.write('[^' + escapeLabel(node.label ?? node.identifier) + ']: ');
        this.indented('    ', () => this.blocks(node.children));
        break;
      case 'table':
        this.table(node);
        break;
      default:
        throw new Error(
          '[SSG-MD] Unsupported mixed Markdown node: ' + node.type,
        );
    }
  }

  private wrap(marker: string, children: RootContent[]) {
    this.write(marker);
    this.phrasing(children);
    this.write(marker);
  }

  private list(node: Extract<RootContent, { type: 'list' }>) {
    node.children.forEach((item, index) => {
      if (index) this.write(node.spread ? '\n\n' : '\n');
      const marker = node.ordered ? `${(node.start ?? 1) + index}. ` : '- ';
      this.write(marker);
      this.indented(' '.repeat(marker.length), () => {
        if (typeof item.checked === 'boolean')
          this.write(item.checked ? '[x] ' : '[ ] ');
        this.blocks(item.children, item.spread ? '\n\n' : '\n');
      });
    });
  }

  private table(node: Extract<RootContent, { type: 'table' }>) {
    node.children.forEach((row, index) => {
      if (index) this.write('\n');
      this.write('| ');
      row.children.forEach((cell, column) => {
        if (column) this.write(' | ');
        this.inTable = true;
        this.phrasing(cell.children);
        this.inTable = false;
      });
      this.write(' |');
      if (!index) {
        const alignments = node.align ?? row.children.map(() => null);
        this.write(
          '\n| ' +
            alignments
              .map(align =>
                align === 'center'
                  ? ':---:'
                  : align === 'left'
                    ? ':---'
                    : align === 'right'
                      ? '---:'
                      : '---',
              )
              .join(' | ') +
            ' |',
        );
      }
    });
  }
}

function inlineNode(node: MdxNode): MdxJsxTextElement {
  return {
    type: 'mdxJsxTextElement',
    name: 'span',
    attributes: [],
    data: { _mdxExplicitJsx: true } as MdxJsxTextElement['data'],
    children: [node] as MdxJsxTextElement['children'],
  };
}

function escapeLabel(value: string): string {
  return value.replace(/[\\[\]]/g, '\\$&');
}

function getComponentName(name: string | null): string | null {
  if (!name) return null;
  const dot = name.indexOf('.');
  return dot === -1 ? name : name.slice(0, dot);
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

function stringifyMarkdown(children: RootContent[]): string {
  return toMarkdown({ type: 'root', children }, markdownOptions);
}

// Collect imports and mixed subtrees once.
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
