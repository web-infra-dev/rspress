import type { WebMcpTool } from './types';

export const READ_ONLY_UNTRUSTED_ANNOTATIONS = {
  readOnlyHint: true,
  untrustedContentHint: true,
} as const;

export const CURRENT_PAGE_INPUT_SCHEMA = {
  type: 'object',
  properties: {},
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

interface CurrentPageInfo {
  title: string;
  routePath: string;
  description?: string;
  lang: string;
  version: string;
  frontmatter: object;
  toc: unknown[];
}

export function createCurrentPageTool(
  page: CurrentPageInfo,
  markdownUrl: string,
  fetcher: typeof fetch = fetch,
): WebMcpTool {
  let markdownPromise: Promise<string> | undefined;

  const fetchMarkdown = async () => {
    const response = await fetcher(markdownUrl);
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
  };

  return {
    name: 'rspress_get_current_page',
    title: 'Get current documentation page',
    description:
      'Return metadata and generated Markdown for the current Rspress page.',
    inputSchema: CURRENT_PAGE_INPUT_SCHEMA,
    annotations: READ_ONLY_UNTRUSTED_ANNOTATIONS,
    async execute() {
      markdownPromise ??= fetchMarkdown().catch(error => {
        markdownPromise = undefined;
        throw error;
      });
      const markdown = await markdownPromise;
      return {
        title: page.title,
        description: page.description,
        routePath: page.routePath,
        lang: page.lang,
        version: page.version,
        frontmatter: page.frontmatter,
        toc: page.toc,
        markdown,
      };
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
  navigate: (routePath: string) => void | Promise<void>,
): WebMcpTool<{ routePath: string }> {
  return {
    name: 'rspress_navigate',
    title: 'Navigate documentation',
    description: 'Navigate to a known internal Rspress documentation route.',
    inputSchema: NAVIGATE_INPUT_SCHEMA,
    annotations: { readOnlyHint: false },
    async execute(input) {
      if (typeof input?.routePath !== 'string') {
        throw new TypeError('routePath must be a string');
      }
      const target = resolveInternalRoute(input.routePath, resolvePath, origin);
      await navigate(target);
      return { routePath: target };
    },
  };
}
