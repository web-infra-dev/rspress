import fs from 'node:fs/promises';
import path from 'node:path';
import { nodeTypes } from '@mdx-js/mdx';
import { compile } from '@rspress/mdx-rs';
import {
  type Header,
  MDX_OR_MD_REGEXP,
  type PageIndexInfo,
  type ReplaceRule,
  type RouteMeta,
  type UserConfig,
} from '@rspress/shared';
import { loadFrontMatter } from '@rspress/shared/node-utils';
import { htmlToText } from 'html-to-text';
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx';
import rehypeStringify from 'rehype-stringify';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import type { Node, Parent } from 'unist';
import { visit } from 'unist-util-visit';
import { importStatementRegex } from '../constants';
import { createMDXOptions } from '../mdx/options';
import type { PluginDriver } from '../PluginDriver';
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
  config?: UserConfig | null;
  pluginDriver?: PluginDriver | null;
  cjkFriendlyEmphasis?: boolean;
  routeService?: RouteService;
}

function cleanupMdxNodes(tree: Node) {
  visit(
    tree,
    ['mdxjsEsm', 'mdxFlowExpression', 'mdxTextExpression'],
    (_node, index, parent) => {
      if (parent && typeof index === 'number' && 'children' in parent) {
        (parent as Parent).children.splice(index, 1);
        return index;
      }
      return undefined;
    },
  );
  visit(
    tree,
    ['mdxJsxTextElement', 'mdxJsxFlowElement'],
    (node: MdxJsxTextElement | MdxJsxFlowElement, index, parent) => {
      if (parent && typeof index === 'number' && 'children' in parent) {
        (parent as Parent).children.splice(index, 1, ...(node.children || []));
        return index;
      }
      return undefined;
    },
  );
}

async function compileWithCjkFriendlyHtml(options: {
  content: string;
  filepath: string;
  docDirectory: string;
  config?: UserConfig | null;
  routeService: RouteService | null;
  pluginDriver?: PluginDriver | null;
}) {
  const {
    content,
    filepath,
    docDirectory,
    config,
    pluginDriver,
    routeService,
  } = options;
  const mdxOptions = await createMDXOptions({
    config,
    docDirectory,
    filepath,
    pluginDriver,
    routeService,
  });

  const processor = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(mdxOptions.remarkPlugins || [])
    .use(() => cleanupMdxNodes);

  processor.data('pageMeta' as any, { toc: [], title: '' });

  processor.use(remarkRehype, {
    allowDangerousHtml: true,
    passThrough: nodeTypes,
  });
  processor.use(mdxOptions.rehypePlugins || []);
  processor.use(rehypeStringify, { allowDangerousHtml: true });

  const vfile = await processor.process({
    value: content,
    path: filepath,
  });

  const pageMeta = processor.data('pageMeta' as any) as {
    toc: Header[];
    title: string;
  };

  return {
    html: String(vfile),
    toc: pageMeta?.toc || [],
    title: pageMeta?.title || '',
  };
}

async function getPageIndexInfoByRoute(
  route: RouteMeta,
  options: ExtractPageDataOptions,
): Promise<PageIndexInfo> {
  const { alias, replaceRules, root, searchCodeBlocks } = options;
  const defaultIndexInfo: PageIndexInfo = {
    title: '',
    content: '',
    _html: '',
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

  const {
    config,
    pluginDriver,
    cjkFriendlyEmphasis = config?.markdown?.cjkFriendlyEmphasis ?? true,
    routeService,
  } = options;

  const shouldUseCjkFriendly = cjkFriendlyEmphasis !== false;

  const {
    html: rawHtml,
    title,
    toc: rawToc,
  } = shouldUseCjkFriendly
    ? await compileWithCjkFriendlyHtml({
        content,
        filepath: route.absolutePath,
        docDirectory: root,
        config,
        routeService: routeService ?? null,
        pluginDriver,
      })
    : await compile({
        value: content,
        filepath: route.absolutePath,
        development: process.env.NODE_ENV !== 'production',
        root,
      });

  /**
   * Escape JSX elements in code block to allow them to be searched
   * @link https://github.com/sindresorhus/escape-goat/blob/eab4a382fcf5c977f7195e20d92ab1b25e6040a7/index.js#L3
   */
  function encodeHtml(html: string): string {
    return html.replace(
      /<code>([\s\S]*?)<\/\s?code>/gm,
      function (_match: string, innerContent: string) {
        return `<code>${innerContent
          .replace(/&/g, '&amp;') // Must happen first or else it will escape other just-escaped characters.
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</code>`;
      },
    );
  }

  const html = encodeHtml(String(rawHtml));
  content = htmlToText(html, {
    // decodeEntities: true, // default value of decodeEntities is `true`, so that htmlToText can decode &lt; &gt;
    wordwrap: 80,
    selectors: [
      {
        selector: 'a',
        options: {
          ignoreHref: true,
        },
      },
      {
        selector: 'a.rp-header-anchor',
        format: 'skip',
      },
      {
        selector: 'img',
        format: 'skip',
      },
      {
        // Skip code blocks
        selector: 'pre > code',
        format: searchCodeBlocks ? 'block' : 'skip',
      },
      ...['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(tag => ({
        selector: tag,
        options: {
          uppercase: false,
        },
      })),
    ],
    tables: true,
    longWordSplit: {
      forceWrapOnLimit: true,
    },
  });
  if (content.startsWith(title)) {
    // Remove the title from the content
    content = content.slice(title.length);
  }

  // rawToc comes from mdx compile and it uses `-number` to unique toc of same id
  // We need to find the character index position of each toc in the content thus benefiting for search engines
  const toc: Header[] = rawToc.map(item => {
    const match = item.id.match(/-(\d+)$/);
    let position = -1;
    if (match) {
      for (let i = 0; i < Number(match[1]); i++) {
        // When text is repeated, the position needs to be determined based on -number
        position = content.indexOf(`\n${item.text}#\n\n`, position + 1);

        // If the positions don't match, it means the text itself may exist -number
        if (position === -1) {
          break;
        }
      }
    }
    const targetWithAnchor = `\n${item.text}#\n\n`;
    const targetWithoutAnchor = `\n${item.text}\n\n`;
    let charIndex = content.indexOf(targetWithAnchor, position + 1);
    if (charIndex === -1) {
      charIndex = content.indexOf(targetWithoutAnchor, position + 1);
    }
    if (charIndex === -1) {
      charIndex = content.indexOf(`#${item.text}`, position + 1);
    }
    return {
      ...item,
      charIndex,
    };
  });

  return {
    ...defaultIndexInfo,
    title: frontmatter.title || title,
    toc,
    // raw txt, for search index
    content,
    _html: html,
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
      return getPageIndexInfoByRoute(routeMeta, {
        ...options,
        routeService,
      });
    }),
  );
  return pageData;
}

export type { ExtractPageDataOptions };
export { extractPageData, getPageIndexInfoByRoute };
