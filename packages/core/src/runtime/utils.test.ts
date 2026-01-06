import { describe, expect, it, rs } from '@rstest/core';
import { routePathToMdPath } from './utils';

rs.mock('virtual-site-data', () => {
  return {
    default: {
      base: '/',
    },
  };
});

describe('routePathToMdPath', () => {
  it('should match snapshot for various paths', () => {
    const cases = [
      '/foo/bar.html',
      '/foo/bar.html#hash',
      '/foo/bar.html?q=1',
      '/foo/bar.html?q=1#hash',
      '/foo.html',
      '/simple.html#my-heading',
      '/query.html?foo=bar&baz=qux',
      '/complex.html?id=123#section-2',
    ];

    const results = cases.map(path => routePathToMdPath(path));
    expect(results).toMatchInlineSnapshot(`
      [
        "/foo/bar.md",
        "/foo/bar.md#hash",
        "/foo/bar.md?q=1",
        "/foo/bar.md?q=1#hash",
        "/foo.md",
        "/simple.md#my-heading",
        "/query.md?foo=bar&baz=qux",
        "/complex.md?id=123#section-2",
      ]
    `);
  });
});
