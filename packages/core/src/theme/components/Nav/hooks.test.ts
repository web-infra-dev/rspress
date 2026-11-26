import { describe, expect, it, rs } from '@rstest/core';
import { addLeadingSlash, normalizeHref } from '@rspress/shared';
import { useVersionsMenu } from './hooks';

const routes = ['/v2/zh/guide/new'];

rs.mock('@rspress/core/runtime', () => ({
  addLeadingSlash,
  normalizeHrefInRuntime: (link: string) => normalizeHref(link, true),
  pathnameToRouteService: (link: string) =>
    routes.includes(link) ? { path: link } : undefined,
  removeBase: (link: string) => link,
  useLocation: () => ({ pathname: '/v2/zh/guide/new' }),
  usePage: () => ({ page: { lang: 'zh', pageType: 'doc' } }),
  useSite: () => ({
    site: {
      lang: 'en',
      route: { cleanUrls: true },
      multiVersion: { default: 'v1', versions: ['v1', 'v2'] },
    },
  }),
  useVersion: () => 'v2',
}));

describe('useVersionsMenu', () => {
  it('links to the version homepage when the page does not exist in it', () => {
    expect(useVersionsMenu().items).toEqual([
      { text: 'v1', link: '/zh/' },
      { text: 'v2', link: '/v2/zh/guide/new' },
    ]);
  });
});
