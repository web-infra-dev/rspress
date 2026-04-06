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
import type { Node, Nodes, Root } from 'mdast';
import remarkGFM from 'remark-gfm';
import remarkParse from 'remark-parse';
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
  extractDescription?: boolean;
  /**
   * Whether search is enabled. When false, skip search index content generation.
   */
  searchEnabled?: boolean;
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
 * Cached processor instances for performance optimization
 * Reusing processors avoids the overhead of creating new instances for each file
 */
const createProcessor = (searchCodeBlocks: boolean) =>
  unified()
    .use(remarkParse)
    .use(remarkGFM)
    .use(remarkRemoveImages)
    .use(searchCodeBlocks ? [] : [remarkRemoveCodeBlocks]);

const processorWithCode = createProcessor(true);
const processorWithoutCode = createProcessor(false);

/**
 * Extract text content from a node recursively
 */
function extractTextFromNode(node: Node): string {
  if ('value' in node && typeof node.value === 'string') {
    return node.value;
  }
  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map(extractTextFromNode).join('');
  }
  return '';
}

/**
 * Nodes that we should just ignore for search indexing
 */
const SEARCH_SKIP_TYPES = new Set([
  'image',
  'imageReference',
  'definition',
  'footnoteDefinition',
  'footnoteReference',
  'html',
  'thematicBreak',
  'mdxJsxFlowElement',
  'mdxJsxTextElement',
  'mdxFlowExpression',
  'mdxTextExpression',
  'mdxjsEsm',
]);

/**
 * Block level nodes that should have a trailing newline or are separated naturally in the markdown already.
 */
const SEARCH_BLOCK_TYPES = new Set([
  'paragraph',
  'heading',
  'listItem',
  'tableRow',
]);

/**
 * Recursively extract raw text from the mdast
 */
function extractSearchText(node: Nodes, codeblocks: boolean): string {
  const { type } = node;

  // Return an empty string for any kind of "non-content" node
  if (SEARCH_SKIP_TYPES.has(type)) {
    return '';
  }

  // If we are excluding code blocks then return an empty string for them
  if (type === 'code' && !codeblocks) {
    return '';
  }

  if (type === 'break') {
    return '\n';
  }

  // If we are text or inline code then just return that nodes value, for example `**test**` becomes `test`
  if (type === 'text' || type === 'inlineCode') {
    return node.value;
  }
  // multiline code blocks are prefixed and suffixed with newlines
  if (type === 'code') {
    return `\n${node.value}\n`;
  }

  let result = '';
  if ('children' in node) {
    for (const child of node.children) {
      result += extractSearchText(child as Nodes, codeblocks);
    }
  }

  // Add a new line for any element thats like a block of something, such as a heading or paragraph
  if (SEARCH_BLOCK_TYPES.has(type)) {
    result += '\n';
  }

  // table cells are separated by tabs instead of `|`
  if (type === 'tableCell') {
    result += '\t';
  }

  // \t\n replace so we don't have trailing whitespace on table rows that aren't at the end of the text
  return result.replaceAll('\t\n', '\n');
}

/**
 * Walk the AST to build plain text search content. Tracks charIndex positions
 * for each TOC heading so the search UI can link results to the right section.
 */
function buildSearchContent(
  tree: Root,
  rawToc: Array<{ id: string; text: string; depth: number }>,
  codeblocks: boolean,
): { content: string; toc: Header[] } {
  const parts: string[] = [];
  const headingCharIndexes: number[] = [];
  let tocIndex = 0;
  let contentLength = 0;

  for (const node of tree.children) {
    if (node.type === 'heading' && node.depth === 1) {
      continue;
    }

    const text = extractSearchText(node, codeblocks).trim();
    if (!text) {
      continue;
    }

    if (parts.length > 0) {
      contentLength += 2; // \n\n separator, account for it before we do heading nodes!
    }

    // parseToc collects h2-h4 in document order, so we can match them by index
    if (node.type === 'heading' && node.depth >= 2 && node.depth < 5) {
      if (tocIndex < rawToc.length) {
        headingCharIndexes.push(contentLength);
        tocIndex++;
      }
    }

    contentLength += text.length;
    parts.push(text);
  }

  return {
    content: parts.join('\n\n'),
    toc: rawToc.map((item, index) => ({
      ...item,
      charIndex:
        index < headingCharIndexes.length ? headingCharIndexes[index] : -1,
    })),
  };
}

/**
 * Node types to skip when extracting description
 * Similar to Docusaurus createExcerpt strategy
 */
const SKIP_NODE_TYPES = new Set([
  'code', // Skip code blocks
  'html', // Skip HTML
  'mdxjsEsm', // Skip import/export
  'mdxFlowExpression', // Skip JSX expressions
  'thematicBreak', // Skip ---
  'image', // Skip images
  'table', // Skip tables
]);

/**
 * Regex to match the start of a container directive (:::tip, :::info, etc.)
 * Aligned with REGEX_BEGIN in containerSyntax.ts
 */
const CONTAINER_DIRECTIVE_REGEX = /^\s*:::\s*(\w+)\s*(.*)?/;

/**
 * Regex to match a closing container directive marker (:::)
 */
const CONTAINER_DIRECTIVE_END_REGEX = /^\s*:::\s*$/;

/**
 * Remove container directive blocks (:::tip ... :::) from text.
 * Handles directives that span multiple lines, including cases where
 * remark-parse splits them across multiple AST nodes (with blank lines).
 * If a directive is never closed, only the opening line is stripped
 * to avoid silently dropping content.
 */
function stripContainerDirectives(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let directiveStartIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (
      directiveStartIndex === -1 &&
      CONTAINER_DIRECTIVE_REGEX.test(lines[i])
    ) {
      directiveStartIndex = i;
      continue;
    }
    if (directiveStartIndex !== -1) {
      if (CONTAINER_DIRECTIVE_END_REGEX.test(lines[i])) {
        directiveStartIndex = -1;
      }
      continue;
    }
    result.push(lines[i]);
  }
  // If directive was never closed, only strip the opening :::directive line
  // and keep all subsequent content to avoid dropping text.
  if (directiveStartIndex !== -1) {
    result.push(...lines.slice(directiveStartIndex + 1));
  }
  return result.join('\n');
}

/**
 * Extract description from all text content between h1 and h2
 * Collects text from paragraph and list nodes after h1 and before any h2 heading
 * Skips code blocks, HTML, imports, tables following Docusaurus createExcerpt strategy
 * Also strips container directive blocks (:::tip, :::info, etc.)
 */
function extractDescription(tree: Root): string {
  const textParts: string[] = [];
  let foundH1 = false;

  for (const node of tree.children) {
    // Skip until we find h1
    if (node.type === 'heading' && node.depth === 1) {
      foundH1 = true;
      continue;
    }
    // If we encounter an h2, stop collecting
    if (node.type === 'heading' && node.depth === 2) {
      break;
    }
    // Skip non-content nodes (code blocks, HTML, imports, etc.)
    if (SKIP_NODE_TYPES.has(node.type)) {
      continue;
    }
    // Collect text from content nodes after h1
    if (foundH1) {
      const text = extractTextFromNode(node).trim();
      if (text) {
        textParts.push(text);
      }
    }
  }

  // Strip container directives from the concatenated text.
  // This is done after collecting all text because remark-parse may split
  // directives with blank lines into multiple sibling AST nodes (e.g.,
  // ":::tip", "content", ":::" become three separate paragraph nodes).
  const joined = textParts.join('\n');
  return stripContainerDirectives(joined)
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .join(' ');
}

async function getPageIndexInfoByRoute(
  route: RouteMeta,
  options: ExtractPageDataOptions,
): Promise<PageIndexInfo> {
  const {
    alias,
    replaceRules,
    root,
    searchCodeBlocks,
    extractDescription: extractDescriptionConfig = true,
    searchEnabled = true,
  } = options;
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

  // Use cached processor based on searchCodeBlocks config
  const processor = searchCodeBlocks ? processorWithCode : processorWithoutCode;

  // Parse markdown to AST
  const tree = processor.parse(content);

  // Extract title and TOC from AST (read-only, before plugins modify tree)
  const { title, toc: rawToc } = parseToc(tree);

  // Extract description from first paragraph before h2 (if not in frontmatter)
  const extractedDescription =
    frontmatter.description || !extractDescriptionConfig
      ? ''
      : extractDescription(tree);

  // Skip search index content generation when search is disabled
  if (!searchEnabled) {
    return {
      ...defaultIndexInfo,
      title: frontmatter.title || title,
      toc: rawToc.map(item => ({ ...item, charIndex: -1 })),
      content: '',
      description: frontmatter.description || extractedDescription || undefined,
      _flattenContent: flattenContent,
      frontmatter: {
        ...frontmatter,
        __content: undefined,
      },
    } satisfies PageIndexInfo;
  }

  // Run plugins and stringify to markdown for search content
  const processedTree = await processor.run(tree);

  // Walk the AST to extract plain text content and compute heading positions
  const { content: processedContent, toc } = buildSearchContent(
    processedTree as Root,
    rawToc,
    searchCodeBlocks,
  );

  return {
    ...defaultIndexInfo,
    title: frontmatter.title || title,
    toc,
    // processed markdown content for search index
    content: processedContent,
    description: frontmatter.description || extractedDescription || undefined,
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
    routeService.getRoutes().map(async routeMeta => {
      const pageIndexInfo = await getPageIndexInfoByRoute(routeMeta, options);
      // Store pageIndexInfo in RoutePage for llmsTxt to access
      const routePage = routeService.getRoutePageByRoutePath(
        routeMeta.routePath,
      );
      if (routePage) {
        routePage.setPageIndexInfo(pageIndexInfo);
      }
      return pageIndexInfo;
    }),
  );
  return pageData;
}

export type { ExtractPageDataOptions };
export { extractPageData, getPageIndexInfoByRoute };
