import { describe, expect, test } from '@rstest/core';
import { isPathPrefix, matchNavPath } from './path';

describe('isPathPrefix', () => {
  test('matches the prefix itself and nested segments', () => {
    expect(isPathPrefix('/guide/setup', '/guide')).toBe(true);
    expect(isPathPrefix('/guide', '/guide')).toBe(true);
    expect(isPathPrefix('/guide/', '/guide')).toBe(true);
    expect(isPathPrefix('/guide', '/guide/')).toBe(true);
    expect(isPathPrefix('/guide/setup', '/guide/')).toBe(true);
    expect(isPathPrefix('/zh/guide/setup', '/zh/guide')).toBe(true);
  });

  test('respects segment boundaries', () => {
    expect(isPathPrefix('/guidelines/setup', '/guide')).toBe(false);
    expect(isPathPrefix('/zh/guidelines', '/zh/guide')).toBe(false);
    expect(isPathPrefix('/g', '/guide')).toBe(false);
  });

  test('root key matches every pathname', () => {
    expect(isPathPrefix('/', '/')).toBe(true);
    expect(isPathPrefix('/any/page', '/')).toBe(true);
    expect(isPathPrefix('/', '/guide')).toBe(false);
  });
});

describe('matchNavPath', () => {
  test('root link only matches the homepage', () => {
    expect(matchNavPath('/', '/')).toBe(true);
    expect(matchNavPath('/guide/setup', '/')).toBe(false);
  });

  test('matches the link itself and nested segments', () => {
    expect(matchNavPath('/guide', '/guide')).toBe(true);
    expect(matchNavPath('/guide/', '/guide')).toBe(true);
    expect(matchNavPath('/guide/setup', '/guide')).toBe(true);
    expect(matchNavPath('/guide/setup', '/guide/')).toBe(true);
  });

  test('respects segment boundaries', () => {
    expect(matchNavPath('/guidebook', '/guide')).toBe(false);
    expect(matchNavPath('/guides', '/guide')).toBe(false);
  });
});

describe('isPathPrefix edge cases', () => {
  test('handles empty prefixes and case differences', () => {
    expect(isPathPrefix('/guide/setup', '')).toBe(true);
    expect(isPathPrefix('/Guide', '/guide')).toBe(false);
  });
});
