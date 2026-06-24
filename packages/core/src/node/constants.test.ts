import { describe, expect, test } from '@rstest/core';
import { getInlineThemeScript } from './constants';

const runThemeScript = (
  darkMode: Parameters<typeof getInlineThemeScript>[0],
  options: { saved?: string | null; prefersDark?: boolean } = {},
) => {
  const classNames = new Set<string>();
  const documentElement = {
    classList: {
      toggle: (className: string, force: boolean) => {
        if (force) {
          classNames.add(className);
        } else {
          classNames.delete(className);
        }
      },
    },
    style: {} as { colorScheme?: string },
  };

  Function(
    'localStorage',
    'window',
    'document',
    getInlineThemeScript(darkMode),
  )(
    {
      getItem: () => options.saved ?? null,
    },
    {
      matchMedia: () => ({ matches: options.prefersDark ?? false }),
    },
    { documentElement },
  );

  return {
    isDark: classNames.has('rp-dark'),
    colorScheme: documentElement.style.colorScheme,
  };
};

describe('getInlineThemeScript', () => {
  test('follows the system preference by default', () => {
    expect(runThemeScript(undefined, { prefersDark: true })).toEqual({
      isDark: true,
      colorScheme: 'dark',
    });

    expect(runThemeScript(undefined, { prefersDark: false })).toEqual({
      isDark: false,
      colorScheme: 'light',
    });
  });

  test('supports explicit default dark mode', () => {
    expect(runThemeScript('dark')).toEqual({
      isDark: true,
      colorScheme: 'dark',
    });
  });

  test('supports auto mode', () => {
    expect(runThemeScript('auto', { prefersDark: true })).toEqual({
      isDark: true,
      colorScheme: 'dark',
    });
  });

  test('allows local storage to override switchable defaults', () => {
    expect(runThemeScript('dark', { saved: 'light' })).toEqual({
      isDark: false,
      colorScheme: 'light',
    });
  });

  test('ignores local storage for force modes', () => {
    expect(runThemeScript('force-dark', { saved: 'light' })).toEqual({
      isDark: true,
      colorScheme: 'dark',
    });

    expect(
      runThemeScript('force-auto', { saved: 'dark', prefersDark: false }),
    ).toEqual({
      isDark: false,
      colorScheme: 'light',
    });
  });
});
