import type { RouteMeta } from '@rspress/shared';
import { describe, expect, it } from '@rstest/core';
import { APP_HTML_MARKER, HEAD_MARKER, META_GENERATOR } from '../constants';
import { renderHtmlTemplate } from './renderHtmlTemplate';

const route: RouteMeta = {
  routePath: '/guide/',
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
        assets: {
          '/guide/': ['static/js/rspress-route-guide.123.js'],
          '/other': ['static/js/rspress-route-other.456.js'],
        },
      },
    );

    expect(html).toContain(
      '<link rel="preload" href="https://cdn.example.com/assets/?v=1&amp;static/js/rspress-route-guide.123.js" as="script">',
    );
    expect(html).not.toContain('rspress-route-other.456.js');
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
        assets: {},
      },
    );

    expect(html).toBe('<head></head>');
  });
});
