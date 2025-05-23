import path from 'node:path';
import type { UserConfig } from '@rspress/shared';
import { describe, expect, it } from 'vitest';
import { PluginDriver } from '../PluginDriver';
import { normalizePath } from '../utils';
import { RouteService } from './RouteService';

async function initRouteService(config: UserConfig) {
  const testDir = normalizePath(path.join(__dirname, 'fixtures', 'basic'));
  const routeService = new RouteService(
    testDir,
    config,
    '',
    new PluginDriver(config, false),
  );
  await routeService.init();

  const { routeData } = routeService;

  const routeMeta = routeService.getRoutes();
  const routeCode = routeService.generateRoutesCodeByRouteMeta(
    routeMeta,
    false,
  );

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
        "/a" => {
          "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx",
          "lang": "",
          "pageName": "a",
          "relativePath": "a.mdx",
          "routePath": "/a",
          "version": "",
        },
        "/guide/b" => {
          "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/b.mdx",
          "lang": "",
          "pageName": "guide_b",
          "relativePath": "guide/b.mdx",
          "routePath": "/guide/b",
          "version": "",
        },
        "/guide/d" => {
          "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/d.md",
          "lang": "",
          "pageName": "guide_d",
          "relativePath": "guide/d.md",
          "routePath": "/guide/d",
          "version": "",
        },
        "/" => {
          "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx",
          "lang": "",
          "pageName": "index",
          "relativePath": "index.mdx",
          "routePath": "/",
          "version": "",
        },
      }
    `);

    expect(routeCode).toMatchInlineSnapshot(`
      "
      import React from 'react';
      import { lazyWithPreload } from "react-lazy-with-preload";
      const Route0 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx'))
      const Route1 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/guide/b.mdx'))
      const Route2 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/guide/d.md'))
      const Route3 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx'))
      export const routes = [
      { path: '/a', element: React.createElement(Route0), filePath: 'a.mdx', preload: async () => {
              await Route0.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx");
            }, lang: '', version: '' },
      { path: '/guide/b', element: React.createElement(Route1), filePath: 'guide/b.mdx', preload: async () => {
              await Route1.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/guide/b.mdx");
            }, lang: '', version: '' },
      { path: '/guide/d', element: React.createElement(Route2), filePath: 'guide/d.md', preload: async () => {
              await Route2.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/guide/d.md");
            }, lang: '', version: '' },
      { path: '/', element: React.createElement(Route3), filePath: 'index.mdx', preload: async () => {
              await Route3.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx");
            }, lang: '', version: '' }
      ];
      "
    `);
  });

  it('RouteService with route.extensions', async () => {
    const { routeData, routeCode } = await initRouteService({
      route: {
        extensions: ['.mdx', '.md', '.tsx'],
      },
    });
    expect(routeData).toMatchInlineSnapshot(`
      Map {
        "/a" => {
          "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx",
          "lang": "",
          "pageName": "a",
          "relativePath": "a.mdx",
          "routePath": "/a",
          "version": "",
        },
        "/guide/b" => {
          "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/b.mdx",
          "lang": "",
          "pageName": "guide_b",
          "relativePath": "guide/b.mdx",
          "routePath": "/guide/b",
          "version": "",
        },
        "/guide/c" => {
          "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/c.tsx",
          "lang": "",
          "pageName": "guide_c",
          "relativePath": "guide/c.tsx",
          "routePath": "/guide/c",
          "version": "",
        },
        "/guide/d" => {
          "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/d.md",
          "lang": "",
          "pageName": "guide_d",
          "relativePath": "guide/d.md",
          "routePath": "/guide/d",
          "version": "",
        },
        "/" => {
          "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx",
          "lang": "",
          "pageName": "index",
          "relativePath": "index.mdx",
          "routePath": "/",
          "version": "",
        },
      }
    `);
    expect(routeCode).toMatchInlineSnapshot(`
      "
      import React from 'react';
      import { lazyWithPreload } from "react-lazy-with-preload";
      const Route0 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx'))
      const Route1 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/guide/b.mdx'))
      const Route2 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/guide/c.tsx'))
      const Route3 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/guide/d.md'))
      const Route4 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx'))
      export const routes = [
      { path: '/a', element: React.createElement(Route0), filePath: 'a.mdx', preload: async () => {
              await Route0.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx");
            }, lang: '', version: '' },
      { path: '/guide/b', element: React.createElement(Route1), filePath: 'guide/b.mdx', preload: async () => {
              await Route1.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/guide/b.mdx");
            }, lang: '', version: '' },
      { path: '/guide/c', element: React.createElement(Route2), filePath: 'guide/c.tsx', preload: async () => {
              await Route2.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/guide/c.tsx");
            }, lang: '', version: '' },
      { path: '/guide/d', element: React.createElement(Route3), filePath: 'guide/d.md', preload: async () => {
              await Route3.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/guide/d.md");
            }, lang: '', version: '' },
      { path: '/', element: React.createElement(Route4), filePath: 'index.mdx', preload: async () => {
              await Route4.preload();
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
        "/a" => {
          "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx",
          "lang": "",
          "pageName": "a",
          "relativePath": "a.mdx",
          "routePath": "/a",
          "version": "",
        },
        "/guide/d" => {
          "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/d.md",
          "lang": "",
          "pageName": "guide_d",
          "relativePath": "guide/d.md",
          "routePath": "/guide/d",
          "version": "",
        },
        "/" => {
          "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx",
          "lang": "",
          "pageName": "index",
          "relativePath": "index.mdx",
          "routePath": "/",
          "version": "",
        },
      }
    `);
    expect(routeCode).toMatchInlineSnapshot(`
      "
      import React from 'react';
      import { lazyWithPreload } from "react-lazy-with-preload";
      const Route0 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx'))
      const Route1 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/guide/d.md'))
      const Route2 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx'))
      export const routes = [
      { path: '/a', element: React.createElement(Route0), filePath: 'a.mdx', preload: async () => {
              await Route0.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx");
            }, lang: '', version: '' },
      { path: '/guide/d', element: React.createElement(Route1), filePath: 'guide/d.md', preload: async () => {
              await Route1.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/guide/d.md");
            }, lang: '', version: '' },
      { path: '/', element: React.createElement(Route2), filePath: 'index.mdx', preload: async () => {
              await Route2.preload();
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
        "/a" => {
          "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx",
          "lang": "",
          "pageName": "a",
          "relativePath": "a.mdx",
          "routePath": "/a",
          "version": "",
        },
        "/guide/b" => {
          "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/b.mdx",
          "lang": "",
          "pageName": "guide_b",
          "relativePath": "guide/b.mdx",
          "routePath": "/guide/b",
          "version": "",
        },
        "/guide/d" => {
          "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/d.md",
          "lang": "",
          "pageName": "guide_d",
          "relativePath": "guide/d.md",
          "routePath": "/guide/d",
          "version": "",
        },
        "/" => {
          "absolutePath": "<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx",
          "lang": "",
          "pageName": "index",
          "relativePath": "index.mdx",
          "routePath": "/",
          "version": "",
        },
      }
    `);
    expect(routeCode).toMatchInlineSnapshot(`
      "
      import React from 'react';
      import { lazyWithPreload } from "react-lazy-with-preload";
      const Route0 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx'))
      const Route1 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/guide/b.mdx'))
      const Route2 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/guide/d.md'))
      const Route3 = lazyWithPreload(() => import('<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx'))
      export const routes = [
      { path: '/a', element: React.createElement(Route0), filePath: 'a.mdx', preload: async () => {
              await Route0.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx");
            }, lang: '', version: '' },
      { path: '/guide/b', element: React.createElement(Route1), filePath: 'guide/b.mdx', preload: async () => {
              await Route1.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/guide/b.mdx");
            }, lang: '', version: '' },
      { path: '/guide/d', element: React.createElement(Route2), filePath: 'guide/d.md', preload: async () => {
              await Route2.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/guide/d.md");
            }, lang: '', version: '' },
      { path: '/', element: React.createElement(Route3), filePath: 'index.mdx', preload: async () => {
              await Route3.preload();
              return import("<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx");
            }, lang: '', version: '' }
      ];
      "
    `);
  });
});
