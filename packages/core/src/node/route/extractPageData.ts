import fs from 'node:fs/promises';
import path from 'node:path';
import {
  type Header,
  MDX_OR_MD_REGEXP,
  type PageIndexInfo,
  type ReplaceRule,
  type RouteMeta,
} from '@rspress/shared';
import { loadFrontMatter } from '@rspress/shared/node-utils';
import remarkGFM from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { importStatementRegex } from '../constants';
import { parseToc } from '../mdx/remarkPlugins/toc';
import { flattenMdxContent } from '../utils';
import { applyReplaceRules } from '../utils/applyReplaceRules';
import type { RouteService } from './RouteService';

function applyReplaceRulesToNestedObject(
  obj: Record<string, unknown>,
  replaceRules: ReplaceRule[],
) {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = applyReplaceRules(obj[key], replaceRules);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      obj[key] = applyReplaceRulesToNestedObject(
        obj[key] as Record<string, unknown>,
        replaceRules,
      );
    }
  }

  return obj;
}

interface ExtractPageDataOptions {
  root: string;
  searchCodeBlocks: boolean;
  replaceRules: ReplaceRule[];
  alias: Record<string, string | string[]>;
}

const processor = unified()
  .use(remarkParse)
  .use(remarkMdx)
  .use(remarkGFM)
  .use(remarkStringify);

async function getPageIndexInfoByRoute(
  route: RouteMeta,
  options: ExtractPageDataOptions,
): Promise<PageIndexInfo> {
  const { alias, replaceRules, root } = options;
  const defaultIndexInfo: PageIndexInfo = {
    title: '',
    content: '',
    _flattenContent: '',
    routePath: route.routePath,
    lang: route.lang,
    toc: [],
    frontmatter: {},
    version: route.version,
    _filepath: route.absolutePath,
    _relativePath: path
      .relative(root, route.absolutePath)
      .split(path.sep)
      .join('/'),
  };
  if (!MDX_OR_MD_REGEXP.test(route.absolutePath)) {
    return defaultIndexInfo;
  }
  let content: string = await fs.readFile(route.absolutePath, 'utf8');
  const { frontmatter, content: contentWithoutFrontMatter } = loadFrontMatter(
    content,
    route.absolutePath,
    root,
  );

  // 1. Replace rules for frontmatter & content
  applyReplaceRulesToNestedObject(frontmatter, replaceRules);

  const { flattenContent } = await flattenMdxContent(
    applyReplaceRules(contentWithoutFrontMatter, replaceRules),
    route.absolutePath,
    alias,
  );

  content = flattenContent.replace(importStatementRegex, '');

  // Parse MDX and extract title/toc
  const mdast = processor.parse(content);
  const { title, toc: rawToc } = parseToc(mdast);

  // Convert back to plain text using remark-stringify
  const textContent = processor.stringify(mdast);
  content = String(textContent);

  // Remove the title from the content if it appears at the start
  if (content.startsWith(`# ${title}`)) {
    content = content.slice(`# ${title}`.length).trimStart();
  }

  // Calculate character index positions for each toc item
  const toc: Header[] = rawToc.map(item => {
    const match = item.id.match(/-(\d+)$/);
    let position = -1;
    if (match) {
      for (let i = 0; i < Number(match[1]); i++) {
        // When text is repeated, the position needs to be determined based on -number
        position = content.indexOf(`## ${item.text}`, position + 1);

        // If the positions don't match, it means the text itself may exist -number
        if (position === -1) {
          break;
        }
      }
    }
    // Find the heading in content (## for h2, ### for h3, etc.)
    const headingPrefix = '#'.repeat(item.depth);
    return {
      ...item,
      charIndex: content.indexOf(`${headingPrefix} ${item.text}`, position + 1),
    };
  });

  return {
    ...defaultIndexInfo,
    title: frontmatter.title || title,
    toc,
    // raw txt, for search index
    content,
    _flattenContent: flattenContent,
    frontmatter: {
      ...frontmatter,
      __content: undefined,
    },
  } satisfies PageIndexInfo;
}

async function extractPageData(
  routeService: RouteService,
  options: ExtractPageDataOptions,
): Promise<PageIndexInfo[]> {
  const pageData = await Promise.all(
    routeService.getRoutes().map(routeMeta => {
      return getPageIndexInfoByRoute(routeMeta, options);
    }),
  );
  return pageData;
}

export type { ExtractPageDataOptions };
export { extractPageData, getPageIndexInfoByRoute };
