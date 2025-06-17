import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { RouteService } from './RouteService';
import { extractPageData, getPageIndexInfoByRoute } from './extractPageData';

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
        domain: 'http://localhost:3000',
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
          "_html": "<h1 id="page-a">Page a<a aria-hidden="true" href="#page-a">#</a></h1>",
          "_relativePath": "a.mdx",
          "content": "#",
          "domain": "http://localhost:3000",
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
          "_html": "<h1 id="page-b">Page b<a aria-hidden="true" href="#page-b">#</a></h1>",
          "_relativePath": "guide/b.mdx",
          "content": "#",
          "domain": "http://localhost:3000",
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
          "_html": "",
          "_relativePath": "guide/c.tsx",
          "content": "",
          "domain": "http://localhost:3000",
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
          "_html": "<h1 id="homepage">homePage<a aria-hidden="true" href="#homepage">#</a></h1>",
          "_relativePath": "index.mdx",
          "content": "#",
          "domain": "http://localhost:3000",
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
        domain: 'http://localhost:3000',
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



      ## h2 in CompComp

      CompComp content \`code\`

      ",
        "_html": "<h1 id="recursive-comp-test">Recursive comp test<a aria-hidden="true" href="#recursive-comp-test">#</a></h1>
      <h2 id="h2-comp">h2 Comp<a aria-hidden="true" href="#h2-comp">#</a></h2>
      <p>Comp content</p>
      <h2 id="h2-in-compcomp">h2 in CompComp<a aria-hidden="true" href="#h2-in-compcomp">#</a></h2>
      <p>CompComp content <code>code</code></p>",
        "_relativePath": "index.mdx",
        "content": "#


      h2 Comp#

      Comp content


      h2 in CompComp#

      CompComp content code",
        "domain": "http://localhost:3000",
        "frontmatter": {
          "__content": undefined,
        },
        "lang": "",
        "routePath": "/",
        "title": "Recursive comp test",
        "toc": [
          {
            "charIndex": 3,
            "depth": 2,
            "id": "h2-comp",
            "text": "h2 Comp",
          },
          {
            "charIndex": 28,
            "depth": 2,
            "id": "h2-in-compcomp",
            "text": "h2 in CompComp",
          },
        ],
        "version": "",
      }
    `);
  });
});
