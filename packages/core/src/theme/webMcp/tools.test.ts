import { describe, expect, rs, test } from '@rstest/core';
import { createElement } from 'react';
import {
  defineTool,
  listPages,
  queryField,
  readPage,
  resolveInternalRoute,
  toWebMcpSearchResults,
} from './tools';
import type { PageInfo } from './types';

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

describe('WebMCP tools', () => {
  test('keeps JSON search data and omits unsupported custom groups', () => {
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    const valid = [{ title: 'Guide', link: '/guide' }];
    expect(
      toWebMcpSearchResults([
        { group: 'Local', result: valid },
        { group: 'Custom', result: { answer: 42 } },
        { group: 'Cyclic', result: cyclic },
        { group: 'UI', result: createElement('span', null, 'Result') },
        { group: 'Callback', result: { action: () => {} } },
        { group: 'BigInt', result: 1n },
        { group: 'Empty', result: undefined },
      ]),
    ).toEqual([
      { group: 'Local', results: valid },
      { group: 'Custom', results: { answer: 42 } },
    ]);
  });
  test('filters active locale/version and paginates independently of search', () => {
    const pages = [
      home,
      guide,
      { ...home, lang: 'zh', routePath: '/zh/' },
      { ...home, version: 'v2', routePath: '/v2/' },
    ];
    expect(listPages(pages, home, { limit: 1, offset: 1 })).toMatchObject({
      total: 2,
      pages: [{ title: 'Guide' }],
    });
    expect(listPages(pages, home, { query: 'install' })).toMatchObject({
      total: 1,
    });
    expect(listPages(pages, home, { lang: 'zh' })).toMatchObject({
      total: 1,
      pages: [{ routePath: '/zh/' }],
    });
    expect(listPages(pages, home, { version: 'v2' })).toMatchObject({
      total: 1,
      pages: [{ routePath: '/v2/' }],
    });
  });
  test('reads generated Markdown with the deployment base and cancellation signal', async () => {
    const fetcher = rs.fn().mockResolvedValue(new Response('# Guide'));
    const signal = new AbortController().signal;
    await expect(
      readPage(guide, '/base/', signal, fetcher),
    ).resolves.toMatchObject({ title: 'Guide', markdown: '# Guide' });
    expect(fetcher).toHaveBeenCalledWith('/base/guide.md', { signal });
  });
  test('rejects missing Markdown and HTML fallback responses', async () => {
    await expect(
      readPage(
        home,
        '/',
        undefined,
        rs.fn().mockResolvedValue(new Response('missing', { status: 404 })),
      ),
    ).rejects.toThrow('404');
    await expect(
      readPage(
        home,
        '/',
        undefined,
        rs.fn().mockResolvedValue(new Response('<!doctype html><html></html>')),
      ),
    ).rejects.toThrow('Markdown is unavailable');
  });
  test('preserves query/hash and rejects external, unknown and relative routes', () => {
    const context = {
      origin: 'https://example.com',
      resolveRoute: (path: string) =>
        path === '/guide.html' ? '/guide' : undefined,
    };
    expect(resolveInternalRoute('/guide.html?q=1#install', context)).toBe(
      '/guide?q=1#install',
    );
    for (const path of [
      'https://example.com/guide',
      '//evil.example/',
      '/\\evil.example/',
      'guide',
      '/missing',
    ]) {
      expect(() => resolveInternalRoute(path, context)).toThrow();
    }
  });
  test('validates built-in arguments before execution', () => {
    const execute = rs.fn();
    const tool = defineTool(
      'search_docs',
      'Search docs',
      {
        query: queryField,
        limit: { type: 'integer', minimum: 1, maximum: 20 },
      },
      ['query'],
      execute,
    );
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
      expect(() => tool.execute(input, {})).toThrow();
    }
    expect(execute).not.toHaveBeenCalled();
    const signal = new AbortController().signal;
    tool.execute({ query: 'docs' }, { signal });
    expect(execute).toHaveBeenCalledWith({ query: 'docs' }, signal);
  });
});
