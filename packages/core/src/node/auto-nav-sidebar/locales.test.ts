import path from 'node:path';
import { RouteService } from '../route/RouteService';
import {
  getRoutePathParts,
  normalizeRoutePath,
} from '../route/normalizeRoutePath';
import { processLocales } from './locales';

describe('walk', () => {
  it('basic', async () => {
    const docsDir = path.join(__dirname, './fixtures/docs-locales');
    const mockNormalizeRoutePath = (link: string) => {
      return normalizeRoutePath(
        link,
        '/base',
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
        '/base',
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
    const result = await processLocales(['zh', 'en'], [], docsDir, [
      '.md',
      '.mdx',
      '.tsx',
    ]);
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "nav": {
            "default": [
              {
                "activeMatch": "^/guide/",
                "link": "/base/zh/guide/",
                "text": "Guide",
              },
            ],
          },
          "sidebar": {
            "/base/zh/guide": [
              {
                "_fileKey": "zh/guide/test-dir/index",
                "collapsed": undefined,
                "collapsible": undefined,
                "context": undefined,
                "items": [
                  {
                    "_fileKey": "zh/guide/test-dir/getting-started",
                    "context": undefined,
                    "link": "/base/zh/guide/test-dir/getting-started",
                    "overviewHeaders": undefined,
                    "tag": undefined,
                    "text": "Getting started 页面",
                  },
                ],
                "link": "/base/zh/guide/test-dir/",
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
                    "link": "/base/zh/guide/test-same-name-dir/",
                    "overviewHeaders": undefined,
                    "tag": undefined,
                    "text": "Test same name dir 页面",
                  },
                ],
                "link": "/base/zh/guide/test-same-name-dir",
                "overviewHeaders": undefined,
                "tag": undefined,
                "text": "Test same name dir in file 页面",
              },
              {
                "_fileKey": "zh/guide/a",
                "context": undefined,
                "link": "/base/zh/guide/a",
                "overviewHeaders": undefined,
                "tag": undefined,
                "text": "Page a 页面",
              },
              {
                "_fileKey": "zh/guide/b",
                "context": undefined,
                "link": "/base/zh/guide/b",
                "overviewHeaders": undefined,
                "tag": undefined,
                "text": "Page b 页面",
              },
              {
                "_fileKey": "zh/guide/c",
                "context": undefined,
                "link": "/base/zh/guide/c",
                "overviewHeaders": undefined,
                "tag": undefined,
                "text": "c",
              },
              {
                "context": undefined,
                "link": "/base/zh/guide/test-dir",
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
                "link": "/base/guide/",
                "text": "Guide",
              },
            ],
          },
          "sidebar": {
            "/base/guide": [
              {
                "_fileKey": "en/guide/test-dir/index",
                "collapsed": undefined,
                "collapsible": undefined,
                "context": undefined,
                "items": [
                  {
                    "_fileKey": "en/guide/test-dir/getting-started",
                    "context": undefined,
                    "link": "/base/guide/test-dir/getting-started",
                    "overviewHeaders": undefined,
                    "tag": undefined,
                    "text": "Getting started",
                  },
                ],
                "link": "/base/guide/test-dir/",
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
                    "link": "/base/guide/test-same-name-dir/",
                    "overviewHeaders": undefined,
                    "tag": undefined,
                    "text": "Test same name dir",
                  },
                ],
                "link": "/base/guide/test-same-name-dir",
                "overviewHeaders": undefined,
                "tag": undefined,
                "text": "Test same name dir in file",
              },
              {
                "_fileKey": "en/guide/a",
                "context": undefined,
                "link": "/base/guide/a",
                "overviewHeaders": undefined,
                "tag": undefined,
                "text": "Page a",
              },
              {
                "_fileKey": "en/guide/b",
                "context": undefined,
                "link": "/base/guide/b",
                "overviewHeaders": undefined,
                "tag": undefined,
                "text": "Page b",
              },
              {
                "_fileKey": "en/guide/c",
                "context": undefined,
                "link": "/base/guide/c",
                "overviewHeaders": undefined,
                "tag": undefined,
                "text": "c",
              },
              {
                "context": undefined,
                "link": "/base/guide/test-dir",
                "tag": undefined,
                "text": "My Link",
              },
            ],
          },
        },
      ]
    `);
  });
});
