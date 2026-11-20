import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { PageIndexInfo, UserConfig } from '@rspress/core';
import { describe, expect, test } from '@rstest/core';
import { generateFeedItem } from '../src/createFeed';
import { getOutputInfo } from '../src/options';
import { pluginRss } from '../src/plugin-rss';

function createPage(
  frontmatter: PageIndexInfo['frontmatter'] = {},
): PageIndexInfo {
  return {
    routePath: '/blog/hello/',
    title: 'Hello',
    toc: [],
    content: 'Hello world',
    frontmatter: { date: '2026-01-01', ...frontmatter },
    lang: 'en',
    version: '',
    _filepath: '',
    _relativePath: '',
  };
}

describe('plugin-rss URLs', () => {
  test.each([
    [
      'https://cdn.example.com/feeds/',
      'https://cdn.example.com/feeds/rss/blog.xml',
    ],
    ['/feeds/', '/feeds/rss/blog.xml'],
    ['feeds/', 'feeds/rss/blog.xml'],
    ['../feeds/', '../feeds/rss/blog.xml'],
    ['../_/', '../_/rss/blog.xml'],
    ['feeds//v1/', 'feeds//v1/rss/blog.xml'],
    ['//cdn.example.com/feeds/', '//cdn.example.com/feeds/rss/blog.xml'],
  ])('should preserve publicPath %s', (publicPath, expected) => {
    const output = getOutputInfo(
      { id: 'blog', output: { publicPath } },
      { siteUrl: 'https://example.com/docs/' },
    );

    expect(output.url).toBe(expected);
  });

  test.each([
    ['/', '/blog/hello/'],
    ['/docs/', '/docs/blog/hello/'],
    ['https://example.com/docs/', 'https://example.com/docs/blog/hello/'],
  ])('should resolve article links against %s', (siteUrl, expected) => {
    expect(generateFeedItem(createPage(), siteUrl).link).toBe(expected);
  });

  test.each(['/', 'https://example.com/docs/'])(
    'should preserve external permalinks with siteUrl %s',
    siteUrl => {
      const permalink = 'https://other.example.com/article?source=rss#intro';
      expect(generateFeedItem(createPage({ permalink }), siteUrl).link).toBe(
        permalink,
      );
    },
  );

  test('should encode Unicode paths without losing queries or fragments', () => {
    const page = createPage({ permalink: '/blog/你好?source=rss#intro' });
    expect(generateFeedItem(page, 'https://example.com/docs/').link).toBe(
      'https://example.com/docs/blog/%E4%BD%A0%E5%A5%BD?source=rss#intro',
    );
  });

  test.each([
    {
      config: {},
      siteUrl: undefined,
      icon: 'favicon.ico',
      expectedBase: '/',
      expectedIcon: '/favicon.ico',
    },
    {
      config: { base: '/docs/' },
      siteUrl: undefined,
      icon: 'favicon.ico',
      expectedBase: '/docs/',
      expectedIcon: '/docs/favicon.ico',
    },
    {
      config: { siteOrigin: 'https://example.com', base: '/docs/' },
      siteUrl: undefined,
      icon: '/favicon.ico',
      expectedBase: 'https://example.com/docs/',
      expectedIcon: 'https://example.com/favicon.ico',
    },
    {
      config: { base: '/docs/' },
      siteUrl: 'https://example.com/custom',
      icon: 'https://cdn.example.com/favicon.ico',
      expectedBase: 'https://example.com/custom/',
      expectedIcon: 'https://cdn.example.com/favicon.ico',
    },
    {
      config: { base: '/docs/' },
      siteUrl: undefined,
      icon: 'data:image/png;base64,AA==',
      expectedBase: '/docs/',
      expectedIcon: 'data:image/png;base64,AA==',
    },
  ])(
    'should generate feed URLs under $expectedBase with icon $icon',
    async ({ config, siteUrl, icon, expectedBase, expectedIcon }) => {
      const outDir = await mkdtemp(path.join(tmpdir(), 'rspress-rss-urls-'));
      try {
        const userConfig: UserConfig = { ...config, icon, outDir };
        let favicon: string | undefined;
        const plugin = pluginRss({
          siteUrl,
          output: {
            type: 'json',
            transform(content, { channel }) {
              favicon = channel.favicon;
              return content;
            },
          },
        });
        const page = createPage();

        await plugin.beforeBuild!(userConfig, true);
        await plugin.extendPageData!(page, true);
        await plugin.afterBuild!(userConfig, true);

        expect(page.feeds?.[0].url).toBe(`${expectedBase}rss/blog.json`);
        const feed = JSON.parse(
          await readFile(path.join(outDir, 'rss/blog.json'), 'utf8'),
        );
        expect(feed.home_page_url).toBe(expectedBase);
        expect(favicon).toBe(expectedIcon);
        expect(feed.items[0].url).toBe(`${expectedBase}blog/hello/`);
      } finally {
        await rm(outDir, { recursive: true, force: true });
      }
    },
  );
});
