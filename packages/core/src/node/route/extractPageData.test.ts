import { join } from 'node:path';
import { describe, expect, it } from '@rstest/core';
import { extractPageData, getPageIndexInfoByRoute } from './extractPageData';
import type { RouteService } from './RouteService';

describe('extractPageData', async () => {
  it('basic', async () => {
    const fixtureBasicDir = join(__dirname, './fixtures/basic');
    const absolutize = (relativePath: string) => {
      return join(fixtureBasicDir, `.${relativePath}`);
    };
    const pageData = await extractPageData(
      {
        getRoutes: () =>
          Object.values({
            '/a': {
              absolutePath: absolutize('/a.mdx'),
              lang: '',
              pageName: 'a',
              relativePath: 'a.mdx',
              routePath: '/a',
              version: '',
            },
            '/guide/b': {
              absolutePath: absolutize('/guide/b.mdx'),
              lang: '',
              pageName: 'guide_b',
              relativePath: 'guide/b.mdx',
              routePath: '/guide/b',
              version: '',
            },
            '/guide/c': {
              absolutePath: absolutize('/guide/c.tsx'),
              lang: '',
              pageName: 'guide_c',
              relativePath: 'guide/c.tsx',
              routePath: '/guide/c',
              version: '',
            },
            '/': {
              absolutePath: absolutize('/index.mdx'),
              lang: '',
              pageName: 'index',
              relativePath: 'index.mdx',
              routePath: '/',
              version: '',
            },
          }),
      } as RouteService,
      {
        alias: {},
        replaceRules: [],
        root: fixtureBasicDir,
        searchCodeBlocks: false,
      },
    );
    expect(pageData).toMatchInlineSnapshot(`
      [
        {
          "_filepath": "<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx",
          "_flattenContent": "# Page a
      ",
          "_relativePath": "a.mdx",
          "content": "",
          "frontmatter": {
            "__content": undefined,
          },
          "lang": "",
          "routePath": "/a",
          "title": "Page a",
          "toc": [],
          "version": "",
        },
        {
          "_filepath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/b.mdx",
          "_flattenContent": "# Page b
      ",
          "_relativePath": "guide/b.mdx",
          "content": "",
          "frontmatter": {
            "__content": undefined,
          },
          "lang": "",
          "routePath": "/guide/b",
          "title": "Page b",
          "toc": [],
          "version": "",
        },
        {
          "_filepath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/c.tsx",
          "_flattenContent": "",
          "_relativePath": "guide/c.tsx",
          "content": "",
          "frontmatter": {},
          "lang": "",
          "routePath": "/guide/c",
          "title": "",
          "toc": [],
          "version": "",
        },
        {
          "_filepath": "<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx",
          "_flattenContent": "# homePage
      ",
          "_relativePath": "index.mdx",
          "content": "",
          "frontmatter": {
            "__content": undefined,
          },
          "lang": "",
          "routePath": "/",
          "title": "homePage",
          "toc": [],
          "version": "",
        },
      ]
    `);
  });

  it('getPageIndexInfoByRoute - recursive', async () => {
    const fixtureRecursiveDir = join(__dirname, './fixtures/recursive');
    const absolutize = (relativePath: string) => {
      return join(fixtureRecursiveDir, `.${relativePath}`);
    };
    const pageIndexInfo = await getPageIndexInfoByRoute(
      {
        absolutePath: absolutize('/index.mdx'),
        lang: '',
        pageName: 'index',
        relativePath: 'index.mdx',
        routePath: '/',
        version: '',
      },
      {
        alias: {},
        replaceRules: [],
        root: fixtureRecursiveDir,
        searchCodeBlocks: false,
      },
    );
    expect(pageIndexInfo).toMatchInlineSnapshot(`
      {
        "_filepath": "<ROOT>/packages/core/src/node/route/fixtures/recursive/index.mdx",
        "_flattenContent": "# Recursive comp test



      ## h2 Comp

      Comp content



      ## H2 comp in comp

      Comp in Comp content \`code\`


      ",
        "_relativePath": "index.mdx",
        "content": "## h2 Comp

      Comp content

      ## H2 comp in comp

      Comp in Comp content \`code\`
      ",
        "frontmatter": {
          "__content": undefined,
        },
        "lang": "",
        "routePath": "/",
        "title": "Recursive comp test",
        "toc": [
          {
            "charIndex": 0,
            "depth": 2,
            "id": "h2-comp",
            "text": "h2 Comp",
          },
          {
            "charIndex": 26,
            "depth": 2,
            "id": "h2-comp-in-comp",
            "text": "H2 comp in comp",
          },
        ],
        "version": "",
      }
    `);
  });
});
