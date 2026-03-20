import type { UserConfig } from '@rspress/shared';
import { describe, expect, it } from '@rstest/core';
import { isRscEnabled, isSsgEnabled, shouldUseRscSsg } from './config';

describe('rsc config', () => {
  it('keeps rsc disabled by default', () => {
    expect(isRscEnabled({} as UserConfig)).toBe(false);
  });

  it('enables rsc for boolean and object config', () => {
    expect(isRscEnabled({ rsc: true } as UserConfig)).toBe(true);
    expect(isRscEnabled({ rsc: {} } as UserConfig)).toBe(true);
  });

  it('keeps ssg enabled by default', () => {
    expect(isSsgEnabled({} as UserConfig)).toBe(true);
    expect(isSsgEnabled({ ssg: false } as UserConfig)).toBe(false);
    expect(isSsgEnabled({ ssg: false, llms: true } as UserConfig)).toBe(true);
  });

  it('only enables rsc ssg when both rsc and ssg are enabled', () => {
    expect(shouldUseRscSsg({ rsc: true } as UserConfig, true)).toBe(true);
    expect(
      shouldUseRscSsg({ rsc: true, ssg: false } as UserConfig, false),
    ).toBe(false);
    expect(shouldUseRscSsg({ rsc: true, ssg: false } as UserConfig, true)).toBe(
      false,
    );
  });
});
