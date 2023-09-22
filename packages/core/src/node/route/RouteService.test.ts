import { expect, describe, test } from 'vitest';
import { normalizeRoutePath } from './RouteService';

describe('Route utils', () => {
  test('normalizeRoutePath', () => {
    expect(normalizeRoutePath('/v1/en/foo/bar', 'en', '/', 'v1')).toBe(
      '/foo/bar',
    );
    expect(normalizeRoutePath('/v1/zh/foo/bar', 'en', '/', 'v1')).toBe(
      '/zh/foo/bar',
    );
    expect(normalizeRoutePath('/v2/en/foo/bar', 'en', '/', 'v1')).toBe(
      '/v2/foo/bar',
    );
    expect(normalizeRoutePath('/v2/zh/foo/bar', 'en', '/', 'v1')).toBe(
      '/v2/zh/foo/bar',
    );
  });
});
