import { describe, expect, it, vi } from 'vitest';
import { isActive, matchPath, pathnameToRouteService } from './route';

vi.mock('virtual-routes', () => {
  const element = vi.fn();
  const routes = [
    {
      path: '/api/config',
      element,
      filePath: 'api/config.mdx',
      preload: async () => {},
      lang: '',
      version: '',
    },
    {
      path: '/api/config/',
      element,
      filePath: 'api/config/index.mdx',
      preload: async () => {},
      lang: '',
      version: '',
    },
    {
      path: '/',
      element,
      filePath: 'index.mdx',
      preload: async () => {},
      lang: '',
      version: '',
    },
  ];
  return { routes };
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
});
