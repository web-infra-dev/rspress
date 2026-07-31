import { afterEach, describe, expect, it, rs } from '@rstest/core';
import siteData from 'virtual-site-data';
import {
  isActive,
  matchPath,
  pathnameToRouteService,
  preloadLink,
  redirectToCleanUrl,
} from './route';

rs.mock('virtual-site-data', () => {
  return {
    default: {
      base: '/',
      route: {},
    },
  };
});

rs.mock('virtual-routes', () => {
  const element = rs.fn();
  const routes = [
    {
      path: '/api/config',
      element,
      filePath: 'api/config.mdx',
      preload: rs.fn(),
      lang: '',
      version: '',
    },
    {
      path: '/api/config/',
      element,
      filePath: 'api/config/index.mdx',
      preload: rs.fn(),
      lang: '',
      version: '',
    },
    {
      path: '/',
      element,
      filePath: 'index.mdx',
      preload: rs.fn(),
      lang: '',
      version: '',
    },
    {
      path: '/file',
      element,
      filePath: 'file.mdx',
      preload: rs.fn(),
      lang: '',
      version: '',
    },
    {
      path: '/folder/',
      element,
      filePath: 'folder/index.mdx',
      preload: rs.fn(),
      lang: '',
      version: '',
    },
    {
      path: '/zh/guide/start/introduction',
      element,
      filePath: 'zh/guide/start/introduction.mdx',
      preload: rs.fn(),
      lang: 'zh',
      version: '',
    },
  ];
  return { routes };
});

afterEach(() => {
  siteData.base = '/';
  siteData.route.cleanUrls = undefined;
  siteData.route.cleanUrlsRedirect = undefined;
  siteData.route.prefetchLink = undefined;
  rs.clearAllMocks();
});

describe('matchPath', () => {
  it('should match exact paths', () => {
    expect(matchPath('/api/config', '/api/config')).toEqual({
      path: '/api/config',
    });
    expect(matchPath('/api/config/', '/api/config/')).toEqual({
      path: '/api/config/',
    });
  });

  it('should normalize trailing slashes', () => {
    expect(matchPath('/api/config', '/api/config/')).toEqual({
      path: '/api/config',
    });
    expect(matchPath('/api/config/', '/api/config')).toEqual({
      path: '/api/config/',
    });
    expect(matchPath('/api/config/', '/api/config/index.html')).toEqual({
      path: '/api/config/',
    });
  });

  it('should return null for non-matching paths', () => {
    expect(matchPath('/api/config', '/api/other')).toBeNull();
    expect(matchPath('/api', '/api/config')).toBeNull();
    expect(matchPath('/api', '/api/index.md')).toBeNull();
  });

  it('should handle case-insensitive matching', () => {
    // Pattern is lowercase, pathname has uppercase
    expect(matchPath('/api/config', '/API/CONFIG')).toEqual({
      path: '/api/config',
    });
    expect(matchPath('/api/config', '/Api/Config')).toEqual({
      path: '/api/config',
    });
    expect(matchPath('/api/config', '/api/CONFIG.html')).toEqual({
      path: '/api/config',
    });
    expect(matchPath('/api/config/', '/API/CONFIG/')).toEqual({
      path: '/api/config/',
    });
    expect(matchPath('/api/config/', '/API/CONFIG/index.html')).toEqual({
      path: '/api/config/',
    });
  });
});

describe('isActive', () => {
  it('should return true for matching normalized paths', () => {
    expect(isActive('/api/config', '/api/config')).toBe(true);
    expect(isActive('/api/config', '/api/config.html')).toBe(true);
    expect(isActive('/api/config', '/api/config/')).toBe(true);
  });

  it('should return false for non-matching paths', () => {
    expect(isActive('/api/config', '/api/other')).toBe(false);
  });

  it('should handle hash and search parameters correctly', () => {
    expect(isActive('/api/config', '/api/config#hash')).toBe(true);
    expect(isActive('/api/config', '/api/config?query=value')).toBe(true);
    expect(isActive('/api/config', '/api/config.html#hash')).toBe(true);
    expect(isActive('/api/config', '/api/config.html?query=value')).toBe(true);
    expect(isActive('/api/config', '/api/config.html?query=value#hash')).toBe(
      true,
    );
    expect(isActive('/api/config#different', '/api/config#hash')).toBe(true);
  });

  it('should handle case-insensitive matching', () => {
    // Item link is lowercase, current pathname has uppercase
    expect(isActive('/api/config', '/API/CONFIG')).toBe(true);
    expect(isActive('/api/config', '/Api/Config')).toBe(true);
    expect(isActive('/api/config', '/api/CONFIG.html')).toBe(true);
    expect(isActive('/api/config', '/API/CONFIG/')).toBe(true);
    expect(isActive('/api/config', '/API/CONFIG/index.html')).toBe(true);
    expect(isActive('/api/config', '/api/CONFIG#hash')).toBe(true);
    expect(isActive('/api/config', '/API/config?query=value')).toBe(true);
  });
});

describe('pathnameToRouteService', () => {
  it('0. /api/config', () => {
    const pathname = '/api/config';
    // currently we do not support both /api/config.mdx and /api/config/index.mdx
    expect(pathnameToRouteService(pathname)?.path).toMatchInlineSnapshot(
      `"/api/config/"`,
    );
  });

  it('1. /api/config.html', () => {
    const pathname = '/api/config.html';
    expect(pathnameToRouteService(pathname)?.path).toMatchInlineSnapshot(
      `"/api/config/"`,
    );
  });

  it('2. /api/config/', () => {
    const pathname = '/api/config/';
    expect(pathnameToRouteService(pathname)?.path).toMatchInlineSnapshot(
      `"/api/config/"`,
    );
  });

  it('3. /api/config/index', () => {
    const pathname = '/api/config/index';
    expect(pathnameToRouteService(pathname)?.path).toMatchInlineSnapshot(
      `"/api/config/"`,
    );
  });
  it('4. /api/config/index.html', () => {
    const pathname = '/api/config/index.html';
    expect(pathnameToRouteService(pathname)?.path).toMatchInlineSnapshot(
      `"/api/config/"`,
    );
  });

  it('5. /', () => {
    expect(pathnameToRouteService('/index.html')?.path).toMatchInlineSnapshot(
      `"/"`,
    );
    expect(pathnameToRouteService('/index.md')?.path).toMatchInlineSnapshot(
      `undefined`,
    );
  });

  it('6. /api/config.html#hash - should handle hash correctly', () => {
    const pathname = '/api/config.html#hash';
    expect(pathnameToRouteService(pathname)?.path).toMatchInlineSnapshot(
      `"/api/config/"`,
    );
  });

  it('7. /api/config.html?query=value - should handle query params correctly', () => {
    const pathname = '/api/config.html?query=value';
    expect(pathnameToRouteService(pathname)?.path).toMatchInlineSnapshot(
      `"/api/config/"`,
    );
  });

  it('8. /api/config.html?query=value#hash - should handle both query and hash', () => {
    const pathname = '/api/config.html?query=value#hash';
    expect(pathnameToRouteService(pathname)?.path).toMatchInlineSnapshot(
      `"/api/config/"`,
    );
  });

  it('9. /api/config#hash - should handle hash without .html', () => {
    const pathname = '/api/config#hash';
    expect(pathnameToRouteService(pathname)?.path).toMatchInlineSnapshot(
      `"/api/config/"`,
    );
  });

  it('10. Case-insensitive route matching', () => {
    // Uppercase pathname should match lowercase route
    expect(pathnameToRouteService('/API/CONFIG')?.path).toMatchInlineSnapshot(
      `"/api/config/"`,
    );
    expect(pathnameToRouteService('/Api/Config')?.path).toMatchInlineSnapshot(
      `"/api/config/"`,
    );
    expect(
      pathnameToRouteService('/API/CONFIG.html')?.path,
    ).toMatchInlineSnapshot(`"/api/config/"`);
    expect(pathnameToRouteService('/API/CONFIG/')?.path).toMatchInlineSnapshot(
      `"/api/config/"`,
    );
    expect(
      pathnameToRouteService('/API/CONFIG/index.html')?.path,
    ).toMatchInlineSnapshot(`"/api/config/"`);
    expect(
      pathnameToRouteService('/api/CONFIG#hash')?.path,
    ).toMatchInlineSnapshot(`"/api/config/"`);
  });
});

describe('redirectToCleanUrl', () => {
  const cases = [
    ['/file', '/file'],
    ['/file.html', '/file'],
    ['/file/', '/file'],
    ['/file/index', '/file'],
    ['/file/index.html', '/file'],
    ['/folder', '/folder/'],
    ['/folder.html', '/folder/'],
    ['/folder/', '/folder/'],
    ['/folder/index', '/folder/'],
    ['/folder/index.html', '/folder/'],
    ['/zh/guide/start/introduction.html', '/zh/guide/start/introduction'],
    ['/zh/guide/start/introduction/', '/zh/guide/start/introduction'],
    ['/zh/guide/start/introduction/index.html', '/zh/guide/start/introduction'],
  ] as const;

  it.each(cases)('normalizes %s to %s', (pathname, canonicalPathname) => {
    siteData.route.cleanUrls = true;
    const pushState = rs.fn();

    expect(
      redirectToCleanUrl(
        { pathname, search: '', hash: '' },
        { pushState, state: null },
      ),
    ).toBe(pathname !== canonicalPathname);

    if (pathname !== canonicalPathname) {
      expect(pushState).toHaveBeenCalledWith(null, '', canonicalPathname);
    } else {
      expect(pushState).not.toHaveBeenCalled();
    }
  });

  it('preserves the base, query, hash, and history state', () => {
    siteData.base = '/docs/';
    siteData.route.cleanUrls = true;
    const pushState = rs.fn();
    const state = { key: 'value' };

    expect(
      redirectToCleanUrl(
        {
          pathname: '/docs/folder/index.html',
          search: '?from=home',
          hash: '#overview',
        },
        { pushState, state },
      ),
    ).toBe(true);
    expect(pushState).toHaveBeenCalledWith(
      state,
      '',
      '/docs/folder/?from=home#overview',
    );
  });

  it('does not redirect when cleanUrls is disabled', () => {
    const pushState = rs.fn();

    expect(
      redirectToCleanUrl(
        {
          pathname: '/folder/index.html',
          search: '',
          hash: '',
        },
        { pushState, state: null },
      ),
    ).toBe(false);
    expect(pushState).not.toHaveBeenCalled();
  });

  it('does not redirect when cleanUrlsRedirect is disabled', () => {
    siteData.route.cleanUrls = true;
    siteData.route.cleanUrlsRedirect = false;
    const pushState = rs.fn();

    expect(
      redirectToCleanUrl(
        {
          pathname: '/folder/index.html',
          search: '',
          hash: '',
        },
        { pushState, state: null },
      ),
    ).toBe(false);
    expect(pushState).not.toHaveBeenCalled();
  });

  it('does not redirect an unmatched path', () => {
    siteData.route.cleanUrls = true;
    const pushState = rs.fn();

    expect(
      redirectToCleanUrl(
        {
          pathname: '/missing/index.html',
          search: '',
          hash: '',
        },
        { pushState, state: null },
      ),
    ).toBe(false);
    expect(pushState).not.toHaveBeenCalled();
  });
});

describe('preloadLink', () => {
  it('preloads matched routes by default', () => {
    const route = pathnameToRouteService('/api/config');

    preloadLink('/api/config');

    expect(route?.preload).toHaveBeenCalledTimes(1);
  });

  it('skips route preload when route.prefetchLink is false', () => {
    (siteData.route as { prefetchLink?: boolean }).prefetchLink = false;
    const route = pathnameToRouteService('/api/config');

    preloadLink('/api/config');

    expect(route?.preload).not.toHaveBeenCalled();
  });
});
