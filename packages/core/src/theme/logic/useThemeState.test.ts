import { afterEach, describe, expect, rs, test } from '@rstest/core';
import {
  getDefaultThemeConfig,
  getResolvedTheme,
  getStoredThemeConfig,
} from './useThemeState';

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

describe('getDefaultThemeConfig', () => {
  const _globalThis = globalThis as { window?: { RSPRESS_THEME?: string } };

  afterEach(() => {
    delete _globalThis.window;
  });

  test('returns "auto" when window is not available', () => {
    expect(getDefaultThemeConfig()).toBe('auto');
  });

  test('returns "auto" when window.RSPRESS_THEME is not set', () => {
    _globalThis.window = {};
    expect(getDefaultThemeConfig()).toBe('auto');
  });

  test('returns "dark" when window.RSPRESS_THEME is "dark"', () => {
    _globalThis.window = { RSPRESS_THEME: 'dark' };
    expect(getDefaultThemeConfig()).toBe('dark');
  });

  test('returns "light" when window.RSPRESS_THEME is "light"', () => {
    _globalThis.window = { RSPRESS_THEME: 'light' };
    expect(getDefaultThemeConfig()).toBe('light');
  });

  test('returns "auto" when window.RSPRESS_THEME is an unsupported value', () => {
    _globalThis.window = { RSPRESS_THEME: 'wrong' };
    expect(getDefaultThemeConfig()).toBe('auto');
  });
});
