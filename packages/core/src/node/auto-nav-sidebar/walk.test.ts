import path from 'node:path';
import { DEFAULT_PAGE_EXTENSIONS } from '@rspress/shared/constants';
import { describe, expect, it } from 'vitest';
import {
  getRoutePathParts,
  normalizeRoutePath,
} from '../route/normalizeRoutePath';
import { RouteService } from '../route/RouteService';
import { walk } from './walk';

const mockNormalizeRoutePath = (link: string) => {
  return normalizeRoutePath(link, '', '', [], [], ['.md', '.mdx', '.tsx']);
};

const mockGetRoutePathParts = (link: string) => {
  return getRoutePathParts(link, '', '', [], []);
};

RouteService.__instance__ = {
  normalizeRoutePath: mockNormalizeRoutePath,
  getRoutePathParts: mockGetRoutePathParts,
} as RouteService;

describe('walk', () => {
  it('basic', async () => {
    const docsDir = path.join(__dirname, './fixtures/docs');
    const sidebar = await walk(docsDir, docsDir, DEFAULT_PAGE_EXTENSIONS);
    expect(sidebar).toMatchInlineSnapshot(`
      {
        "nav": [
          {
            "activeMatch": "^/guide/",
            "link": "/guide/",
            "text": "Guide",
          },
        ],
        "sidebar": {
          "/guide": [
            {
              "_fileKey": "guide/test-dir/index",
              "collapsed": undefined,
              "collapsible": undefined,
              "context": undefined,
              "items": [
                {
                  "_fileKey": "guide/test-dir/getting-started",
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
              "_fileKey": "guide/test-same-name-dir",
              "collapsed": undefined,
              "collapsible": undefined,
              "context": undefined,
              "items": [
                {
                  "_fileKey": "guide/test-same-name-dir/index",
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
              "_fileKey": "guide/a",
              "context": undefined,
              "link": "/guide/a",
              "overviewHeaders": undefined,
              "tag": undefined,
              "text": "Page a",
            },
            {
              "_fileKey": "guide/b",
              "context": undefined,
              "link": "/guide/b",
              "overviewHeaders": undefined,
              "tag": undefined,
              "text": "Page b",
            },
            {
              "_fileKey": "guide/c",
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
      }
    `);
  });
  it('both _meta.json and _nav.json do not exist', async () => {
    const docsDir = path.join(__dirname, './fixtures/docs-no-meta');
    const sidebar = await walk(docsDir, docsDir, DEFAULT_PAGE_EXTENSIONS);
    expect(sidebar).toMatchInlineSnapshot(`
      {
        "nav": [],
        "sidebar": {
          "/": [
            {
              "_fileKey": "api/index",
              "collapsed": undefined,
              "collapsible": undefined,
              "context": undefined,
              "items": [
                {
                  "_fileKey": "api/api",
                  "context": undefined,
                  "link": "/api/api",
                  "overviewHeaders": undefined,
                  "tag": undefined,
                  "text": "Api",
                },
                {
                  "_fileKey": "api/guide/index",
                  "collapsed": undefined,
                  "collapsible": undefined,
                  "context": undefined,
                  "items": [
                    {
                      "_fileKey": "api/guide/getting-started",
                      "context": undefined,
                      "link": "/api/guide/getting-started",
                      "overviewHeaders": undefined,
                      "tag": undefined,
                      "text": "Getting started",
                    },
                  ],
                  "link": "/api/guide/",
                  "overviewHeaders": undefined,
                  "tag": undefined,
                  "text": "Guide",
                },
              ],
              "link": "/api/",
              "overviewHeaders": undefined,
              "tag": undefined,
              "text": "No meta",
            },
            {
              "_fileKey": "index",
              "context": undefined,
              "link": "/",
              "overviewHeaders": undefined,
              "tag": undefined,
              "text": "HomePage",
            },
          ],
        },
      }
    `);
  });

  it('both _meta.json and _nav.json exist', async () => {
    const docsDir = path.join(__dirname, './fixtures/docs-meta-nav');
    const sidebar = await walk(docsDir, docsDir, DEFAULT_PAGE_EXTENSIONS);
    expect(sidebar).toMatchInlineSnapshot(`
      {
        "nav": [
          {
            "link": "/api",
            "text": "API",
          },
        ],
        "sidebar": {
          "/": [
            {
              "_fileKey": "index",
              "context": undefined,
              "link": "/",
              "overviewHeaders": undefined,
              "tag": undefined,
              "text": "HomePage",
            },
            {
              "_fileKey": "api/index",
              "collapsed": undefined,
              "collapsible": undefined,
              "context": undefined,
              "items": [
                {
                  "_fileKey": "api/api",
                  "context": undefined,
                  "link": "/api/api",
                  "overviewHeaders": undefined,
                  "tag": undefined,
                  "text": "Api",
                },
                {
                  "_fileKey": "api/guide/index",
                  "collapsed": undefined,
                  "collapsible": undefined,
                  "context": undefined,
                  "items": [
                    {
                      "_fileKey": "api/guide/getting-started",
                      "context": undefined,
                      "link": "/api/guide/getting-started",
                      "overviewHeaders": undefined,
                      "tag": undefined,
                      "text": "Getting started",
                    },
                  ],
                  "link": "/api/guide/",
                  "overviewHeaders": undefined,
                  "tag": undefined,
                  "text": "Guide",
                },
              ],
              "link": "/api/",
              "overviewHeaders": undefined,
              "tag": undefined,
              "text": "No meta",
            },
          ],
          "/api": [
            {
              "_fileKey": "api/api",
              "context": undefined,
              "link": "/api/api",
              "overviewHeaders": undefined,
              "tag": undefined,
              "text": "Api",
            },
            {
              "_fileKey": "api/guide/index",
              "collapsed": undefined,
              "collapsible": undefined,
              "context": undefined,
              "items": [
                {
                  "_fileKey": "api/guide/getting-started",
                  "context": undefined,
                  "link": "/api/guide/getting-started",
                  "overviewHeaders": undefined,
                  "tag": undefined,
                  "text": "Getting started",
                },
              ],
              "link": "/api/guide/",
              "overviewHeaders": undefined,
              "tag": undefined,
              "text": "Guide",
            },
            {
              "_fileKey": "api/index",
              "context": undefined,
              "link": "/api/",
              "overviewHeaders": undefined,
              "tag": undefined,
              "text": "No meta",
            },
          ],
        },
      }
    `);
  });

  it('custom link group', async () => {
    const docsDir = path.join(__dirname, './fixtures/docs-custom-link-group');
    const sidebar = await walk(docsDir, docsDir, DEFAULT_PAGE_EXTENSIONS);
    expect(sidebar).toMatchInlineSnapshot(`
      {
        "nav": [
          {
            "activeMatch": "^/guide/",
            "link": "/guide/",
            "text": "Guide",
          },
        ],
        "sidebar": {
          "/guide": [
            {
              "collapsed": true,
              "collapsible": true,
              "context": undefined,
              "items": [
                {
                  "collapsed": false,
                  "collapsible": true,
                  "context": undefined,
                  "items": [
                    {
                      "context": undefined,
                      "link": "/guide/foo.html",
                      "tag": undefined,
                      "text": "Foo Real",
                    },
                  ],
                  "link": undefined,
                  "overviewHeaders": undefined,
                  "tag": undefined,
                  "text": "Foo",
                },
                {
                  "context": undefined,
                  "link": "/guide/bar.html",
                  "tag": undefined,
                  "text": "Bar",
                },
              ],
              "link": undefined,
              "overviewHeaders": undefined,
              "tag": undefined,
              "text": "Guide",
            },
          ],
        },
      }
    `);
  });
});
