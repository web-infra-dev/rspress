import { describe, expect, rs, test } from '@rstest/core';
import { getResolvedTheme, getStoredThemeConfig } from './useThemeState';

rs.mock('@rspress/core/runtime', () => ({
  useSite: () => ({
    site: {
      themeConfig: {},
    },
  }),
}));

describe('getStoredThemeConfig', () => {
  test('returns auto when dark matches the system preference', () => {
    expect(getStoredThemeConfig('dark', true)).toBe('auto');
  });

  test('returns auto when light matches the system preference', () => {
    expect(getStoredThemeConfig('light', false)).toBe('auto');
  });

  test('keeps explicit theme when it differs from the system preference', () => {
    expect(getStoredThemeConfig('dark', false)).toBe('dark');
    expect(getStoredThemeConfig('light', true)).toBe('light');
  });
});

describe('getResolvedTheme', () => {
  test('resolves auto theme from the system preference', () => {
    expect(getResolvedTheme('auto', true)).toBe('dark');
    expect(getResolvedTheme('auto', false)).toBe('light');
  });

  test('keeps explicit theme config', () => {
    expect(getResolvedTheme('dark', false)).toBe('dark');
    expect(getResolvedTheme('light', true)).toBe('light');
  });
});
