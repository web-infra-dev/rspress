import { describe, expect, it, rs } from '@rstest/core';
import { getSidebarDataGroup, isActive } from './getSidebarDataGroup';

rs.mock('virtual-i18n-text', () => {
  return { default: {} };
});

rs.mock('virtual-runtime-config', () => {
  return {
    base: '/',
  };
});

rs.mock('virtual-site-data', () => {
  return {};
});

rs.mock('virtual-routes', () => {
  return { routes: [] };
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
      [
        {
          "link": "/guide/getting-started",
          "text": "Getting Started",
        },
      ]
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
      [
        {
          "link": "/api/react.use",
          "text": "react.use",
        },
      ]
    `);
  });
});

describe('isActive', () => {
  it('pass cases', () => {
    const routes = [
      '/api/config',
      '/api/config.html',
      '/api/config/',
      '/api/config/index',
      '/api/config/index.html',
    ];

    for (const route of routes) {
      for (const route2 of routes) {
        expect(isActive(route, route2)).toBeTruthy();
      }
    }
  });

  it('failed cases', () => {
    expect(isActive('/api/config', '/api/config2')).toBeFalsy();
    expect(isActive('/api/config', '/api/config/config2')).toBeFalsy();
    expect(isActive('/api/config/index', '/api/config/config2')).toBeFalsy();
  });
});
