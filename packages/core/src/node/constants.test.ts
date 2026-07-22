// cspell:ignore Googlebot
import { describe, expect, test } from '@rstest/core';
import {
  getInlineLocaleRedirectScript,
  getInlineThemeScript,
} from './constants';

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

const runLocaleRedirectScript = (
  config: Parameters<typeof getInlineLocaleRedirectScript>[0],
  options: {
    language: string;
    pathname: string;
    search?: string;
    userAgent?: string;
    visited?: boolean;
  },
) => {
  let redirectedTo: string | undefined;
  let visited = options.visited ?? false;
  const script = getInlineLocaleRedirectScript(config);

  Function(
    'window',
    'localStorage',
    script,
  )(
    {
      navigator: {
        language: options.language,
        userAgent: options.userAgent ?? 'browser',
      },
      location: {
        pathname: options.pathname,
        search: options.search ?? '',
        replace: (url: string) => {
          redirectedTo = url;
        },
      },
    },
    {
      getItem: () => (visited ? '1' : null),
      setItem: () => {
        visited = true;
      },
    },
  );

  return { redirectedTo, visited, script };
};

describe('getInlineLocaleRedirectScript', () => {
  const config = {
    lang: 'zh',
    locales: [
      { lang: 'zh', label: '中文' },
      { lang: 'en', label: 'English' },
      { lang: 'fr', label: 'Français' },
    ],
  };

  test('redirects from the default locale before rendering', () => {
    expect(
      runLocaleRedirectScript(config, {
        language: 'en-US',
        pathname: '/guide/',
        search: '?from=home',
      }),
    ).toMatchObject({
      redirectedTo: '/en/guide/?from=home',
      visited: true,
    });
  });

  test('redirects from a locale-prefixed route to the default locale', () => {
    expect(
      runLocaleRedirectScript(config, {
        language: 'zh-CN',
        pathname: '/en/guide/',
      }).redirectedTo,
    ).toBe('/guide/');
  });

  test('supports base and version prefixes', () => {
    const versionedConfig = {
      ...config,
      base: '/docs/',
      multiVersion: { default: 'v2', versions: ['v1', 'v2'] },
    };

    expect(
      runLocaleRedirectScript(versionedConfig, {
        language: 'zh-CN',
        pathname: '/docs/v1/en/guide/',
      }).redirectedTo,
    ).toBe('/docs/v1/guide/');

    expect(
      runLocaleRedirectScript(versionedConfig, {
        language: 'en-US',
        pathname: '/docs/v1/guide/',
      }).redirectedTo,
    ).toBe('/docs/v1/en/guide/');

    expect(
      runLocaleRedirectScript(versionedConfig, {
        language: 'fr-FR',
        pathname: '/docs/v1/en/guide/',
      }).redirectedTo,
    ).toBe('/docs/v1/fr/guide/');
  });

  test('does not redirect bots or returning visitors', () => {
    expect(
      runLocaleRedirectScript(config, {
        language: 'en-US',
        pathname: '/',
        userAgent: 'Googlebot',
      }),
    ).toMatchObject({ redirectedTo: undefined, visited: false });

    expect(
      runLocaleRedirectScript(config, {
        language: 'en-US',
        pathname: '/',
        visited: true,
      }),
    ).toMatchObject({ redirectedTo: undefined, visited: true });
  });

  test('preserves only-default-lang behavior', () => {
    const onlyDefaultLangConfig = {
      ...config,
      route: { localeRedirect: 'only-default-lang' as const },
    };

    expect(
      runLocaleRedirectScript(onlyDefaultLangConfig, {
        language: 'en-US',
        pathname: '/guide/',
      }).redirectedTo,
    ).toBe('/en/guide/');

    expect(
      runLocaleRedirectScript(onlyDefaultLangConfig, {
        language: 'en-US',
        pathname: '/fr/guide/',
      }).redirectedTo,
    ).toBeUndefined();
  });

  test('generates mode-specific runtime code', () => {
    const autoScript = getInlineLocaleRedirectScript(config);
    const onlyDefaultLangScript = getInlineLocaleRedirectScript({
      ...config,
      route: { localeRedirect: 'only-default-lang' },
    });

    expect(autoScript).not.toContain('localeRedirect');
    expect(autoScript).not.toContain('const ');
    expect(onlyDefaultLangScript).not.toContain('localeRedirect');
    expect(onlyDefaultLangScript).not.toContain(
      'newPathSegments[langIndex]=targetLang',
    );
    expect(onlyDefaultLangScript.length).toBeLessThan(autoScript.length);
  });

  test('does not inject redirect code when disabled or not configured', () => {
    expect(
      getInlineLocaleRedirectScript({
        ...config,
        route: { localeRedirect: 'never' },
      }),
    ).toBe('');
    expect(getInlineLocaleRedirectScript({ locales: config.locales })).toBe('');
  });
});
