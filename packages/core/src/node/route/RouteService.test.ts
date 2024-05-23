import path from 'path';
import { expect, describe, test } from 'vitest';
import { PluginDriver } from '../PluginDriver';
import { normalizePath } from '../utils';
import { RouteService, normalizeRoutePath } from './RouteService';

describe('RouteService', async () => {
  const testDir = normalizePath(path.join(__dirname, 'fixtures'));
  const routeService = new RouteService(
    testDir,
    {},
    '',
    new PluginDriver({}, false),
  );
  await routeService.init();
  const routeMeta = routeService.getRoutes().map(item => ({
    ...item,
    absolutePath: item.absolutePath.replace(testDir, ''),
  }));
  test('normalizeRoutePath', () => {
    expect(
      normalizeRoutePath(
        '/v1/en/foo/bar',
        '/',
        'en',
        'v1',
        ['zh', 'en'],
        ['v1', 'v2'],
      ),
    ).toEqual({
      lang: 'en',
      version: 'v1',
      routePath: '/foo/bar',
    });
    expect(
      normalizeRoutePath(
        '/v1/zh/foo/bar',
        '/',
        'en',
        'v1',
        ['zh', 'en'],
        ['v1', 'v2'],
      ),
    ).toEqual({
      lang: 'zh',
      version: 'v1',
      routePath: '/zh/foo/bar',
    });
    expect(
      normalizeRoutePath(
        '/v2/en/foo/bar',
        '/',
        'en',
        'v1',
        ['zh', 'en'],
        ['v1', 'v2'],
      ),
    ).toEqual({
      lang: 'en',
      version: 'v2',
      routePath: '/v2/foo/bar',
    });
    expect(
      normalizeRoutePath(
        '/v2/zh/foo/bar',
        '/',
        'en',
        'v1',
        ['zh', 'en'],
        ['v1', 'v2'],
      ),
    ).toEqual({
      lang: 'zh',
      version: 'v2',
      routePath: '/v2/zh/foo/bar',
    });
    expect(
      normalizeRoutePath(
        '/v2/en/api/',
        '/',
        'en',
        'v1',
        ['zh', 'en'],
        ['v1', 'v2'],
      ),
    ).toEqual({
      lang: 'en',
      version: 'v2',
      routePath: '/v2/api/',
    });

    expect(
      normalizeRoutePath(
        '/foo/bar',
        '/',
        'en',
        'v1',
        ['zh', 'en'],
        ['v1', 'v2'],
      ),
    ).toEqual({
      lang: 'en',
      version: 'v1',
      routePath: '/foo/bar',
    });

    expect(
      normalizeRoutePath(
        '/foo/bar/baz.xyz',
        '/',
        'en',
        'v1',
        ['zh', 'en'],
        ['v1', 'v2'],
      ),
    ).toEqual({
      lang: 'en',
      version: 'v1',
      routePath: '/foo/bar/baz.xyz',
    });

    expect(
      normalizeRoutePath(
        '/foo/bar/baz.xyz',
        '/',
        'en',
        'v1',
        ['zh', 'en'],
        ['v1', 'v2'],
        ['xyz'],
      ),
    ).toEqual({
      lang: 'en',
      version: 'v1',
      routePath: '/foo/bar/baz',
    });
  });

  test('Conventional route by file structure', async () => {
    expect(routeMeta).toMatchInlineSnapshot(`
      [
        {
          "absolutePath": "/a.mdx",
          "lang": "",
          "pageName": "a",
          "relativePath": "a.mdx",
          "routePath": "/a",
          "version": "",
        },
        {
          "absolutePath": "/guide/b.mdx",
          "lang": "",
          "pageName": "guide_b",
          "relativePath": "guide/b.mdx",
          "routePath": "/guide/b",
          "version": "",
        },
      ]
    `);
  });

  test('Should generate routes code', () => {
    expect(
      routeService.generateRoutesCodeByRouteMeta(routeMeta, false),
    ).toMatchInlineSnapshot(`
        "
        import React from 'react';
        import { lazyWithPreload } from \\"react-lazy-with-preload\\";
        const Route0 = lazyWithPreload(() => import('/a.mdx'))
        const Route1 = lazyWithPreload(() => import('/guide/b.mdx'))
        export const routes = [
        { path: '/a', element: React.createElement(Route0), filePath: 'a.mdx', preload: async () => {
                await Route0.preload();
                return import(\\"/a.mdx\\");
              }, lang: '', version: '' },
        { path: '/guide/b', element: React.createElement(Route1), filePath: 'guide/b.mdx', preload: async () => {
                await Route1.preload();
                return import(\\"/guide/b.mdx\\");
              }, lang: '', version: '' }
        ];
        "
      `);
  });
});
