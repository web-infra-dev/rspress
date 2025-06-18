import path from 'node:path';
import { DEFAULT_PAGE_EXTENSIONS } from '@rspress/shared/constants';
import { describe, expect, it } from 'vitest';
import { walk } from './walk';

const workDir = path.join(__dirname, './fixtures/docs');
const docsDir = path.join(__dirname, './fixtures/docs');

describe('walk', () => {
  it('basic', async () => {
    const sidebar = await walk(workDir, '/', docsDir, DEFAULT_PAGE_EXTENSIONS);
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
              "collapsed": undefined,
              "collapsible": undefined,
              "context": undefined,
              "items": [
                {
                  "context": undefined,
                  "link": "/guide/test-dir/getting-started",
                  "overviewHeaders": undefined,
                  "text": "Getting started",
                },
                {
                  "context": undefined,
                  "link": "/guide/test-dir/index",
                  "overviewHeaders": undefined,
                  "text": "Test dir",
                },
              ],
              "link": "/guide/test-dir",
              "overviewHeaders": undefined,
              "tag": undefined,
              "text": "Test dir",
            },
            {
              "context": undefined,
              "link": "/guide/a",
              "overviewHeaders": undefined,
              "text": "Page a",
            },
            {
              "context": undefined,
              "link": "/guide/b",
              "overviewHeaders": undefined,
              "text": "Page b",
            },
            {
              "context": undefined,
              "link": "/guide/c",
              "overviewHeaders": undefined,
              "text": "c",
            },
          ],
        },
      }
    `);
  });
});
