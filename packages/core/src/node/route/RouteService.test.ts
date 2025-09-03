import path from 'node:path';
import type { UserConfig } from '@rspress/shared';
import { describe, expect, it } from 'vitest';
import { RouteService } from './RouteService';

const BASIC_DIR = path.join(__dirname, 'fixtures', 'basic');

async function initRouteService(
  config: UserConfig,
  fixtureDir: string = BASIC_DIR,
) {
  const routeService = await RouteService.create({
    config,
    scanDir: fixtureDir,
    externalPages: [],
  });

  const { routeData } = routeService;
  const routeCode = routeService.generateRoutesCode();

  return {
    routeData,
    routeCode,
  };
}

describe('RouteService', async () => {
  it('basic', async () => {
    const { routeData, routeCode } = await initRouteService({});
    expect(routeData).toMatchInlineSnapshot(`
      Map {
        "/a" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx",
            "lang": "",
            "pageName": "a",
            "relativePath": "a.mdx",
            "routePath": "/a",
            "version": "",
          },
        },
        "/guide/__e" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/__e.mdx",
            "lang": "",
            "pageName": "guide___e",
            "relativePath": "guide/__e.mdx",
            "routePath": "/guide/__e",
            "version": "",
          },
        },
        "/guide/b" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/b.mdx",
            "lang": "",
            "pageName": "guide_b",
            "relativePath": "guide/b.mdx",
            "routePath": "/guide/b",
            "version": "",
          },
        },
        "/guide/c" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/c.tsx",
            "lang": "",
            "pageName": "guide_c",
            "relativePath": "guide/c.tsx",
            "routePath": "/guide/c",
            "version": "",
          },
        },
        "/guide/" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/index.md",
            "lang": "",
            "pageName": "guide_index",
            "relativePath": "guide/index.md",
            "routePath": "/guide/",
            "version": "",
          },
        },
        "/" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx",
            "lang": "",
            "pageName": "index",
            "relativePath": "index.mdx",
            "routePath": "/",
            "version": "",
          },
        },
      }
    `);

    expect(routeCode).toMatchInlineSnapshot(`
      "
      import React from 'react';
      import { lazyWithPreload } from "react-lazy-with-preload";
      const Route0 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx'))
      const Route1 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/guide/__e.mdx'))
      const Route2 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/guide/b.mdx'))
      const Route3 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/guide/c.tsx'))
      const Route4 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/guide/index.md'))
      const Route5 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx'))
      export const routes = [
      { path: '/a', element: React.createElement(Route0), filePath: 'a.mdx', preload: async () => {
              await Route0.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx");
            }, lang: '', version: '' },
      { path: '/guide/__e', element: React.createElement(Route1), filePath: 'guide/__e.mdx', preload: async () => {
              await Route1.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/guide/__e.mdx");
            }, lang: '', version: '' },
      { path: '/guide/b', element: React.createElement(Route2), filePath: 'guide/b.mdx', preload: async () => {
              await Route2.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/guide/b.mdx");
            }, lang: '', version: '' },
      { path: '/guide/c', element: React.createElement(Route3), filePath: 'guide/c.tsx', preload: async () => {
              await Route3.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/guide/c.tsx");
            }, lang: '', version: '' },
      { path: '/guide/', element: React.createElement(Route4), filePath: 'guide/index.md', preload: async () => {
              await Route4.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/guide/index.md");
            }, lang: '', version: '' },
      { path: '/', element: React.createElement(Route5), filePath: 'index.mdx', preload: async () => {
              await Route5.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx");
            }, lang: '', version: '' }
      ];
      "
    `);
  });

  it('RouteService with route.exclude', async () => {
    const { routeData, routeCode } = await initRouteService({
      route: {
        exclude: ['guide/b.mdx'],
      },
    });
    expect(routeData).toMatchInlineSnapshot(`
      Map {
        "/a" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx",
            "lang": "",
            "pageName": "a",
            "relativePath": "a.mdx",
            "routePath": "/a",
            "version": "",
          },
        },
        "/guide/__e" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/__e.mdx",
            "lang": "",
            "pageName": "guide___e",
            "relativePath": "guide/__e.mdx",
            "routePath": "/guide/__e",
            "version": "",
          },
        },
        "/guide/c" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/c.tsx",
            "lang": "",
            "pageName": "guide_c",
            "relativePath": "guide/c.tsx",
            "routePath": "/guide/c",
            "version": "",
          },
        },
        "/guide/" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/index.md",
            "lang": "",
            "pageName": "guide_index",
            "relativePath": "guide/index.md",
            "routePath": "/guide/",
            "version": "",
          },
        },
        "/" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx",
            "lang": "",
            "pageName": "index",
            "relativePath": "index.mdx",
            "routePath": "/",
            "version": "",
          },
        },
      }
    `);
    expect(routeCode).toMatchInlineSnapshot(`
      "
      import React from 'react';
      import { lazyWithPreload } from "react-lazy-with-preload";
      const Route0 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx'))
      const Route1 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/guide/__e.mdx'))
      const Route2 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/guide/c.tsx'))
      const Route3 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/guide/index.md'))
      const Route4 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx'))
      export const routes = [
      { path: '/a', element: React.createElement(Route0), filePath: 'a.mdx', preload: async () => {
              await Route0.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx");
            }, lang: '', version: '' },
      { path: '/guide/__e', element: React.createElement(Route1), filePath: 'guide/__e.mdx', preload: async () => {
              await Route1.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/guide/__e.mdx");
            }, lang: '', version: '' },
      { path: '/guide/c', element: React.createElement(Route2), filePath: 'guide/c.tsx', preload: async () => {
              await Route2.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/guide/c.tsx");
            }, lang: '', version: '' },
      { path: '/guide/', element: React.createElement(Route3), filePath: 'guide/index.md', preload: async () => {
              await Route3.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/guide/index.md");
            }, lang: '', version: '' },
      { path: '/', element: React.createElement(Route4), filePath: 'index.mdx', preload: async () => {
              await Route4.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx");
            }, lang: '', version: '' }
      ];
      "
    `);
  });

  it('RouteService with route.extensions', async () => {
    const { routeData, routeCode } = await initRouteService({
      route: {
        extensions: ['.md', '.mdx'],
      },
    });
    expect(routeData).toMatchInlineSnapshot(`
      Map {
        "/a" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx",
            "lang": "",
            "pageName": "a",
            "relativePath": "a.mdx",
            "routePath": "/a",
            "version": "",
          },
        },
        "/guide/__e" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/__e.mdx",
            "lang": "",
            "pageName": "guide___e",
            "relativePath": "guide/__e.mdx",
            "routePath": "/guide/__e",
            "version": "",
          },
        },
        "/guide/b" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/b.mdx",
            "lang": "",
            "pageName": "guide_b",
            "relativePath": "guide/b.mdx",
            "routePath": "/guide/b",
            "version": "",
          },
        },
        "/guide/" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/index.md",
            "lang": "",
            "pageName": "guide_index",
            "relativePath": "guide/index.md",
            "routePath": "/guide/",
            "version": "",
          },
        },
        "/" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx",
            "lang": "",
            "pageName": "index",
            "relativePath": "index.mdx",
            "routePath": "/",
            "version": "",
          },
        },
      }
    `);
    expect(routeCode).toMatchInlineSnapshot(`
      "
      import React from 'react';
      import { lazyWithPreload } from "react-lazy-with-preload";
      const Route0 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx'))
      const Route1 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/guide/__e.mdx'))
      const Route2 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/guide/b.mdx'))
      const Route3 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/guide/index.md'))
      const Route4 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx'))
      export const routes = [
      { path: '/a', element: React.createElement(Route0), filePath: 'a.mdx', preload: async () => {
              await Route0.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx");
            }, lang: '', version: '' },
      { path: '/guide/__e', element: React.createElement(Route1), filePath: 'guide/__e.mdx', preload: async () => {
              await Route1.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/guide/__e.mdx");
            }, lang: '', version: '' },
      { path: '/guide/b', element: React.createElement(Route2), filePath: 'guide/b.mdx', preload: async () => {
              await Route2.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/guide/b.mdx");
            }, lang: '', version: '' },
      { path: '/guide/', element: React.createElement(Route3), filePath: 'guide/index.md', preload: async () => {
              await Route3.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/guide/index.md");
            }, lang: '', version: '' },
      { path: '/', element: React.createElement(Route4), filePath: 'index.mdx', preload: async () => {
              await Route4.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx");
            }, lang: '', version: '' }
      ];
      "
    `);
  });
});

describe('RouteService with i18n', async () => {
  it('basic', async () => {
    const BASIC_DIR = path.join(__dirname, 'fixtures', 'locales');

    const { routeData } = await initRouteService(
      {
        lang: 'en',
        themeConfig: {
          locales: [
            {
              lang: 'en',
              label: 'English',
            },
            {
              lang: 'zh',
              label: '中文',
            },
          ],
        },
      },
      BASIC_DIR,
    );
    expect(routeData).toMatchInlineSnapshot(`
      Map {
        "/guide/basic/install" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/locales/en/guide/basic/install.mdx",
            "lang": "en",
            "pageName": "en_guide_basic_install",
            "relativePath": "en/guide/basic/install.mdx",
            "routePath": "/guide/basic/install",
            "version": "",
          },
        },
        "/guide/basic/quick-start" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/locales/en/guide/basic/quick-start.mdx",
            "lang": "en",
            "pageName": "en_guide_basic_quick-start",
            "relativePath": "en/guide/basic/quick-start.mdx",
            "routePath": "/guide/basic/quick-start",
            "version": "",
          },
        },
        "/guide/" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/locales/en/guide/index.mdx",
            "lang": "en",
            "pageName": "en_guide_index",
            "relativePath": "en/guide/index.mdx",
            "routePath": "/guide/",
            "version": "",
          },
        },
        "/" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/locales/en/index.mdx",
            "lang": "en",
            "pageName": "en_index",
            "relativePath": "en/index.mdx",
            "routePath": "/",
            "version": "",
          },
        },
        "/zh/guide/basic/install" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/locales/zh/guide/basic/install.mdx",
            "lang": "zh",
            "pageName": "zh_guide_basic_install",
            "relativePath": "zh/guide/basic/install.mdx",
            "routePath": "/zh/guide/basic/install",
            "version": "",
          },
        },
        "/zh/guide/basic/quick-start" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/locales/zh/guide/basic/quick-start.mdx",
            "lang": "zh",
            "pageName": "zh_guide_basic_quick-start",
            "relativePath": "zh/guide/basic/quick-start.mdx",
            "routePath": "/zh/guide/basic/quick-start",
            "version": "",
          },
        },
        "/zh/guide/" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/locales/zh/guide/index.mdx",
            "lang": "zh",
            "pageName": "zh_guide_index",
            "relativePath": "zh/guide/index.mdx",
            "routePath": "/zh/guide/",
            "version": "",
          },
        },
        "/zh/" => RoutePage {
          "routeMeta": {
            "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/locales/zh/index.mdx",
            "lang": "zh",
            "pageName": "zh_index",
            "relativePath": "zh/index.mdx",
            "routePath": "/zh/",
            "version": "",
          },
        },
      }
    `);
  });
});
