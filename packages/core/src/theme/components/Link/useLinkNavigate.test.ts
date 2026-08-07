import { describe, expect, rs, test } from '@rstest/core';

rs.mock('virtual-site-data', () => ({
  default: { base: '/docs/', route: { cleanUrls: true } },
}));

rs.mock('@rspress/core/runtime', () => ({}));

rs.mock('nprogress', () => ({
  default: { configure() {} },
}));

import { getAwaitedTarget } from './useLinkNavigate';

describe('getAwaitedTarget', () => {
  test('normalizes empty query and hash delimiters', () => {
    expect(getAwaitedTarget('/guide?#', '/current')).toBe('/guide');
    expect(getAwaitedTarget('#', '/guide?tab=api#intro')).toBe(
      '/guide?tab=api',
    );
  });
  test('matches the canonical router target', () => {
    expect(getAwaitedTarget('/docs/guide.html?tab=api#types', '/current')).toBe(
      '/guide?tab=api#types',
    );
  });

  test('resolves hash-only links against the current target', () => {
    expect(getAwaitedTarget('#types', '/guide?tab=api#intro')).toBe(
      '/guide?tab=api#types',
    );
  });
});
