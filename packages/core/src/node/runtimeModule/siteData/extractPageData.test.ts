import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { RouteService } from '../../route/RouteService';
import { extractPageData } from './extractPageData';

const fixtureBasicDir = join(__dirname, '../../route/fixtures/basic');

const absolutize = (relativePath: string) => {
  return join(fixtureBasicDir, `.${relativePath}`);
};

describe('extractPageData', async () => {
  it('basic', async () => {
    const pageData = await extractPageData(
      [],
      {},
      'http://localhost:3000',
      fixtureBasicDir,
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
      false,
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
          "id": 0,
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
          "id": 1,
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
          "id": 2,
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
          "id": 3,
          "lang": "",
          "routePath": "/",
          "title": "homePage",
          "toc": [],
          "version": "",
        },
      ]
    `);
  });
});
