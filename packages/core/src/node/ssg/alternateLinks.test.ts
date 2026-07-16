import type { RouteMeta, UserConfig } from '@rspress/shared';
import { describe, expect, it } from '@rstest/core';
import { HEAD_MARKER } from '../constants';
import { normalizeRoutePath } from '../route/normalizeRoutePath';
import { createAlternateLinksByRoute } from './alternateLinks';
import { renderHtmlTemplate } from './renderHtmlTemplate';

function createRoute(
  routePath: string,
  lang: string,
  pureRoutePath: string = routePath,
  version = '',
): RouteMeta {
  return {
    absolutePath: `/${lang}${routePath}.md`,
    lang,
    pageName: `${lang}-${routePath}`,
    pureRoutePath,
    relativePath: `${lang}${routePath}.md`,
    routePath,
    version,
  };
}

function createNormalizedRoute(relativePath: string): RouteMeta {
  return {
    absolutePath: `/${relativePath}`,
    pageName: relativePath,
    relativePath,
    ...normalizeRoutePath(relativePath, 'en', '', ['en', 'zh'], []),
  };
}

const config: UserConfig = {
  base: '/docs/',
  lang: 'en',
  locales: [
    { lang: 'en', label: 'English' },
    { lang: 'zh', label: '简体中文' },
    { lang: 'ja', label: '日本語' },
  ],
  siteOrigin: 'https://example.com',
};

describe('createAlternateLinksByRoute', () => {
  it('creates reciprocal links only for existing translations', () => {
    const enRoute = createRoute('/guide/getting-started', 'en');
    const zhRoute = createRoute(
      '/zh/guide/getting-started',
      'zh',
      '/guide/getting-started',
    );
    const links = createAlternateLinksByRoute(
      [enRoute, zhRoute, createRoute('/only-english', 'en')],
      config,
    );

    const expected = [
      {
        href: 'https://example.com/docs/guide/getting-started.html',
        hrefLang: 'en',
      },
      {
        href: 'https://example.com/docs/zh/guide/getting-started.html',
        hrefLang: 'zh',
      },
    ];
    expect(links[enRoute.routePath]).toEqual(expected);
    expect(links[zhRoute.routePath]).toEqual(expected);
    expect(links['/only-english']).toBeUndefined();
  });

  it('supports index routes and clean URLs without a site origin', () => {
    const links = createAlternateLinksByRoute(
      [createRoute('/', 'en'), createRoute('/zh/', 'zh', '/')],
      {
        ...config,
        route: { cleanUrls: true },
        siteOrigin: undefined,
      },
    );

    expect(links['/']).toEqual([
      { href: '/docs/', hrefLang: 'en' },
      { href: '/docs/zh/', hrefLang: 'zh' },
    ]);
  });

  it('keeps alternate links within the same version', () => {
    const links = createAlternateLinksByRoute(
      [
        createRoute('/guide/', 'en', '/guide/', 'v1'),
        createRoute('/zh/guide/', 'zh', '/guide/', 'v1'),
        createRoute('/v2/guide/', 'en', '/guide/', 'v2'),
        createRoute('/v2/zh/guide/', 'zh', '/guide/', 'v2'),
      ],
      config,
    );

    const v1Links = [
      { href: 'https://example.com/docs/guide/index.html', hrefLang: 'en' },
      {
        href: 'https://example.com/docs/zh/guide/index.html',
        hrefLang: 'zh',
      },
    ];
    const v2Links = [
      {
        href: 'https://example.com/docs/v2/guide/index.html',
        hrefLang: 'en',
      },
      {
        href: 'https://example.com/docs/v2/zh/guide/index.html',
        hrefLang: 'zh',
      },
    ];
    expect(links['/guide/']).toEqual(v1Links);
    expect(links['/zh/guide/']).toEqual(v1Links);
    expect(links['/v2/guide/']).toEqual(v2Links);
    expect(links['/v2/zh/guide/']).toEqual(v2Links);
  });

  it('keeps content segments that match the default locale', () => {
    const links = createAlternateLinksByRoute(
      [
        createNormalizedRoute('en/en/foo.md'),
        createNormalizedRoute('zh/en/foo.md'),
        createNormalizedRoute('en/foo.md'),
        createNormalizedRoute('zh/foo.md'),
      ],
      config,
    );

    expect(links['/en/foo']?.map(link => link.href)).toEqual([
      'https://example.com/docs/en/foo.html',
      'https://example.com/docs/zh/en/foo.html',
    ]);
    expect(links['/foo']?.map(link => link.href)).toEqual([
      'https://example.com/docs/foo.html',
      'https://example.com/docs/zh/foo.html',
    ]);
  });

  it('injects alternate links into the document head', async () => {
    const route = createRoute('/', 'en');
    const html = await renderHtmlTemplate(
      `<html><head>${HEAD_MARKER}</head><body></body></html>`,
      undefined,
      route,
      '',
      [
        { href: 'https://example.com/docs/index.html', hrefLang: 'en' },
        { href: 'https://example.com/docs/zh/index.html', hrefLang: 'zh' },
      ],
    );

    expect(html).toContain(
      '<link rel="alternate" hreflang="en" href="https://example.com/docs/index.html">',
    );
    expect(html).toContain(
      '<link rel="alternate" hreflang="zh" href="https://example.com/docs/zh/index.html">',
    );
  });
});
