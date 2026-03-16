import { describe, expect, it } from '@rstest/core';
import { getRoutePathParts, normalizeRoutePath } from './normalizeRoutePath';
import { addRoutePrefix } from './RoutePage';
import { RouteService } from './RouteService';

describe('addRoutePrefix', () => {
  it('should handle dotted version directories like v0.8', () => {
    const versions = ['v0.8', 'v0.7'];
    RouteService.__instance__ = {
      normalizeRoutePath: (link: string) =>
        normalizeRoutePath(link, '', 'v0.8', [], versions, ['.md', '.mdx']),
      getRoutePathParts: (link: string) =>
        getRoutePathParts(link, '', 'v0.8', [], versions),
    } as RouteService;

    const docsDir = '/docs';

    // v0.8 is the default version, so it should not appear in prefix
    expect(addRoutePrefix('/docs/v0.8/guide', docsDir, '/api')).toBe('/api');

    // v0.7 is a non-default version, so it should appear in prefix
    expect(addRoutePrefix('/docs/v0.7/guide', docsDir, '/api')).toBe(
      '/v0.7/api',
    );
  });

  it('should handle version directories without dots', () => {
    const versions = ['v2', 'v1'];
    RouteService.__instance__ = {
      normalizeRoutePath: (link: string) =>
        normalizeRoutePath(link, '', 'v2', [], versions, ['.md', '.mdx']),
      getRoutePathParts: (link: string) =>
        getRoutePathParts(link, '', 'v2', [], versions),
    } as RouteService;

    const docsDir = '/docs';

    expect(addRoutePrefix('/docs/v2/guide', docsDir, '/api')).toBe('/api');
    expect(addRoutePrefix('/docs/v1/guide', docsDir, '/api')).toBe('/v1/api');
  });

  it('should handle no version prefix', () => {
    RouteService.__instance__ = {
      normalizeRoutePath: (link: string) =>
        normalizeRoutePath(link, '', '', [], [], ['.md', '.mdx']),
      getRoutePathParts: (link: string) =>
        getRoutePathParts(link, '', '', [], []),
    } as RouteService;

    const docsDir = '/docs';
    expect(addRoutePrefix('/docs/guide', docsDir, '/api')).toBe('/api');
  });
});
