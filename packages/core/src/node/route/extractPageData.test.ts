import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { RouteService } from './RouteService';
import { extractPageData } from './extractPageData';

const fixtureBasicDir = join(__dirname, './fixtures/basic');

const absolutize = (relativePath: string) => {
  return join(fixtureBasicDir, `.${relativePath}`);
};

describe('extractPageData', async () => {
  it('basic', async () => {
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
});
