import { describe, expect, it, rs } from '@rstest/core';
import actualPath from 'node:path' with { rstest: 'importActual' };

rs.mock('node:os', () => ({
  default: {
    platform: () => 'win32',
  },
}));

rs.mock('node:path', () => {
  return {
    ...actualPath,
    default: actualPath.win32,
  };
});

import { isWindows, normalizePath } from './normalizePath';

describe('normalizePath on Windows', () => {
  it('keeps module and route paths POSIX-style', () => {
    expect(isWindows).toBe(true);
    expect(normalizePath(String.raw`C:\repo\docs\..\guide\index.mdx`)).toBe(
      'C:/repo/guide/index.mdx',
    );
  });
});
