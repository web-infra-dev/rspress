import { describe, expect, it, rs } from '@rstest/core';
import { getHref } from './getHref';

rs.mock('virtual-site-data', () => ({
  default: {
    base: '/docs/',
    route: {
      cleanUrls: true,
    },
  },
}));

describe('getHref', () => {
  it('preserves search and hash for an internal link with a base', () => {
    expect(getHref('/guide?tab=api#install')).toEqual({
      linkType: 'internal',
      withBaseHref: '/docs/guide?tab=api#install',
      removeBaseHref: '/guide?tab=api#install',
      routePath: '/guide',
    });
  });

  it('preserves search and hash when resolving a relative link', () => {
    expect(
      getHref('./guide?tab=api#install', 'https://example.com/docs/source'),
    ).toEqual({
      linkType: 'relative',
      withBaseHref: '/docs/guide?tab=api#install',
      removeBaseHref: '/guide?tab=api#install',
      routePath: '/guide',
    });
  });
});
