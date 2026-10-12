import type { PageInfo, Tool, ToolContext } from './types';

type Field =
  | { type: 'string'; minLength?: number }
  | { type: 'integer'; minimum: number; maximum?: number };
const query: Field = { type: 'string', minLength: 1 };
const routePath: Field = { type: 'string', minLength: 1 };

function argumentsObject(
  input: unknown,
  fields: Record<string, Field>,
  required: string[],
) {
  const value = input === undefined ? {} : input;
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Tool arguments must be an object.');
  }
  const args = value as Record<string, unknown>;
  for (const key of Object.keys(args)) {
    if (!Object.hasOwn(fields, key)) {
      throw new TypeError(`Unknown argument: ${key}`);
    }
  }
  for (const [key, field] of Object.entries(fields)) {
    const val = args[key];
    if (val === undefined && !required.includes(key)) continue;
    if (field.type === 'string') {
      if (typeof val !== 'string' || (field.minLength && !val.trim())) {
        throw new TypeError(
          `${key} must be ${field.minLength ? 'a non-empty' : 'a'} string.`,
        );
      }
    } else if (
      typeof val !== 'number' ||
      !Number.isSafeInteger(val) ||
      val < field.minimum ||
      (field.maximum !== undefined && val > field.maximum)
    ) {
      throw new TypeError(
        `${key} must be an integer between ${field.minimum} and ${field.maximum ?? Number.MAX_SAFE_INTEGER}.`,
      );
    }
  }
  return args;
}

export function resolveInternalRoute(
  value: string,
  context: Pick<ToolContext, 'origin' | 'resolveRoute'>,
) {
  if (!value.startsWith('/') || value.startsWith('//')) {
    throw new TypeError('routePath must be an absolute internal path.');
  }
  const url = new URL(value, context.origin);
  if (url.origin !== context.origin)
    throw new TypeError('External routes are not allowed.');
  const path = context.resolveRoute(url.pathname);
  if (!path) throw new TypeError(`Unknown internal route: ${url.pathname}`);
  return `${path}${url.search}${url.hash}`;
}

function metadata(page: PageInfo) {
  return {
    title: page.title,
    description: page.description,
    routePath: page.routePath,
    lang: page.lang,
    version: page.version,
  };
}

async function readPage(
  page: PageInfo,
  context: ToolContext,
  signal?: AbortSignal,
) {
  const response = await context.fetch(context.markdownUrl(page.routePath), {
    signal,
  });
  if (!response.ok)
    throw new Error(
      `Failed to read Markdown for ${page.routePath}: ${response.status}`,
    );
  const markdown = await response.text();
  if (
    response.headers.get('content-type')?.includes('text/html') ||
    /^\s*(?:<!doctype\s+html|<html[\s>])/i.test(markdown)
  ) {
    throw new Error(
      `Markdown is unavailable for ${page.routePath}. Serve the output of rspress build with llms enabled.`,
    );
  }
  return {
    ...metadata(page),
    frontmatter: page.frontmatter,
    toc: page.toc,
    markdown,
  };
}

export function createTools(getContext: () => ToolContext): Tool[] {
  const tool = (
    name: string,
    description: string,
    fields: Record<string, Field>,
    required: string[],
    execute: (
      args: Record<string, unknown>,
      context: ToolContext,
      signal?: AbortSignal,
    ) => unknown,
  ): Tool => ({
    name: `rspress_${name}`,
    description,
    inputSchema: {
      type: 'object',
      properties: fields,
      required,
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: name !== 'navigate',
      untrustedContentHint: true,
    },
    execute(input, options) {
      options?.signal?.throwIfAborted();
      return execute(
        argumentsObject(input, fields, required),
        getContext(),
        options?.signal,
      );
    },
  });
  const tools = [
    tool(
      'get_site_info',
      'Get documentation site metadata, languages, versions, navigation and the active sidebar.',
      {},
      [],
      (_args, ctx) => ctx.site,
    ),
    tool(
      'list_pages',
      'List documentation pages, optionally filtering titles, descriptions and headings. Defaults to the active language and version.',
      {
        query,
        lang: { type: 'string' },
        version: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
        offset: { type: 'integer', minimum: 0 },
      },
      [],
      (args, ctx) => {
        const lang = args.lang ?? ctx.page.lang;
        const version = args.version ?? ctx.page.version;
        const terms =
          (args.query as string | undefined)
            ?.trim()
            .toLowerCase()
            .split(/\s+/) ?? [];
        const pages = ctx.pages.filter(page => {
          const text = [
            page.title,
            page.description,
            page.routePath,
            ...page.toc.map(item => item.text),
          ]
            .join(' ')
            .toLowerCase();
          return (
            page.lang === lang &&
            page.version === version &&
            terms.every(term => text.includes(term))
          );
        });
        const limit = (args.limit as number | undefined) ?? 50;
        const offset = (args.offset as number | undefined) ?? 0;
        return {
          pages: pages
            .slice(offset, offset + limit)
            .map(page => ({ ...metadata(page), toc: page.toc })),
          total: pages.length,
          offset,
          limit,
        };
      },
    ),
    tool(
      'navigate',
      'Navigate to a known internal documentation route and return the rendered page metadata, section routes and adjacent pages. Paths are relative to the site base and may include a query or hash.',
      { routePath },
      ['routePath'],
      (args, ctx, signal) =>
        ctx.navigate(
          resolveInternalRoute(args.routePath as string, ctx),
          signal,
        ),
    ),
  ];
  if (getContext().markdown) {
    tools.push(
      tool(
        'get_page',
        'Read metadata and generated Markdown for a known documentation route without navigating. Paths are relative to the site base.',
        { routePath },
        ['routePath'],
        (args, ctx, signal) => {
          const target = resolveInternalRoute(args.routePath as string, ctx);
          const path = ctx.resolveRoute(new URL(target, ctx.origin).pathname);
          const page = ctx.pages.find(page => page.routePath === path);
          if (!page) throw new TypeError(`Unknown internal route: ${path}`);
          return readPage(page, ctx, signal);
        },
      ),
      tool(
        'get_current_page',
        'Read metadata, frontmatter, table of contents and generated Markdown for the current documentation page.',
        {},
        [],
        (_args, ctx, signal) => readPage(ctx.page, ctx, signal),
      ),
    );
  }
  if (getContext().search) {
    tools.push(
      tool(
        'search_docs',
        'Search the local documentation index for the active language and version.',
        {
          query,
          limit: { type: 'integer', minimum: 1, maximum: 20 },
        },
        ['query'],
        (args, ctx) =>
          ctx.search!(
            args.query as string,
            (args.limit as number | undefined) ?? 10,
          ),
      ),
    );
  }
  return tools;
}
