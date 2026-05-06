import { describe, expect, rs, test } from '@rstest/core';
import { getStoredThemeConfig } from './useThemeState';

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
