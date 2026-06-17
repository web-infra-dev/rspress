import Slugger from '@rspress/shared/github-slugger';
import { extractTextAndId } from '@rspress/shared/node-utils';
import type { Root as HastRoot } from 'hast';
import type { Root as MdastRoot } from 'mdast';
import type { Plugin } from 'unified';
import { visitChildren } from 'unist-util-visit-children';
import type { VFile } from 'vfile';
import type { RouteService } from '../../route/RouteService';
import type { PageMeta } from '../types';

export interface TocItem {
  id: string;
  text: string;
  depth: number;
}

interface ChildNode {
  type: 'link' | 'text' | 'inlineCode' | 'strong' | 'emphasis' | 'delete';
  value: string;
  children?: ChildNode[];
}

interface Heading {
  type: string;
  depth?: number;
  children?: ChildNode[];
}

const extractChildText = (
  child: ChildNode,
  preserveInlineMarkdown = true,
): string => {
  if (child.type === 'link') {
    return (
      child.children
        ?.map(child => extractChildText(child, preserveInlineMarkdown))
        .join('') ?? ''
    );
  }
  if (child.type === 'strong') {
    const text =
      child.children
        ?.map(child => extractChildText(child, preserveInlineMarkdown))
        .join('') ?? '';
    return preserveInlineMarkdown ? `**${text}**` : text;
  }
  if (child.type === 'emphasis') {
    const text =
      child.children
        ?.map(child => extractChildText(child, preserveInlineMarkdown))
        .join('') ?? '';
    return preserveInlineMarkdown ? `*${text}*` : text;
  }
  if (child.type === 'delete') {
    const text =
      child.children
        ?.map(child => extractChildText(child, preserveInlineMarkdown))
        .join('') ?? '';
    return preserveInlineMarkdown ? `~~${text}~~` : text;
  }
  if (child.type === 'text') {
    return child.value;
  }
  if (child.type === 'inlineCode') {
    return preserveInlineMarkdown ? `\`${child.value}\`` : child.value;
  }
  return '';
};

export const parseToc = (tree: MdastRoot | HastRoot) => {
  let title = '';
  const toc: TocItem[] = [];
  const anchorIds: string[] = [];
  const slugger = new Slugger();
  visitChildren((node: Heading) => {
    if (node.type !== 'heading' || !node.depth || !node.children) {
      return;
    }

    // Collect h1 ~ h6 anchor ids, and only expose h2 ~ h4 in TOC.
    if (node.depth >= 1 && node.depth <= 6) {
      let customId = '';
      const text = node.children
        .map((child: ChildNode) => {
          if (child.type === 'text') {
            const [textPart, idPart] = extractTextAndId(child.value);
            customId = idPart;
            return textPart;
          }
          return extractChildText(child);
        })
        .join('')
        .trim();
      const titleText = node.children
        .map((child: ChildNode) => {
          if (child.type === 'text') {
            const [textPart] = extractTextAndId(child.value);
            return textPart;
          }
          return extractChildText(child, false);
        })
        .join('')
        .trim();

      const id = customId ? customId : slugger.slug(text);
      anchorIds.push(id);

      if (node.depth === 1) {
        if (!title) title = titleText;
      } else if (node.depth < 5) {
        const { depth } = node;
        toc.push({ id, text, depth });
      }
    }
  })(tree);
  return {
    title,
    toc,
    anchorIds,
  };
};

interface RemarkTocOptions {
  routeService?: RouteService | null;
}

export const remarkToc: Plugin<[RemarkTocOptions?], HastRoot> = function (
  options = {},
) {
  const data = this.data() as {
    pageMeta: PageMeta;
  };
  return (tree: HastRoot, file: VFile) => {
    const { toc, title, anchorIds } = parseToc(tree);
    data.pageMeta.toc = toc;
    if (title) {
      data.pageMeta.title = title;
    }
    if (file.path) {
      options.routeService?.setRouteAnchorIds(file.path, new Set(anchorIds));
    }
  };
};
