import { describe, expect, test } from '@rstest/core';
import {
  createCurrentPageTool,
  createListPagesTool,
  createNavigateTool,
  createPageTool,
  createSearchTool,
  createSiteInfoTool,
  CURRENT_PAGE_INPUT_SCHEMA,
  EMPTY_INPUT_SCHEMA,
  LIST_PAGES_INPUT_SCHEMA,
  NAVIGATE_INPUT_SCHEMA,
  READ_ONLY_UNTRUSTED_ANNOTATIONS,
  resolveInternalRoute,
  SEARCH_INPUT_SCHEMA,
} from '../src/runtime/builtins';

const pages = [
  {
    title: 'WebMCP home',
    description: 'Home description',
    routePath: '/',
    lang: 'en',
    version: 'v1',
    frontmatter: {},
    toc: [{ id: 'introduction', text: 'Introduction', depth: 2, charIndex: 0 }],
  },
  {
    title: 'Tool guide',
    routePath: '/guide',
    lang: 'en',
    version: 'v1',
    frontmatter: { sidebar: true },
    toc: [
      { id: 'register-tools', text: 'Register tools', depth: 2, charIndex: 0 },
    ],
  },
  {
    title: '中文主页',
    routePath: '/zh/',
    lang: 'zh',
    version: 'v1',
    frontmatter: {},
    toc: [],
  },
];

describe('WebMCP built-in tools', () => {
  test('returns structured site information', async () => {
    const info = {
      title: 'Rspress',
      description: 'Static site generator',
      base: '/',
      siteOrigin: 'https://rspress.dev',
      lang: 'en',
      version: 'v1',
      locales: [{ lang: 'en', label: 'English' }],
      versions: ['v1', 'v2'],
      defaultVersion: 'v1',
      nav: [{ text: 'Guide', link: '/guide' }],
      sidebar: [{ text: 'Introduction', link: '/' }],
    };
    const tool = createSiteInfoTool(info);
    expect(tool.execute({})).toEqual(info);
    expect(() => tool.execute(null as never)).toThrow('expected object');
    expect(() => tool.execute({ unexpected: true })).toThrow(
      'Unrecognized key',
    );
    expect(() => tool.execute({ toString: true })).toThrow('Unrecognized key');
    expect(tool.inputSchema).toBe(EMPTY_INPUT_SCHEMA);
    expect(tool.annotations).toBe(READ_ONLY_UNTRUSTED_ANNOTATIONS);
  });

  test('filters and paginates page metadata', async () => {
    const tool = createListPagesTool(pages, { lang: 'en', version: 'v1' });
    expect(tool.execute({ query: 'register tools' })).toEqual({
      pages: [
        expect.objectContaining({ title: 'Tool guide', routePath: '/guide' }),
      ],
      total: 1,
      offset: 0,
      limit: 50,
    });
    expect(tool.execute({ limit: 1, offset: 1 })).toMatchObject({
      pages: [expect.objectContaining({ title: 'Tool guide' })],
      total: 2,
      offset: 1,
      limit: 1,
    });
    expect(tool.execute({ lang: 'zh' })).toMatchObject({
      pages: [expect.objectContaining({ title: '中文主页' })],
      total: 1,
    });
    expect(() => tool.execute({ query: '' })).toThrow('>=1 characters');
    expect(() => tool.execute({ limit: 101 })).toThrow('<=100');
    expect(() => tool.execute({ offset: -1 })).toThrow('>=0');
    expect(() => tool.execute({ unexpected: true } as never)).toThrow(
      'Unrecognized key',
    );
    expect(tool.inputSchema).toBe(LIST_PAGES_INPUT_SCHEMA);
    expect(tool.annotations).toBe(READ_ONLY_UNTRUSTED_ANNOTATIONS);
  });

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

    await expect(tool.execute({ unexpected: true })).rejects.toThrow(
      'Unrecognized key',
    );
    expect(fetchCount).toBe(0);

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

  test('reads a known page without navigation and caches Markdown', async () => {
    let fetchCount = 0;
    const resolvePath = (pathname: string) =>
      pathname.replace(/\.html$/, '') === '/guide' ? '/guide' : undefined;
    const tool = createPageTool(
      pages,
      resolvePath,
      'https://rspress.dev',
      routePath => `${routePath}.md`,
      async url => {
        fetchCount += 1;
        expect(String(url)).toBe('/guide.md');
        return new Response('# Tool guide');
      },
    );
    const [first, second] = await Promise.all([
      tool.execute({ routePath: '/guide.html?source=mcp#tools' }),
      tool.execute({ routePath: '/guide' }),
    ]);
    expect(first).toMatchObject({
      title: 'Tool guide',
      routePath: '/guide',
      markdown: '# Tool guide',
    });
    expect(second).toEqual(first);
    expect(first).not.toHaveProperty('description');
    expect(fetchCount).toBe(1);
    expect(tool.inputSchema).toBe(NAVIGATE_INPUT_SCHEMA);
    expect(tool.annotations).toBe(READ_ONLY_UNTRUSTED_ANNOTATIONS);
    await expect(
      tool.execute({ routePath: 'https://example.com/guide' }),
    ).rejects.toThrow('absolute internal path');
    await expect(tool.execute({ routePath: '/missing' })).rejects.toThrow(
      'Unknown internal route',
    );
    await expect(
      tool.execute({ routePath: '/guide', unexpected: true } as never),
    ).rejects.toThrow('Unrecognized key');
  });

  test('retries a failed arbitrary-page Markdown request', async () => {
    let fetchCount = 0;
    const tool = createPageTool(
      pages,
      () => '/guide',
      'https://rspress.dev',
      () => '/guide.md',
      async () => {
        fetchCount += 1;
        return new Response('', { status: 503, statusText: 'Unavailable' });
      },
    );
    await expect(tool.execute({ routePath: '/guide' })).rejects.toThrow(
      '503 Unavailable',
    );
    await expect(tool.execute({ routePath: '/guide' })).rejects.toThrow(
      '503 Unavailable',
    );
    expect(fetchCount).toBe(2);
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
    await expect(tool.execute({ query: '' })).rejects.toThrow('>=1 characters');
    await expect(tool.execute({ query: 'x', limit: 21 })).rejects.toThrow(
      '<=20',
    );
    await expect(
      tool.execute({ query: 'x', unexpected: true } as never),
    ).rejects.toThrow('Unrecognized key');
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
    const pageContext = {
      page: {
        title: 'API',
        description: 'API reference',
        lang: 'en',
        version: 'v1',
      },
      sections: [],
      previousPage: { title: 'Guide', routePath: '/guide' },
      nextPage: null,
    };
    const tool = createNavigateTool(
      resolvePath,
      'https://rspress.dev',
      routePath => {
        target = routePath;
        return pageContext;
      },
    );
    await expect(tool.execute({ routePath: '/api#types' })).resolves.toEqual({
      routePath: '/api/#types',
      ...pageContext,
    });
    await expect(
      tool.execute({ routePath: '/api', unexpected: true } as never),
    ).rejects.toThrow('Unrecognized key');
    expect(target).toBe('/api/#types');
    expect(tool.inputSchema).toBe(NAVIGATE_INPUT_SCHEMA);
    expect(tool.annotations).toEqual({
      readOnlyHint: false,
      untrustedContentHint: true,
    });
  });
});
