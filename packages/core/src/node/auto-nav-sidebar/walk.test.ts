import path from 'node:path';
import { DEFAULT_PAGE_EXTENSIONS } from '@rspress/shared/constants';
import { afterEach, describe, expect, it } from '@rstest/core';
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

function orderStringSet(input: Set<string>) {
  return Array.from(input).sort().join('\n');
}

const defaultMock = {
  normalizeRoutePath: mockNormalizeRoutePath,
  getRoutePathParts: mockGetRoutePathParts,
} as RouteService;

describe('walk', () => {
  afterEach(() => {
    RouteService.__instance__ = defaultMock;
  });

  it('basic', async () => {
    const docsDir = path.join(__dirname, './fixtures/docs');
    const metaFileSet = new Set<string>();
    const mdFileSet = new Set<string>();
    const sidebar = await walk(
      docsDir,
      docsDir,
      DEFAULT_PAGE_EXTENSIONS,
      metaFileSet,
      mdFileSet,
    );
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

    expect(orderStringSet(metaFileSet)).toMatchInlineSnapshot(`
      "<ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs/_nav.json
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs/guide/_meta.json"
    `);

    expect(orderStringSet(mdFileSet)).toMatchInlineSnapshot(`
      "<ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs/guide/a.md
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs/guide/b.mdx
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs/guide/c.tsx
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs/guide/index.mdx
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs/guide/test-dir/getting-started.mdx
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs/guide/test-dir/index.mdx
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs/guide/test-same-name-dir.md
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs/guide/test-same-name-dir/index.mdx"
    `);
  });

  it('both _meta.json and _nav.json do not exist', async () => {
    const docsDir = path.join(__dirname, './fixtures/docs-no-meta');
    const metaFileSet = new Set<string>();
    const mdFileSet = new Set<string>();
    const sidebar = await walk(
      docsDir,
      docsDir,
      DEFAULT_PAGE_EXTENSIONS,
      metaFileSet,
      mdFileSet,
    );
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
                  "_fileKey": "api/_components",
                  "collapsed": undefined,
                  "collapsible": undefined,
                  "context": undefined,
                  "items": [
                    {
                      "_fileKey": "api/_components/Button",
                      "context": undefined,
                      "link": "/api/_components/Button",
                      "overviewHeaders": undefined,
                      "tag": undefined,
                      "text": "Button",
                    },
                  ],
                  "overviewHeaders": undefined,
                  "text": "_components",
                },
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
    expect(orderStringSet(metaFileSet)).toMatchInlineSnapshot(`""`);
    expect(orderStringSet(mdFileSet)).toMatchInlineSnapshot(`
      "<ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-no-meta/api/_components/Button.mdx
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-no-meta/api/api.mdx
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-no-meta/api/guide/getting-started.mdx
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-no-meta/api/guide/index.mdx
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-no-meta/api/index.mdx
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-no-meta/index.mdx"
    `);
  });

  it('both _meta.json and _nav.json exist', async () => {
    const docsDir = path.join(__dirname, './fixtures/docs-meta-nav');
    const metaFileSet = new Set<string>();
    const mdFileSet = new Set<string>();
    const sidebar = await walk(
      docsDir,
      docsDir,
      DEFAULT_PAGE_EXTENSIONS,
      metaFileSet,
      mdFileSet,
    );
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
        },
      }
    `);
    expect(orderStringSet(metaFileSet)).toMatchInlineSnapshot(`
      "<ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-meta-nav/_meta.json
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-meta-nav/_nav.json"
    `);
    expect(orderStringSet(mdFileSet)).toMatchInlineSnapshot(`
      "<ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-meta-nav/api/api.mdx
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-meta-nav/api/guide/getting-started.mdx
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-meta-nav/api/guide/index.mdx
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-meta-nav/api/index.mdx
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-meta-nav/index.mdx"
    `);
  });

  it('route.exclude should filter sidebar items', async () => {
    const docsDir = path.join(__dirname, './fixtures/docs-no-meta');
    const metaFileSet = new Set<string>();
    const mdFileSet = new Set<string>();

    // Mock isExistRoute to exclude _components paths
    RouteService.__instance__ = {
      normalizeRoutePath: mockNormalizeRoutePath,
      getRoutePathParts: mockGetRoutePathParts,
      isExistRoute: (link: string) => !link.includes('_components'),
    } as RouteService;

    const result = await walk(
      docsDir,
      docsDir,
      DEFAULT_PAGE_EXTENSIONS,
      metaFileSet,
      mdFileSet,
    );

    // _components/Button should NOT appear in sidebar
    const allLinks = JSON.stringify(result.sidebar);
    expect(allLinks).not.toContain('_components');
    expect(allLinks).not.toContain('Button');

    // Other items should still be present
    expect(allLinks).toContain('getting-started');

    // Excluded files should not be in mdFileSet
    expect(Array.from(mdFileSet).some(f => f.includes('Button'))).toBe(false);
  });

  it('_meta.json referencing excluded file should skip it', async () => {
    const docsDir = path.join(__dirname, './fixtures/docs-exclude-meta');
    const metaFileSet = new Set<string>();
    const mdFileSet = new Set<string>();

    RouteService.__instance__ = {
      normalizeRoutePath: mockNormalizeRoutePath,
      getRoutePathParts: mockGetRoutePathParts,
      isExistRoute: (link: string) => !link.includes('excluded-file'),
    } as RouteService;

    const result = await walk(
      docsDir,
      docsDir,
      DEFAULT_PAGE_EXTENSIONS,
      metaFileSet,
      mdFileSet,
    );

    const sidebar = result.sidebar['/guide'];
    const allLinks = JSON.stringify(sidebar);
    expect(allLinks).not.toContain('excluded-file');
    expect(allLinks).toContain('Page a');
    expect(allLinks).toContain('Page b');

    // Excluded files should not be in mdFileSet
    expect(Array.from(mdFileSet).some(f => f.includes('excluded-file'))).toBe(
      false,
    );
  });

  it('custom link group', async () => {
    const docsDir = path.join(__dirname, './fixtures/docs-custom-link-group');
    const metaFileSet = new Set<string>();
    const mdFileSet = new Set<string>();
    const sidebar = await walk(
      docsDir,
      docsDir,
      DEFAULT_PAGE_EXTENSIONS,
      metaFileSet,
      mdFileSet,
    );
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
    expect(orderStringSet(metaFileSet)).toMatchInlineSnapshot(`
      "<ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-custom-link-group/_nav.json
      <ROOT>/packages/core/src/node/auto-nav-sidebar/fixtures/docs-custom-link-group/guide/_meta.json"
    `);
    expect(orderStringSet(mdFileSet)).toMatchInlineSnapshot(`""`);
  });
});
