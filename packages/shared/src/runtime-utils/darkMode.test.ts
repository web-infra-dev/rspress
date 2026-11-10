import { describe, expect, test } from '@rstest/core';
import {
  getDefaultDarkModeValue,
  isDarkModeSwitchEnabled,
  normalizeDarkMode,
} from './darkMode';

describe('normalizeDarkMode', () => {
  test('maps boolean values to normalized dark mode values', () => {
    expect(normalizeDarkMode(true)).toBe('auto');
    expect(normalizeDarkMode(false)).toBe('force-light');
  });

  test('uses auto as the default dark mode value', () => {
    expect(normalizeDarkMode(undefined)).toBe('auto');
  });

  test('keeps explicit dark mode values', () => {
    expect(normalizeDarkMode('dark')).toBe('dark');
    expect(normalizeDarkMode('auto')).toBe('auto');
    expect(normalizeDarkMode('force-dark')).toBe('force-dark');
    expect(normalizeDarkMode('force-auto')).toBe('force-auto');
  });
});

describe('getDefaultDarkModeValue', () => {
  test('returns the default value for switchable dark modes', () => {
    expect(getDefaultDarkModeValue(undefined)).toBe('auto');
    expect(getDefaultDarkModeValue(true)).toBe('auto');
    expect(getDefaultDarkModeValue('light')).toBe('light');
    expect(getDefaultDarkModeValue('dark')).toBe('dark');
    expect(getDefaultDarkModeValue('auto')).toBe('auto');
  });

  test('returns the forced value for force dark modes', () => {
    expect(getDefaultDarkModeValue(false)).toBe('light');
    expect(getDefaultDarkModeValue('force-light')).toBe('light');
    expect(getDefaultDarkModeValue('force-dark')).toBe('dark');
    expect(getDefaultDarkModeValue('force-auto')).toBe('auto');
  });
});

describe('isDarkModeSwitchEnabled', () => {
  test('enables switch for default dark modes', () => {
    expect(isDarkModeSwitchEnabled(undefined)).toBe(true);
    expect(isDarkModeSwitchEnabled(true)).toBe(true);
    expect(isDarkModeSwitchEnabled('light')).toBe(true);
    expect(isDarkModeSwitchEnabled('dark')).toBe(true);
    expect(isDarkModeSwitchEnabled('auto')).toBe(true);
  });

  test('disables switch for force dark modes', () => {
    expect(isDarkModeSwitchEnabled(false)).toBe(false);
    expect(isDarkModeSwitchEnabled('force-light')).toBe(false);
    expect(isDarkModeSwitchEnabled('force-dark')).toBe(false);
    expect(isDarkModeSwitchEnabled('force-auto')).toBe(false);
  });
});
