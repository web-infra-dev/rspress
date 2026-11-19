import type { RouteMeta } from '@rspress/shared';
import { describe, expect, it } from '@rstest/core';
import { APP_HTML_MARKER, HEAD_MARKER, META_GENERATOR } from '../constants';
import { renderHtmlTemplate } from './renderHtmlTemplate';

const route: RouteMeta = {
  routePath: '/guide/',
  pureRoutePath: '/guide/',
  absolutePath: '/root/guide/index.md',
  relativePath: 'guide/index.md',
  pageName: 'guide_index',
  lang: '',
  version: '',
};

describe('renderHtmlTemplate', () => {
  it('injects preload links for the current route chunks', async () => {
    const html = await renderHtmlTemplate(
      `<html><head>${META_GENERATOR}${HEAD_MARKER}</head><body>${APP_HTML_MARKER}</body></html>`,
      [],
      route,
      '<main>Guide</main>',
      [],
      {
        assetPrefix: 'https://cdn.example.com/assets/?v=1&',
        isModule: false,
        crossOriginLoading: false,
        assets: {
          '/guide/': ['static/js/route-a1b2c3d4e5f6.123.js'],
          '/other': ['static/js/route-abcdef123456.456.js'],
        },
      },
    );

    expect(html).toContain(
      '<link rel="preload" href="https://cdn.example.com/assets/?v=1&amp;static/js/route-a1b2c3d4e5f6.123.js" as="script">',
    );
    expect(html).not.toContain('route-abcdef123456.456.js');
    expect(html).toContain('<main>Guide</main>');
  });

  it('does not inject a preload link without a matching route asset', async () => {
    const html = await renderHtmlTemplate(
      `<head>${HEAD_MARKER}</head>`,
      [],
      route,
      '',
      [],
      {
        assetPrefix: '/',
        isModule: false,
        crossOriginLoading: false,
        assets: {},
      },
    );

    expect(html).toBe('<head></head>');
  });

  it('keeps replacement patterns in head config as is', async () => {
    const head = `<script>a="$&";b="$'";c="$$"</script>`;
    const html = await renderHtmlTemplate(
      `<head>${HEAD_MARKER}</head>`,
      [head],
      route,
    );

    expect(html).toBe(`<head>${head}</head>`);
  });

  it('resolves an auto asset prefix relative to the route HTML file', async () => {
    const manifest = {
      assetPrefix: 'auto',
      isModule: false,
      crossOriginLoading: false as const,
      assets: {
        '/': ['static/js/route-123456789abc.123.js'],
        '/guide/': ['static/js/route-a1b2c3d4e5f6.456.js'],
      },
    };
    const [rootHtml, nestedHtml] = await Promise.all([
      renderHtmlTemplate(
        `<head>${HEAD_MARKER}</head>`,
        [],
        { ...route, routePath: '/' },
        '',
        [],
        manifest,
      ),
      renderHtmlTemplate(
        `<head>${HEAD_MARKER}</head>`,
        [],
        route,
        '',
        [],
        manifest,
      ),
    ]);

    expect(rootHtml).toContain('href="static/js/route-123456789abc.123.js"');
    expect(nestedHtml).toContain(
      'href="../static/js/route-a1b2c3d4e5f6.456.js"',
    );
  });

  it.each([
    [true, '/', false, 'modulepreload', ''],
    [true, '/', 'anonymous', 'modulepreload', ' crossorigin="anonymous"'],
    [true, 'https://cdn.example.com/', false, 'modulepreload', ''],
    [
      true,
      'https://cdn.example.com/',
      'anonymous',
      'modulepreload',
      ' crossorigin="anonymous"',
    ],
    [
      true,
      'https://cdn.example.com/',
      'use-credentials',
      'modulepreload',
      ' crossorigin="use-credentials"',
    ],
    [false, '/base/', 'anonymous', 'preload', ''],
    [false, 'auto', 'anonymous', 'preload', ''],
    [
      false,
      'https://cdn.example.com/',
      'anonymous',
      'preload',
      ' crossorigin="anonymous"',
    ],
    [
      false,
      '//cdn.example.com/',
      'anonymous',
      'preload',
      ' crossorigin="anonymous"',
    ],
    [
      false,
      '/',
      'use-credentials',
      'preload',
      ' crossorigin="use-credentials"',
    ],
  ] as const)(
    'matches script requests for module=%s prefix=%s crossorigin=%s',
    async (isModule, assetPrefix, crossOriginLoading, rel, crossorigin) => {
      const asset = 'static/js/route-a1b2c3d4e5f6.123.js';
      const html = await renderHtmlTemplate(
        `<head>${HEAD_MARKER}</head>`,
        [],
        route,
        '',
        [],
        {
          assetPrefix,
          isModule,
          crossOriginLoading,
          assets: { '/guide/': [asset] },
        },
      );
      const href =
        assetPrefix === 'auto' ? `../${asset}` : `${assetPrefix}${asset}`;
      const as = isModule ? '' : ' as="script"';
      expect(html).toBe(
        `<head><link rel="${rel}" href="${href}"${as}${crossorigin}></head>`,
      );
    },
  );
});
