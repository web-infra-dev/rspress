import { describe, expect, rs, test } from '@rstest/core';

rs.mock('@rspress/core/runtime', () => ({
  cleanUrlByConfig: (href: string) => href.replace(/\.html(?=[?#]|$)/, ''),
  isExternalUrl: (href: string) => /^https?:\/\//.test(href),
  removeBase: (href: string) => href.replace(/^\/docs(?=\/|$)/, '') || '/',
  withBase: (href: string) =>
    href.startsWith('/docs') ? href : `/docs${href}`,
}));

rs.mock('nprogress', () => ({
  default: { configure() {} },
}));

import { getAwaitedTarget } from './useLinkNavigate';

describe('getAwaitedTarget', () => {
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
