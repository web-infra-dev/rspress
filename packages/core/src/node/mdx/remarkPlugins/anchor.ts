import fs from 'node:fs';
import type { Root } from 'mdast';
import remarkGFM from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

import { MDX_OR_MD_REGEXP } from '@rspress/shared';
import GithubSlugger from '@rspress/shared/github-slugger';
import { loadFrontMatter } from '@rspress/shared/node-utils';
import type { RoutePage } from '../../route/RoutePage';
import type { RouteService } from '../../route/RouteService';

interface HeadingChild {
  type: string;
  value?: string;
  children?: HeadingChild[];
}

interface HeadingNode {
  type: string;
  depth?: number;
  children?: HeadingChild[];
}

const processor = unified().use(remarkParse).use(remarkGFM);
const anchorCache = new Map<string, Set<string>>();

function extractChildText(child: HeadingChild): string {
  if (typeof child.value === 'string') {
    return child.value;
  }

  if (Array.isArray(child.children)) {
    return child.children.map(extractChildText).join('');
  }

  return '';
}

export function collectHeadingIds(tree: Root): Set<string> {
  const slugger = new GithubSlugger();
  const ids = new Set<string>();

  for (const node of tree.children as HeadingNode[]) {
    if (
      node.type !== 'heading' ||
      !node.depth ||
      node.depth < 1 ||
      node.depth > 6 ||
      !node.children
    ) {
      continue;
    }

    let customId = '';
    const text = node.children
      .map(child => {
        const value = extractChildText(child);
        if (child.type === 'text') {
          const [textPart, idPart] = extractTextAndId(value);
          customId = idPart;
          return textPart;
        }
        return value;
      })
      .join('')
      .trim();

    ids.add(customId || slugger.slug(text));
  }

  return ids;
}

function extractTextAndId(title: string): [text: string, customId: string] {
  const customIdReg = /\\?{#.*}/;
  if (customIdReg.test(title)) {
    const text = title.replace(customIdReg, '').trimEnd();
    const matched = title.match(customIdReg)?.[0] ?? '';
    const customId = matched.replace(/^\\?{#/, '').replace(/}$/, '');
    return [text, customId];
  }
  return [title, ''];
}

export function getRouteAnchorIds(
  routePage: RoutePage,
  routeService: RouteService,
  currentTree?: Root,
  currentFilePath?: string,
): Set<string> | null {
  const { absolutePath } = routePage.routeMeta;

  if (!MDX_OR_MD_REGEXP.test(absolutePath)) {
    return null;
  }

  if (currentTree && currentFilePath === absolutePath) {
    return collectHeadingIds(currentTree);
  }

  const cached = anchorCache.get(absolutePath);
  if (cached) {
    return cached;
  }

  const source = fs.readFileSync(absolutePath, 'utf8');
  const { content } = loadFrontMatter(
    source,
    absolutePath,
    routeService.getDocsDir(),
  );
  const tree = processor.parse(content) as Root;
  const ids = collectHeadingIds(tree);
  anchorCache.set(absolutePath, ids);
  return ids;
}
