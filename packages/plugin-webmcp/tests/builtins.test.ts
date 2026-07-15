import { describe, expect, test } from '@rstest/core';
import {
  createCurrentPageTool,
  createNavigateTool,
  createSearchTool,
  CURRENT_PAGE_INPUT_SCHEMA,
  NAVIGATE_INPUT_SCHEMA,
  READ_ONLY_UNTRUSTED_ANNOTATIONS,
  resolveInternalRoute,
  SEARCH_INPUT_SCHEMA,
} from '../src/runtime/builtins';

describe('WebMCP built-in tools', () => {
  test('fetches the current page Markdown and metadata', async () => {
    let fetchCount = 0;
    const fetcher = async (url: string | URL | Request) => {
      fetchCount += 1;
      expect(String(url)).toBe('/guide.md');
      return new Response('# Guide\n\nMarkdown body.');
    };
    const tool = createCurrentPageTool(
      {
        title: 'Guide',
        description: 'Guide description',
        routePath: '/guide.html',
        lang: 'en',
        version: 'v1',
        frontmatter: { sidebar: true },
        toc: [],
      },
      '/guide.md',
      fetcher,
    );

    const [first, second] = await Promise.all([
      tool.execute({}),
      tool.execute({}),
    ]);
    expect(first).toMatchObject({
      title: 'Guide',
      routePath: '/guide.html',
      markdown: '# Guide\n\nMarkdown body.',
    });
    expect(second).toMatchObject({
      markdown: '# Guide\n\nMarkdown body.',
    });
    expect(fetchCount).toBe(1);
    expect(tool.inputSchema).toBe(CURRENT_PAGE_INPUT_SCHEMA);
    expect(tool.annotations).toBe(READ_ONLY_UNTRUSTED_ANNOTATIONS);
  });

  test('reports Markdown fetch failures', async () => {
    let fetchCount = 0;
    const tool = createCurrentPageTool(
      {
        title: 'Missing',
        routePath: '/missing',
        lang: 'en',
        version: '',
        frontmatter: {},
        toc: [],
      },
      '/missing.md',
      async () => {
        fetchCount += 1;
        return new Response('', { status: 404, statusText: 'Not Found' });
      },
    );
    await expect(tool.execute({})).rejects.toThrow(
      'Failed to fetch Markdown for /missing: 404 Not Found',
    );
    await expect(tool.execute({})).rejects.toThrow(
      'Failed to fetch Markdown for /missing: 404 Not Found',
    );
    expect(fetchCount).toBe(2);
  });

  test('rejects the development server HTML fallback', async () => {
    const tool = createCurrentPageTool(
      {
        title: 'Home',
        routePath: '/',
        lang: 'en',
        version: '',
        frontmatter: {},
        toc: [],
      },
      '/index.md',
      async () =>
        new Response('<!doctype html><html><body>Rspress</body></html>', {
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }),
    );

    await expect(tool.execute({})).rejects.toThrow(
      'SSG-MD Markdown is unavailable for /',
    );
  });

  test('normalizes local search results and validates inputs', async () => {
    const tool = createSearchTool(async (query, limit) => {
      expect(query).toBe('webmcp');
      expect(limit).toBe(5);
      return [{ group: 'Guide', result: [{ title: 'WebMCP' }] }];
    });
    await expect(tool.execute({ query: 'webmcp', limit: 5 })).resolves.toEqual([
      { group: 'Guide', results: [{ title: 'WebMCP' }] },
    ]);
    await expect(tool.execute({ query: '' })).rejects.toThrow(
      'query must be a non-empty string',
    );
    await expect(tool.execute({ query: 'x', limit: 21 })).rejects.toThrow(
      'limit must be an integer between 1 and 20',
    );
    expect(tool.inputSchema).toBe(SEARCH_INPUT_SCHEMA);
    expect(tool.annotations).toBe(READ_ONLY_UNTRUSTED_ANNOTATIONS);
  });

  test('accepts only known internal routes with query and hash', async () => {
    const resolvePath = (pathname: string) => {
      const normalized = decodeURIComponent(pathname)
        .replace(/\.html$/, '')
        .replace(/\/index$/, '/')
        .replace(/\/$/, '')
        .toLowerCase();
      return new Map([
        ['', '/'],
        ['/guide', '/guide'],
        ['/api', '/api/'],
      ]).get(normalized);
    };
    expect(
      resolveInternalRoute(
        '/guide?tab=tools#register',
        resolvePath,
        'https://rspress.dev',
      ),
    ).toBe('/guide?tab=tools#register');
    expect(
      resolveInternalRoute(
        '/API/index.html?tab=tools#register',
        resolvePath,
        'https://rspress.dev',
      ),
    ).toBe('/api/?tab=tools#register');
    expect(() =>
      resolveInternalRoute('/unknown', resolvePath, 'https://rspress.dev'),
    ).toThrow('Unknown internal route');
    expect(() =>
      resolveInternalRoute(
        'https://evil.example/guide',
        resolvePath,
        'https://rspress.dev',
      ),
    ).toThrow('absolute internal path');
    expect(() =>
      resolveInternalRoute(
        '//evil.example/guide',
        resolvePath,
        'https://rspress.dev',
      ),
    ).toThrow('absolute internal path');

    let target = '';
    const tool = createNavigateTool(
      resolvePath,
      'https://rspress.dev',
      routePath => {
        target = routePath;
      },
    );
    await expect(tool.execute({ routePath: '/api#types' })).resolves.toEqual({
      routePath: '/api/#types',
    });
    expect(target).toBe('/api/#types');
    expect(tool.inputSchema).toBe(NAVIGATE_INPUT_SCHEMA);
    expect(tool.annotations).toEqual({ readOnlyHint: false });
  });
});
