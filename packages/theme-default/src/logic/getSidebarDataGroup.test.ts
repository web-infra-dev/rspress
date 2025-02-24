import { describe, expect, it, vi } from 'vitest';
import { getSidebarDataGroup } from './getSidebarDataGroup';

vi.mock('@rspress/runtime', () => {
  return {
    withBase: (arg0: string) => arg0,
    pathnameToRouteService: (arg0: string) => {
      const map: Record<string, string> = {
        '/guide/getting-started': '/guide/getting-started',
        '/api/react.use': '/api/react.use',
        '/api/react.use.html': '/api/react.use',
      };
      return {
        path: map[arg0],
      };
    },
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

  it('when using api-extractor', async () => {
    expect(
      getSidebarDataGroup(
        {
          '/api/react': [{ link: '/api/react.use', text: 'react.use' }],
        },
        '/api/react.use.html',
      ),
    ).toMatchInlineSnapshot(`
      {
        "group": "react.use",
        "items": [
          {
            "link": "/api/react.use",
            "text": "react.use",
          },
        ],
      }
    `);
  });
});
