import type { RouteMeta, UserConfig } from '@rspress/shared';
import { describe, expect, it } from '@rstest/core';
import { HEAD_MARKER } from '../constants';
import { createAlternateLinks } from './alternateLinks';
import { renderHtmlTemplate } from './renderHtmlTemplate';

function createRoute(routePath: string, lang: string, version = ''): RouteMeta {
  return {
    absolutePath: `/${lang}${routePath}.md`,
    lang,
    pageName: `${lang}-${routePath}`,
    relativePath: `${lang}${routePath}.md`,
    routePath,
    version,
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

describe('createAlternateLinks', () => {
  it('creates reciprocal links only for existing translations', () => {
    const enRoute = createRoute('/guide/getting-started', 'en');
    const zhRoute = createRoute('/zh/guide/getting-started', 'zh');
    const links = createAlternateLinks(
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
    const links = createAlternateLinks(
      [createRoute('/', 'en'), createRoute('/zh/', 'zh')],
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

  it('does not mix translations from different versions', () => {
    const links = createAlternateLinks(
      [
        createRoute('/guide/', 'en', 'v1'),
        createRoute('/zh/guide/', 'zh', 'v1'),
        createRoute('/v2/guide/', 'en', 'v2'),
        createRoute('/v2/zh/other/', 'zh', 'v2'),
      ],
      config,
    );

    expect(links['/guide/']).toHaveLength(2);
    expect(links['/zh/guide/']).toHaveLength(2);
    expect(links['/v2/guide/']).toBeUndefined();
    expect(links['/v2/zh/other/']).toBeUndefined();
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
