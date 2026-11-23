import type { Root, RootContent } from 'mdast';
import { toMarkdown } from 'mdast-util-to-markdown';
import { gfmToMarkdown } from 'mdast-util-gfm';
import type {
  MarkdownSerializationContext,
  RenderToMarkdownOptions,
  ResolvedMarkdownNode,
} from 'react-render-to-markdown';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

const processor = unified().use(remarkParse).use(remarkGfm);
const stringify = (tree: Root) =>
  toMarkdown(tree, {
    bullet: '-',
    emphasis: '_',
    fences: true,
    incrementListMarker: true,
    extensions: [gfmToMarkdown()],
  });

type Element = Extract<ResolvedMarkdownNode, { type: 'element' }>;
const metadata = (node: Element): Record<string, unknown> =>
  JSON.parse(String(node.props['data-md']));

/** Raw component strings retain the renderer's existing Markdown meaning. */
function parseFragment(markdown: string, inline: boolean): RootContent[] {
  const children = processor.parse(markdown).children;
  if (!inline) return children;
  if (!children.length) return [];
  if (children.length === 1 && children[0].type === 'paragraph') {
    return children[0].children as RootContent[];
  }
  throw new Error(
    '[SSG-MD] A component in inline Markdown must return phrasing content.',
  );
}

function resolveChildren(
  nodes: readonly ResolvedMarkdownNode[],
  inline: boolean,
  context: MarkdownSerializationContext,
  markdownText = true,
): RootContent[] {
  const result: RootContent[] = [];
  let text = '';
  const flush = () => {
    if (!text) return;
    // Preserve whitespace-only strings, and boundary whitespace that a standalone
    // Markdown parser would trim. Text from authored nodes is never parsed again.
    const leading = text.match(/^\s*/)?.[0] ?? '';
    const trailing = text.slice(leading.length).match(/\s*$/)?.[0] ?? '';
    const body = text.slice(
      leading.length,
      trailing ? -trailing.length : undefined,
    );
    if (leading) result.push({ type: 'text', value: leading });
    if (body) result.push(...parseFragment(body, inline));
    if (trailing) result.push({ type: 'text', value: trailing });
    text = '';
  };
  for (const node of nodes) {
    if (node.type === 'text') {
      if (markdownText) text += node.value;
      else {
        flush();
        result.push({ type: 'text', value: node.value });
      }
    } else {
      flush();
      result.push(...resolveElement(node, inline, context));
    }
  }
  flush();
  return result;
}

function resolveElement(
  node: Element,
  inline: boolean,
  context: MarkdownSerializationContext,
): RootContent[] {
  if (node.name === 'rspress-md-literal')
    return [{ type: 'html', value: String(metadata(node).value) }];
  if (node.name === 'rspress-md-node') {
    const data = metadata(node);
    const type = String(data.type);
    const phrasing = [
      'paragraph',
      'heading',
      'emphasis',
      'strong',
      'delete',
      'link',
      'linkReference',
      'tableCell',
    ].includes(type);
    const children = resolveChildren(node.children, phrasing, context);
    // Empty emphasis/strong is not valid Markdown.
    if (['emphasis', 'strong', 'delete'].includes(type) && !children.length)
      return [];
    return [
      { ...data, ...(node.children.length ? { children } : {}) } as RootContent,
    ];
  }
  if (node.name === 'rspress-md-region' || node.name === 'rspress-md-slot') {
    const authoredInline = Boolean(metadata(node).inline);
    return resolveChildren(node.children, authoredInline, context);
  }
  if (node.name === 'style' || node.name === 'script') return [];
  const children = () => resolveChildren(node.children, true, context, false);
  const phrasingTypes: Record<string, string> = {
    strong: 'strong',
    b: 'strong',
    em: 'emphasis',
    i: 'emphasis',
    del: 'delete',
    s: 'delete',
  };
  if (phrasingTypes[node.name]) {
    const content = children();
    return content.length
      ? [{ type: phrasingTypes[node.name], children: content } as RootContent]
      : [];
  }
  if (node.name === 'a')
    return [
      {
        type: 'link',
        url: String(node.props.href ?? '#'),
        title: node.props.title ? String(node.props.title) : null,
        children: children(),
      } as RootContent,
    ];
  if (node.name === 'img')
    return [
      {
        type: 'image',
        url: String(node.props.src ?? ''),
        alt: String(node.props.alt ?? ''),
        title: node.props.title ? String(node.props.title) : null,
      },
    ];
  if (node.name === 'code') {
    const value = node.children
      .map(child =>
        child.type === 'text' ? child.value : context.serialize(child),
      )
      .join('');
    return [{ type: 'inlineCode', value }];
  }
  if (node.name === 'br') return [{ type: 'break' }];
  if (node.name === 'p') {
    if (inline) return children();
    return [{ type: 'paragraph', children: children() } as RootContent];
  }
  if (/^h[1-6]$/.test(node.name)) {
    if (inline)
      throw new Error(
        '[SSG-MD] A heading cannot be inserted into inline Markdown.',
      );
    return [
      {
        type: 'heading',
        depth: Number(node.name[1]),
        children: children(),
      } as RootContent,
    ];
  }
  // Transparent containers preserve authored descendants directly. Inline div
  // wrappers with phrasing output are supported, but multiple paragraphs are
  // rejected instead of silently breaking the surrounding Markdown structure.
  if (
    inline &&
    node.children.filter(
      child => child.type === 'element' && child.name === 'p',
    ).length > 1
  ) {
    throw new Error(
      '[SSG-MD] Multiple paragraphs cannot be inserted into inline Markdown.',
    );
  }
  if (
    [
      'root',
      'span',
      'div',
      'section',
      'article',
      'main',
      'aside',
      'details',
      'summary',
      'figure',
      'figcaption',
    ].includes(node.name)
  ) {
    return resolveChildren(node.children, inline, context, false);
  }
  return parseFragment(context.defaultSerialize(node), inline);
}

function serializeRegion(
  node: ResolvedMarkdownNode,
  context: MarkdownSerializationContext,
): string | undefined {
  if (node.type !== 'element') return undefined;
  const inline = Boolean(metadata(node).inline);
  const children = resolveChildren(node.children, inline, context);
  if (!inline) return stringify({ type: 'root', children } as Root);
  const paragraph = { type: 'paragraph', children };
  // Serialize the whole phrasing region with its actual boundaries, then remove
  // only the document newline. Authored trailing whitespace remains intact.
  return stringify({ type: 'root', children: [paragraph] } as Root).replace(
    /\n$/,
    '',
  );
}

export const markdownRegionOptions: RenderToMarkdownOptions = {
  serializers: {
    'rspress-md-region': serializeRegion,
    'rspress-md-literal': node =>
      node.type === 'element' ? String(metadata(node).value) : undefined,
  },
};
