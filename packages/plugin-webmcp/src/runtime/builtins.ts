import type { NavItem, PageIndexInfo, SidebarData } from '@rspress/core';
import type { WebMcpTool } from './types';

export const READ_ONLY_UNTRUSTED_ANNOTATIONS = {
  readOnlyHint: true,
  untrustedContentHint: true,
} as const;

export const EMPTY_INPUT_SCHEMA = {
  type: 'object',
  properties: {},
  additionalProperties: false,
} as const;

export const CURRENT_PAGE_INPUT_SCHEMA = EMPTY_INPUT_SCHEMA;

export const LIST_PAGES_INPUT_SCHEMA = {
  type: 'object',
  properties: {
    query: { type: 'string', minLength: 1 },
    lang: { type: 'string' },
    version: { type: 'string' },
    limit: { type: 'integer', minimum: 1, maximum: 100 },
    offset: { type: 'integer', minimum: 0 },
  },
  additionalProperties: false,
} as const;

export const SEARCH_INPUT_SCHEMA = {
  type: 'object',
  properties: {
    query: { type: 'string', minLength: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 20 },
  },
  required: ['query'],
  additionalProperties: false,
} as const;

export const NAVIGATE_INPUT_SCHEMA = {
  type: 'object',
  properties: {
    routePath: { type: 'string', minLength: 1 },
  },
  required: ['routePath'],
  additionalProperties: false,
} as const;

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
        if (cache.get(markdownUrl) === request) {
          cache.delete(markdownUrl);
        }
        throw error;
      });
    cache.set(markdownUrl, request);
    return request;
  };
}

function withMarkdown(page: RuntimePageInfo, markdown: string) {
  return {
    title: page.title,
    ...(page.description === undefined
      ? {}
      : { description: page.description }),
    routePath: page.routePath,
    lang: page.lang,
    version: page.version,
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
    execute() {
      return info;
    },
  };
}

type ListPagesInput = {
  query?: string;
  lang?: string;
  version?: string;
  limit?: number;
  offset?: number;
};

function pageSearchText(page: RuntimePageInfo) {
  return [
    page.title,
    page.description,
    page.routePath,
    ...page.toc.flatMap(item =>
      typeof item === 'object' && item && 'text' in item
        ? [String(item.text)]
        : [],
    ),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function pageSummary(page: RuntimePageInfo) {
  return {
    title: page.title,
    ...(page.description === undefined
      ? {}
      : { description: page.description }),
    routePath: page.routePath,
    lang: page.lang,
    version: page.version,
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
    execute(input = {}) {
      const { query, lang = active.lang, version = active.version } = input;
      const limit = input.limit ?? 50;
      const offset = input.offset ?? 0;
      if (query !== undefined && (typeof query !== 'string' || !query.trim())) {
        throw new TypeError('query must be a non-empty string');
      }
      if (typeof lang !== 'string' || typeof version !== 'string') {
        throw new TypeError('lang and version must be strings');
      }
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new TypeError('limit must be an integer between 1 and 100');
      }
      if (!Number.isInteger(offset) || offset < 0) {
        throw new TypeError('offset must be a non-negative integer');
      }

      const terms = query?.trim().toLowerCase().split(/\s+/) ?? [];
      const matches = pages.filter(page => {
        if (page.lang !== lang || page.version !== version) {
          return false;
        }
        const searchText = pageSearchText(page);
        return terms.every(term => searchText.includes(term));
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
    async execute() {
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
    async execute(input) {
      if (typeof input?.routePath !== 'string') {
        throw new TypeError('routePath must be a string');
      }
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
    async execute(input) {
      if (typeof input?.query !== 'string' || input.query.trim() === '') {
        throw new TypeError('query must be a non-empty string');
      }
      if (
        input.limit !== undefined &&
        (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > 20)
      ) {
        throw new TypeError('limit must be an integer between 1 and 20');
      }
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
    annotations: { readOnlyHint: false },
    async execute(input) {
      if (typeof input?.routePath !== 'string') {
        throw new TypeError('routePath must be a string');
      }
      const target = resolveInternalRoute(input.routePath, resolvePath, origin);
      const page = await navigate(target);
      return { routePath: target, ...page };
    },
  };
}
