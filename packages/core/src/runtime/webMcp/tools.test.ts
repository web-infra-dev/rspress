import { describe, expect, rs, test } from '@rstest/core';
import { createTools } from './tools';
import type { PageInfo, ToolContext } from './types';

const home: PageInfo = {
  title: 'Home',
  description: 'Welcome',
  routePath: '/',
  lang: 'en',
  version: 'v1',
  toc: [],
  frontmatter: {},
};
const guide: PageInfo = {
  ...home,
  title: 'Guide',
  routePath: '/guide',
  toc: [{ text: 'Install', id: 'install', depth: 2, charIndex: 0 }],
};

function setup() {
  const context: ToolContext = {
    site: {
      title: 'Docs',
      description: '',
      base: '/base/',
      siteOrigin: '',
      lang: 'en',
      version: 'v1',
      locales: [],
      versions: ['v1', 'v2'],
      defaultVersion: 'v1',
      nav: [],
      sidebar: [],
    },
    page: home,
    pages: [
      home,
      guide,
      { ...home, lang: 'zh', routePath: '/zh/' },
      { ...home, version: 'v2', routePath: '/v2/' },
    ],
    resolveRoute: path =>
      path === '/index.html'
        ? '/'
        : ['/', '/guide', '/zh/', '/v2/'].find(route => route === path),
    origin: 'https://example.com',
    markdownUrl: path => `/base${path === '/' ? '/index' : path}.md`,
    markdown: true,
    fetch: rs.fn().mockResolvedValue(
      new Response('# Guide', {
        headers: { 'content-type': 'text/markdown' },
      }),
    ),
    search: rs.fn().mockResolvedValue([]),
    navigate: rs.fn().mockResolvedValue({ routePath: '/guide' }),
  };
  const execute = (name: string, input: unknown = {}) =>
    createTools(() => context)
      .find(tool => tool.name === `rspress_${name}`)!
      .execute(input);
  return { context, execute };
}

describe('WebMCP tools', () => {
  test('registers six tools and only omits unavailable capabilities', () => {
    const { context } = setup();
    expect(createTools(() => context)).toHaveLength(6);
    context.search = undefined;
    expect(createTools(() => context).map(tool => tool.name)).not.toContain(
      'rspress_search_docs',
    );
    context.markdown = false;
    expect(createTools(() => context)).toHaveLength(3);
  });
  test('lists pages without search, filters active locale/version and paginates', () => {
    const { context, execute } = setup();
    context.search = undefined;
    expect(execute('list_pages', { limit: 1, offset: 1 })).toMatchObject({
      total: 2,
      pages: [{ title: 'Guide' }],
    });
    expect(execute('list_pages', { query: 'install' })).toMatchObject({
      total: 1,
    });
    expect(execute('list_pages', { lang: 'zh' })).toMatchObject({
      total: 1,
      pages: [{ routePath: '/zh/' }],
    });
    expect(execute('list_pages', { version: 'v2' })).toMatchObject({
      total: 1,
      pages: [{ routePath: '/v2/' }],
    });
  });
  test('reads generated Markdown without navigation and uses the latest current page', async () => {
    const { context, execute } = setup();
    await expect(
      execute('get_page', { routePath: '/guide?q=1#install' }),
    ).resolves.toMatchObject({ title: 'Guide', markdown: '# Guide' });
    expect(context.fetch).toHaveBeenCalledWith('/base/guide.md', {
      signal: undefined,
    });
    expect(context.navigate).not.toHaveBeenCalled();
    context.page = guide;
    context.fetch = rs.fn().mockResolvedValue(new Response('# Updated'));
    await expect(execute('get_current_page')).resolves.toMatchObject({
      title: 'Guide',
      markdown: '# Updated',
    });
  });
  test('rejects missing Markdown and HTML fallback responses', async () => {
    const { context, execute } = setup();
    context.fetch = rs
      .fn()
      .mockResolvedValue(new Response('missing', { status: 404 }));
    await expect(execute('get_current_page')).rejects.toThrow('404');
    context.fetch = rs
      .fn()
      .mockResolvedValue(new Response('<!doctype html><html></html>'));
    await expect(execute('get_current_page')).rejects.toThrow(
      'Markdown is unavailable',
    );
  });
  test('preserves query/hash and rejects external, unknown and relative routes', async () => {
    const { context, execute } = setup();
    await execute('navigate', { routePath: '/guide?q=1#install' });
    expect(context.navigate).toHaveBeenCalledWith(
      '/guide?q=1#install',
      undefined,
    );
    for (const routePath of [
      'https://example.com/guide',
      '//evil.example/',
      '/\\evil.example/',
      'guide',
      '/missing',
    ]) {
      expect(() => execute('navigate', { routePath })).toThrow();
      expect(() => execute('get_page', { routePath })).toThrow();
    }
  });
  test('validates input at execution time', () => {
    const { execute } = setup();
    for (const input of [
      null,
      [],
      'query',
      { query: '' },
      { query: '  ' },
      { query: 'docs', limit: 0 },
      { query: 'docs', limit: 21 },
      { query: 'docs', limit: 1.5 },
      { query: 'docs', extra: true },
    ]) {
      expect(() => execute('search_docs', input)).toThrow();
    }
    expect(() => execute('get_site_info', { extra: true })).toThrow();
    expect(() => execute('list_pages', { offset: -1 })).toThrow();
  });
});
