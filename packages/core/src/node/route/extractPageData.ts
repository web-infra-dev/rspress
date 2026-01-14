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
import type { Root } from 'mdast';
import remarkGFM from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import type { Plugin } from 'unified';
import { unified } from 'unified';
import { remove } from 'unist-util-remove';
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

/**
 * Remark plugin to remove code blocks from the AST
 * Used when searchCodeBlocks is false to exclude code from search index
 */
const remarkRemoveCodeBlocks: Plugin<[], Root> = () => {
  return tree => {
    remove(tree, 'code');
  };
};

/**
 * Remark plugin to remove images from the AST
 * Images should not appear in search content
 */
const remarkRemoveImages: Plugin<[], Root> = () => {
  return tree => {
    remove(tree, 'image');
  };
};

/**
 * Remark plugin to strip link URLs, keeping only the link text
 * This mimics html-to-text's ignoreHref behavior
 */
const remarkStripLinkUrls: Plugin<[], Root> = () => {
  return tree => {
    const visit = (node: any) => {
      if (node.type === 'link') {
        // Convert link to its children (text content only)
        // The link node stays but URL is ignored in stringify
        node.url = '';
      }
      if (node.children) {
        node.children.forEach(visit);
      }
    };
    visit(tree);
  };
};

async function getPageIndexInfoByRoute(
  route: RouteMeta,
  options: ExtractPageDataOptions,
): Promise<PageIndexInfo> {
  const { alias, replaceRules, root, searchCodeBlocks } = options;
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
  // Normalize line endings to LF for cross-platform consistency
  content = content.replace(/\r\n/g, '\n');

  // Parse markdown to AST using unified + remark-parse
  const parseProcessor = unified().use(remarkParse).use(remarkGFM);
  const tree = parseProcessor.parse(content);

  // Extract title and TOC from AST
  const { title, toc: rawToc } = parseToc(tree);

  // Process AST and stringify back to markdown for search content
  // Build processor chain: parse -> plugins -> stringify
  const stringifyProcessor = unified()
    .use(remarkParse)
    .use(remarkGFM)
    .use(remarkRemoveImages)
    .use(remarkStripLinkUrls)
    .use(searchCodeBlocks ? [] : [remarkRemoveCodeBlocks])
    .use(remarkStringify, {
      bullet: '-',
      listItemIndent: 'one',
    });

  const processedTree = await stringifyProcessor.run(
    stringifyProcessor.parse(content),
  );
  let processedContent = String(
    stringifyProcessor.stringify(processedTree as Root),
  );

  // Remove the title from the content if it appears at the start
  if (processedContent.startsWith(`# ${title}`)) {
    processedContent = processedContent.slice(`# ${title}`.length).trimStart();
  }

  // Calculate character index positions for each toc item
  const toc: Header[] = rawToc.map(item => {
    const match = item.id.match(/-(\d+)$/);
    let position = -1;
    if (match) {
      for (let i = 0; i < Number(match[1]); i++) {
        // When text is repeated, the position needs to be determined based on -number
        position = processedContent.indexOf(`## ${item.text}`, position + 1);

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
      charIndex: processedContent.indexOf(
        `${headingPrefix} ${item.text}`,
        position + 1,
      ),
    };
  });

  return {
    ...defaultIndexInfo,
    title: frontmatter.title || title,
    toc,
    // processed markdown content for search index
    content: processedContent,
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
