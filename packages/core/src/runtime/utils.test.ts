import { afterEach, describe, expect, it, rs } from '@rstest/core';
import siteData from 'virtual-site-data';
import {
  redirectToBaseWithTrailingSlash,
  routePathToMdPath,
  withSiteOrigin,
} from './utils';

rs.mock('virtual-site-data', () => {
  return {
    default: {
      base: '/',
      route: {},
      siteOrigin: 'https://example.com',
    },
  };
});

describe('redirectToBaseWithTrailingSlash', () => {
  afterEach(() => {
    siteData.base = '/';
    siteData.route.baseRedirect = undefined;
  });

  it('redirects the base path to its trailing-slash URL by default', () => {
    siteData.base = '/docs/';
    const replaceState = rs.fn();
    const state = { key: 'value' };

    expect(
      redirectToBaseWithTrailingSlash(
        {
          pathname: '/docs',
          search: '?from=home',
          hash: '#overview',
        },
        { replaceState, state },
      ),
    ).toBe(true);
    expect(replaceState).toHaveBeenCalledWith(
      state,
      '',
      '/docs/?from=home#overview',
    );
  });

  it('does not redirect when route.baseRedirect is false', () => {
    siteData.base = '/docs/';
    siteData.route.baseRedirect = false;
    const replaceState = rs.fn();

    expect(
      redirectToBaseWithTrailingSlash(
        {
          pathname: '/docs',
          search: '',
          hash: '',
        },
        { replaceState, state: null },
      ),
    ).toBe(false);
    expect(replaceState).not.toHaveBeenCalled();
  });

  it('does not redirect other paths', () => {
    siteData.base = '/docs/';
    const replaceState = rs.fn();

    expect(
      redirectToBaseWithTrailingSlash(
        {
          pathname: '/docs/guide',
          search: '',
          hash: '',
        },
        { replaceState, state: null },
      ),
    ).toBe(false);
    expect(replaceState).not.toHaveBeenCalled();
  });

  it('does not redirect the root base', () => {
    siteData.base = '/';
    const replaceState = rs.fn();

    expect(
      redirectToBaseWithTrailingSlash(
        {
          pathname: '/',
          search: '',
          hash: '',
        },
        { replaceState, state: null },
      ),
    ).toBe(false);
    expect(replaceState).not.toHaveBeenCalled();
  });
});

describe('withSiteOrigin', () => {
  it('should prepend the configured site origin', () => {
    expect(withSiteOrigin('/docs/llms.txt')).toBe(
      'https://example.com/docs/llms.txt',
    );
  });
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
