import { describe, expect, it, vi } from 'vitest';
import { getSidebarDataGroup } from './getSidebarDataGroup';

vi.mock('@rspress/runtime', () => {
  return {
    isEqualPath: () => true,
    withBase: (arg0: string) => arg0,
  };
});

describe('getSidebarDataGroup', () => {
  it('when using "/"', async () => {
    expect(
      getSidebarDataGroup(
        {
          '/': [],
          '/guide': [
            {
              text: 'Getting Started',
              link: '/guide/getting-started',
            },
          ],
        },
        '/guide/getting-started',
      ),
    ).toMatchInlineSnapshot(`
      {
        "group": "Getting Started",
        "items": [
          {
            "link": "/guide/getting-started",
            "text": "Getting Started",
          },
        ],
      }
    `);
  });
});
