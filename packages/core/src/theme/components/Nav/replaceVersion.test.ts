import { describe, expect, it, rs } from '@rstest/core';
import { addLeadingSlash } from '@rspress/shared';
import { replaceVersion } from './hooks';

rs.mock('@rspress/core/runtime', () => ({
  addLeadingSlash,
  normalizeHrefInRuntime: (link: string) => link,
  removeBase: (link: string) => link,
}));

describe('replaceVersion', () => {
  it.each([
    ['/guide/start', 'v1', 'v1', '/guide/start'],
    ['/guide/start', 'v1', 'v2', '/v2/guide/start'],
    ['/v2/guide/start', 'v2', 'v1', '/guide/start'],
    ['/v2/guide/start', 'v2', 'v2', '/v2/guide/start'],
  ])('maps %s from %s to %s', (url, current, target, expected) => {
    expect(
      replaceVersion(url, { current, target, default: 'v1' }, false, false),
    ).toBe(expected);
  });
});
