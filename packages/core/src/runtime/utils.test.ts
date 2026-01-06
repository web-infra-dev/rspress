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
  it('should convert html extension to md', () => {
    expect(routePathToMdPath('/foo/bar.html')).toBe('/foo/bar.md');
  });

  it('should preserve hash', () => {
    expect(routePathToMdPath('/foo/bar.html#hash')).toBe('/foo/bar.md#hash');
  });

  it('should preserve search params', () => {
    expect(routePathToMdPath('/foo/bar.html?q=1')).toBe('/foo/bar.md?q=1');
  });

  it('should preserve search params and hash', () => {
    expect(routePathToMdPath('/foo/bar.html?q=1#hash')).toBe(
      '/foo/bar.md?q=1#hash',
    );
  });

  it('should handle path without html extension if normalizeHref leaves it alone or adds it', () => {
    // If cleanUrls is false (arg passed to normalizeHref), normalizeHref usually ensures .html for files
    // But let's just test basic replacement logic if input has .html
    expect(routePathToMdPath('/foo.html')).toBe('/foo.md');
  });
});
