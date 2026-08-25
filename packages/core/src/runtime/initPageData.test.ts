import { describe, expect, it, rs } from '@rstest/core';
import { consumeCachedPageData, type Page, warmPageData } from './initPageData';

rs.mock('virtual-page-data', () => ({
  pageData: { pages: [] },
}));

rs.mock('virtual-routes', () => ({
  routes: [],
}));

rs.mock('virtual-site-data', () => ({
  default: {},
}));

describe('page data cache', () => {
  it('matches a warmed URL with search and hash by pathname', () => {
    const page = { routePath: '/guide' } as Page;

    warmPageData('/guide?lang=en#installation', page);

    expect(consumeCachedPageData('/guide')).toBe(page);
  });
});
