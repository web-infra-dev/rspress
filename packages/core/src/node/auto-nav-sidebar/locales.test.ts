import path from 'node:path';
import {
  getRoutePathParts,
  normalizeRoutePath,
} from '../route/normalizeRoutePath';
import { RouteService } from '../route/RouteService';
import { processLocales } from './locales';

function orderStringSet(input: Set<string>) {
  return Array.from(input).sort().join('\n');
}

describe('walk', () => {
  it('basic', async () => {
    const docsDir = path.join(__dirname, './fixtures/docs-locales');
    const mockNormalizeRoutePath = (link: string) => {
      return normalizeRoutePath(
        link,
        'en',
        '',
        ['zh', 'en'],
        [],
        ['.md', '.mdx', '.tsx'],
      );
    };
    const mockGetRoutePathParts = (link: string) => {
      return getRoutePathParts(
        link,
        'en',
        '',
        ['zh', 'en'],
        ['.md', '.mdx', '.tsx'],
      );
    };
    RouteService.__instance__ = {
      normalizeRoutePath: mockNormalizeRoutePath,
      getRoutePathParts: mockGetRoutePathParts,
    } as RouteService;
    const metaFileSet = new Set<string>();
    const result = await processLocales(
      ['zh', 'en'],
      [],
      docsDir,
      ['.md', '.mdx', '.tsx'],
      metaFileSet,
    );
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "nav": {
            "default": [
              {
                "activeMatch": "^/guide/",
                "link": "/zh/guide/",
                "text": "Guide",
              },
            ],
          },
          "sidebar": {
            "/zh/guide": [
              {
                "_fileKey": "zh/guide/test-dir/index",
                "collapsed": undefined,
                "collapsible": undefined,
                "context": undefined,
                "items": [
                  {
                    "_fileKey": "zh/guide/test-dir/getting-started",
                    "context": undefined,
                    "link": "/zh/guide/test-dir/getting-started",
                    "overviewHeaders": undefined,
                    "tag": undefined,
                    "text": "Getting started 页面",
                  },
                ],
                "link": "/zh/guide/test-dir/",
                "overviewHeaders": undefined,
                "tag": undefined,
                "text": "Test dir 页面",
              },
              {
                "_fileKey": "zh/guide/test-same-name-dir",
                "collapsed": undefined,
                "collapsible": undefined,
                "context": undefined,
                "items": [
                  {
                    "_fileKey": "zh/guide/test-same-name-dir/index",
                    "context": undefined,
                    "link": "/zh/guide/test-same-name-dir/",
                    "overviewHeaders": undefined,
                    "tag": undefined,
                    "text": "Test same name dir 页面",
                  },
                ],
                "link": "/zh/guide/test-same-name-dir",
                "overviewHeaders": undefined,
                "tag": undefined,
                "text": "Test same name dir in file 页面",
              },
              {
                "_fileKey": "zh/guide/a",
                "context": undefined,
                "link": "/zh/guide/a",
                "overviewHeaders": undefined,
                "tag": undefined,
                "text": "Page a 页面",
              },
              {
                "_fileKey": "zh/guide/b",
                "context": undefined,
                "link": "/zh/guide/b",
                "overviewHeaders": undefined,
                "tag": undefined,
                "text": "Page b 页面",
              },
              {
                "_fileKey": "zh/guide/c",
                "context": undefined,
                "link": "/zh/guide/c",
                "overviewHeaders": undefined,
                "tag": undefined,
                "text": "c",
              },
              {
                "context": undefined,
                "link": "/zh/guide/test-dir",
                "tag": undefined,
                "text": "My Link",
              },
            ],
          },
        },
        {
          "nav": {
            "default": [
              {
                "activeMatch": "^/guide/",
                "link": "/guide/",
                "text": "Guide",
              },
            ],
          },
          "sidebar": {
            "/guide": [
              {
                "_fileKey": "en/guide/test-dir/index",
                "collapsed": undefined,
                "collapsible": undefined,
                "context": undefined,
                "items": [
                  {
                    "_fileKey": "en/guide/test-dir/getting-started",
                    "context": undefined,
                    "link": "/guide/test-dir/getting-started",
                    "overviewHeaders": undefined,
                    "tag": undefined,
                    "text": "Getting started",
                  },
                ],
                "link": "/guide/test-dir/",
                "overviewHeaders": undefined,
                "tag": undefined,
                "text": "Test dir",
              },
              {
                "_fileKey": "en/guide/test-same-name-dir",
                "collapsed": undefined,
                "collapsible": undefined,
                "context": undefined,
                "items": [
                  {
                    "_fileKey": "en/guide/test-same-name-dir/index",
                    "context": undefined,
                    "link": "/guide/test-same-name-dir/",
                    "overviewHeaders": undefined,
                    "tag": undefined,
                    "text": "Test same name dir",
                  },
                ],
                "link": "/guide/test-same-name-dir",
                "overviewHeaders": undefined,
                "tag": undefined,
                "text": "Test same name dir in file",
              },
              {
                "_fileKey": "en/guide/a",
                "context": undefined,
                "link": "/guide/a",
                "overviewHeaders": undefined,
                "tag": undefined,
                "text": "Page a",
              },
              {
                "_fileKey": "en/guide/b",
                "context": undefined,
                "link": "/guide/b",
                "overviewHeaders": undefined,
                "tag": undefined,
                "text": "Page b",
              },
              {
                "_fileKey": "en/guide/c",
                "context": undefined,
                "link": "/guide/c",
                "overviewHeaders": undefined,
                "tag": undefined,
                "text": "c",
              },
              {
                "context": undefined,
                "link": "/guide/test-dir",
                "tag": undefined,
                "text": "My Link",
              },
            ],
          },
        },
      ]
    `);
    expect(orderStringSet(metaFileSet)).toMatchInlineSnapshot(`
      "<ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-locales/en/_nav.json
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-locales/en/guide/_meta.json
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-locales/zh/_nav.json
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-locales/zh/guide/_meta.json"
    `);
  });
  it('multiVersion', async () => {
    const docsDir = path.join(__dirname, './fixtures/docs-multi-version');
    const metaFileSet = new Set<string>();
    const result = await processLocales(
      ['zh', 'en'],
      ['v1', 'v2'],
      docsDir,
      ['.md', '.mdx', '.tsx'],
      metaFileSet,
    );
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "nav": {
            "v1": [
              {
                "link": "/guide",
                "text": "指引",
              },
            ],
            "v2": [
              {
                "link": "/guide",
                "text": "指引",
              },
            ],
          },
          "sidebar": {
            "/guide": [
              {
                "_fileKey": "v2/zh/guide/feature",
                "context": undefined,
                "link": "/v2/zh/guide/feature",
                "overviewHeaders": undefined,
                "tag": undefined,
                "text": "功能 V2",
              },
            ],
          },
        },
        {
          "nav": {
            "v1": [
              {
                "link": "/guide",
                "text": "Guide",
              },
            ],
            "v2": [
              {
                "link": "/guide",
                "text": "Guide",
              },
            ],
          },
          "sidebar": {
            "/guide": [
              {
                "_fileKey": "v2/en/guide/feature",
                "context": undefined,
                "link": "/v2/en/guide/feature",
                "overviewHeaders": undefined,
                "tag": undefined,
                "text": "Feature V2",
              },
            ],
          },
        },
      ]
    `);
    expect(orderStringSet(metaFileSet)).toMatchInlineSnapshot(`
      "<ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-multi-version/v1/en/_nav.json
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-multi-version/v1/en/guide/_meta.json
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-multi-version/v1/zh/_nav.json
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-multi-version/v1/zh/guide/_meta.json
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-multi-version/v2/en/_nav.json
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-multi-version/v2/en/guide/_meta.json
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-multi-version/v2/zh/_nav.json
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-multi-version/v2/zh/guide/_meta.json"
    `);
  });
});
