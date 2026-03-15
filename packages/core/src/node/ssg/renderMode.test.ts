import type { UserConfig } from '@rspress/shared';
import { describe, expect, it } from '@rstest/core';
import { getSsgRenderMode, isRscRenderMode } from './renderMode';

describe('renderMode', () => {
  it('defaults to ssr when ssg is not configured', () => {
    expect(getSsgRenderMode({} as UserConfig)).toBe('ssr');
    expect(isRscRenderMode({} as UserConfig)).toBe(false);
  });

  it('defaults to ssr when ssg is enabled without renderMode', () => {
    const config = {
      ssg: {
        experimentalWorker: true,
      },
    } as UserConfig;

    expect(getSsgRenderMode(config)).toBe('ssr');
    expect(isRscRenderMode(config)).toBe(false);
  });

  it('returns rsc when renderMode is configured', () => {
    const config = {
      ssg: {
        renderMode: 'rsc',
      },
    } as UserConfig;

    expect(getSsgRenderMode(config)).toBe('rsc');
    expect(isRscRenderMode(config)).toBe(true);
  });
});
