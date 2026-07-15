import type { NavItem, PageIndexInfo, SidebarData } from '@rspress/core';
import * as z from 'zod';
import type { WebMcpInputSchema, WebMcpTool } from './types';

export const READ_ONLY_UNTRUSTED_ANNOTATIONS = {
  readOnlyHint: true,
  untrustedContentHint: true,
} as const;

const EMPTY_INPUT = z.strictObject({});
const NON_EMPTY_STRING = z.string().min(1).regex(/\S/);
const LIST_PAGES_INPUT = z.strictObject({
  query: NON_EMPTY_STRING.optional(),
  lang: z.string().optional(),
  version: z.string().optional(),
  limit: z.int().min(1).max(100).optional(),
  offset: z.int().min(0).optional(),
});
const SEARCH_INPUT = z.strictObject({
  query: NON_EMPTY_STRING,
  limit: z.int().min(1).max(20).optional(),
});
const NAVIGATE_INPUT = z.strictObject({ routePath: NON_EMPTY_STRING });

const toInputSchema = (schema: z.ZodType): WebMcpInputSchema =>
  z.toJSONSchema(schema) as WebMcpInputSchema;

export const EMPTY_INPUT_SCHEMA = toInputSchema(EMPTY_INPUT);

export const CURRENT_PAGE_INPUT_SCHEMA = EMPTY_INPUT_SCHEMA;

export const LIST_PAGES_INPUT_SCHEMA = toInputSchema(LIST_PAGES_INPUT);
export const SEARCH_INPUT_SCHEMA = toInputSchema(SEARCH_INPUT);
export const NAVIGATE_INPUT_SCHEMA = toInputSchema(NAVIGATE_INPUT);

export type RuntimePageInfo = Pick<
  PageIndexInfo,
  | 'title'
  | 'routePath'
  | 'description'
  | 'lang'
  | 'version'
  | 'frontmatter'
  | 'toc'
>;

export interface SiteInfo {
  title: string;
  description: string;
  base: string;
  siteOrigin: string;
  lang: string;
  version: string;
  locales: { lang: string; label: string }[];
  versions: string[];
  defaultVersion: string;
  nav: NavItem[];
  sidebar: SidebarData;
}

export interface NavigatePageContext {
  page: {
    title: string;
    description?: string;
    lang: string;
    version: string;
  };
  sections: {
    title: string;
    depth: number;
    routePath: string;
  }[];
  previousPage: { title: string; routePath: string } | null;
  nextPage: { title: string; routePath: string } | null;
}

function validateToolInput<T extends z.ZodType>(
  input: unknown,
  schema: T,
): z.infer<T> {
  const value = input === undefined ? {} : input;
  const result = schema.safeParse(value);
  if (!result.success) {
    const issue = result.error.issues[0];
    const location = issue.path.length ? ` at /${issue.path.join('/')}` : '';
    throw new TypeError(
      `Invalid WebMCP tool input${location}: ${issue.message}`,
    );
  }
  return result.data;
}

function createMarkdownLoader(fetcher: typeof fetch) {
  const cache = new Map<string, Promise<string>>();

  return (page: RuntimePageInfo, markdownUrl: string) => {
    const cached = cache.get(markdownUrl);
    if (cached) {
      return cached;
    }

    const request = fetcher(markdownUrl)
      .then(async response => {
        if (!response.ok) {
          throw new Error(
            `Failed to fetch Markdown for ${page.routePath}: ${response.status} ${response.statusText}`,
          );
        }
        const markdown = await response.text();
        const contentType = response.headers.get('content-type');
        if (
          contentType?.toLowerCase().includes('text/html') ||
          /^\s*(?:<!doctype\s+html|<html[\s>])/i.test(markdown)
        ) {
          throw new Error(
            `SSG-MD Markdown is unavailable for ${page.routePath}. Run \`rspress build\` and serve the generated output instead of the development server.`,
          );
        }
        return markdown;
      })
      .catch(error => {
        cache.delete(markdownUrl);
        throw error;
      });
    cache.set(markdownUrl, request);
    return request;
  };
}

function pageMetadata(page: RuntimePageInfo) {
  return {
    title: page.title,
    ...(page.description === undefined
      ? {}
      : { description: page.description }),
    routePath: page.routePath,
    lang: page.lang,
    version: page.version,
  };
}

function withMarkdown(page: RuntimePageInfo, markdown: string) {
  return {
    ...pageMetadata(page),
    frontmatter: page.frontmatter,
    toc: page.toc,
    markdown,
  };
}

export function createSiteInfoTool(info: SiteInfo): WebMcpTool {
  return {
    name: 'rspress_get_site_info',
    title: 'Get documentation site information',
    description:
      'Return Rspress site metadata, locales, versions, navigation, and the active sidebar.',
    inputSchema: EMPTY_INPUT_SCHEMA,
    annotations: READ_ONLY_UNTRUSTED_ANNOTATIONS,
    execute(input) {
      validateToolInput(input, EMPTY_INPUT);
      return info;
    },
  };
}

type ListPagesInput = z.infer<typeof LIST_PAGES_INPUT>;

function pageSearchText(page: RuntimePageInfo) {
  return [
    page.title,
    page.description,
    page.routePath,
    ...page.toc.map(item => item.text),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function pageSummary(page: RuntimePageInfo) {
  return {
    ...pageMetadata(page),
    toc: page.toc,
  };
}

export function createListPagesTool(
  pages: RuntimePageInfo[],
  active: { lang: string; version: string },
): WebMcpTool<ListPagesInput> {
  return {
    name: 'rspress_list_pages',
    title: 'List documentation pages',
    description:
      'List and filter Rspress page metadata for documentation discovery.',
    inputSchema: LIST_PAGES_INPUT_SCHEMA,
    annotations: READ_ONLY_UNTRUSTED_ANNOTATIONS,
    execute(rawInput = {}) {
      const input = validateToolInput(rawInput, LIST_PAGES_INPUT);
      const { query, lang = active.lang, version = active.version } = input;
      const limit = input.limit ?? 50;
      const offset = input.offset ?? 0;
      const terms = query?.trim().toLowerCase().split(/\s+/) ?? [];
      const matches = pages.filter(page => {
        if (page.lang !== lang || page.version !== version) {
          return false;
        }
        return (
          terms.length === 0 ||
          terms.every(term => pageSearchText(page).includes(term))
        );
      });
      return {
        pages: matches.slice(offset, offset + limit).map(pageSummary),
        total: matches.length,
        offset,
        limit,
      };
    },
  };
}

export function createCurrentPageTool(
  page: RuntimePageInfo,
  markdownUrl: string,
  fetcher: typeof fetch = fetch,
): WebMcpTool {
  const loadMarkdown = createMarkdownLoader(fetcher);

  return {
    name: 'rspress_get_current_page',
    title: 'Get current documentation page',
    description:
      'Return metadata and generated Markdown for the current Rspress page.',
    inputSchema: CURRENT_PAGE_INPUT_SCHEMA,
    annotations: READ_ONLY_UNTRUSTED_ANNOTATIONS,
    async execute(input) {
      validateToolInput(input, EMPTY_INPUT);
      return withMarkdown(page, await loadMarkdown(page, markdownUrl));
    },
  };
}

export function createPageTool(
  pages: RuntimePageInfo[],
  resolvePath: (pathname: string) => string | undefined,
  origin: string,
  getMarkdownUrl: (routePath: string) => string,
  fetcher: typeof fetch = fetch,
): WebMcpTool<{ routePath: string }> {
  const loadMarkdown = createMarkdownLoader(fetcher);
  return {
    name: 'rspress_get_page',
    title: 'Get documentation page',
    description:
      'Return metadata and generated Markdown for a known Rspress route without navigating.',
    inputSchema: NAVIGATE_INPUT_SCHEMA,
    annotations: READ_ONLY_UNTRUSTED_ANNOTATIONS,
    async execute(rawInput) {
      const input = validateToolInput(rawInput, NAVIGATE_INPUT);
      const resolvedRoute = resolveInternalRoute(
        input.routePath,
        resolvePath,
        origin,
      );
      const routePath = new URL(resolvedRoute, origin).pathname;
      const page = pages.find(candidate => candidate.routePath === routePath);
      if (!page) {
        throw new TypeError(`Unknown internal route: ${routePath}`);
      }
      return withMarkdown(
        page,
        await loadMarkdown(page, getMarkdownUrl(page.routePath)),
      );
    },
  };
}

export interface SearchGroup {
  group: string;
  result: unknown;
}

export function createSearchTool(
  search: (query: string, limit?: number) => Promise<SearchGroup[]>,
): WebMcpTool<{ query: string; limit?: number }> {
  return {
    name: 'rspress_search_docs',
    title: 'Search documentation',
    description: 'Search the local Rspress documentation index.',
    inputSchema: SEARCH_INPUT_SCHEMA,
    annotations: READ_ONLY_UNTRUSTED_ANNOTATIONS,
    async execute(rawInput) {
      const input = validateToolInput(rawInput, SEARCH_INPUT);
      return (await search(input.query, input.limit)).map(
        ({ group, result }) => ({ group, results: result }),
      );
    },
  };
}

export function resolveInternalRoute(
  routePath: string,
  resolvePath: (pathname: string) => string | undefined,
  origin: string,
): string {
  if (!routePath.startsWith('/') || routePath.startsWith('//')) {
    throw new TypeError('routePath must be an absolute internal path');
  }

  const url = new URL(routePath, origin);
  if (url.origin !== origin) {
    throw new TypeError('routePath must not target an external origin');
  }

  const resolvedPath = resolvePath(url.pathname);
  if (!resolvedPath) {
    throw new TypeError(`Unknown internal route: ${url.pathname}`);
  }
  return `${resolvedPath}${url.search}${url.hash}`;
}

export function createNavigateTool(
  resolvePath: (pathname: string) => string | undefined,
  origin: string,
  navigate: (
    routePath: string,
  ) => NavigatePageContext | Promise<NavigatePageContext>,
): WebMcpTool<{ routePath: string }> {
  return {
    name: 'rspress_navigate',
    title: 'Navigate documentation',
    description:
      'Navigate to a known internal Rspress documentation route and return the rendered page summary, section routes, and adjacent pages.',
    inputSchema: NAVIGATE_INPUT_SCHEMA,
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    async execute(rawInput) {
      const input = validateToolInput(rawInput, NAVIGATE_INPUT);
      const target = resolveInternalRoute(input.routePath, resolvePath, origin);
      const page = await navigate(target);
      return { routePath: target, ...page };
    },
  };
}
