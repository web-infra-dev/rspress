import { normalizeHref, removeTrailingSlash } from '@rspress/shared';
import type { WebMcpOptions } from '@rspress/core/runtime';
import type { PageInfo } from './types';

type Field =
  | { type: 'string'; minLength?: number }
  | { type: 'integer'; minimum: number; maximum?: number };
export const queryField: Field = { type: 'string', minLength: 1 };
export const routePathField: Field = { type: 'string', minLength: 1 };

export function toWebMcpSearchResults(
  groups: { group: string; result: unknown }[],
): { group: string; results: unknown }[] {
  return groups.flatMap(({ group, result }) => {
    try {
      const json = JSON.stringify(result, (_key, value) => {
        if (['function', 'symbol', 'bigint'].includes(typeof value)) {
          throw new TypeError('Search result is not JSON-serializable.');
        }
        return value;
      });
      return json === undefined ? [] : [{ group, results: JSON.parse(json) }];
    } catch {
      // Custom renderers may consume React elements or cyclic, UI-only data.
      return [];
    }
  });
}

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
  context: {
    origin: string;
    resolveRoute(pathname: string): string | undefined;
  },
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

export function metadata(page: PageInfo) {
  return {
    title: page.title,
    description: page.description,
    routePath: page.routePath,
    lang: page.lang,
    version: page.version,
  };
}

export async function readPage(
  page: PageInfo,
  base: string,
  signal?: AbortSignal,
  fetcher: typeof fetch = fetch,
) {
  // Tool paths exclude base even when a route shares its prefix.
  const url = `${removeTrailingSlash(base)}${normalizeHref(page.routePath, false).replace(/\.html$/, '.md')}`;
  const response = await fetcher(url, { signal });
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

export function listPages(
  pages: PageInfo[],
  current: Pick<PageInfo, 'lang' | 'version'>,
  args: Record<string, unknown>,
) {
  const lang = args.lang ?? current.lang;
  const version = args.version ?? current.version;
  const terms =
    (args.query as string | undefined)?.trim().toLowerCase().split(/\s+/) ?? [];
  const matches = pages.filter(page => {
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
    pages: matches
      .slice(offset, offset + limit)
      .map(page => ({ ...metadata(page), toc: page.toc })),
    total: matches.length,
    offset,
    limit,
  };
}

/** Shared validation and defaults for Rspress's built-in tools. */
export function defineTool(
  name: string,
  description: string,
  fields: Record<string, Field>,
  required: string[],
  execute: (args: Record<string, unknown>, signal?: AbortSignal) => unknown,
): WebMcpOptions {
  return {
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
    exposedTo: import.meta.env.WEBMCP_EXPOSED_TO,
    execute: (input, options) =>
      execute(argumentsObject(input, fields, required), options.signal),
  };
}
