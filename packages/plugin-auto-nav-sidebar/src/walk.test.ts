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
              "_fileKey": "guide/b",
              "context": undefined,
              "link": "/guide/b",
              "overviewHeaders": undefined,
              "text": "b",
            },
            {
              "_fileKey": "guide/c.tsx",
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
