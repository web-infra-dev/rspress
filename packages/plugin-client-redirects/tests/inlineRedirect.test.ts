import { describe, expect, test } from '@rstest/core';
import { pluginClientRedirects } from '../src';
import { getInlineRedirectScript } from '../src/inlineRedirect';
import type { RedirectsOptions } from '../src/types';

const runInlineRedirectScript = (
  options: RedirectsOptions,
  {
    pathname,
    hash = '',
    base,
    redirecting = false,
  }: {
    pathname: string;
    hash?: string;
    base?: string;
    redirecting?: boolean;
  },
) => {
  let redirectedTo: string | undefined;
  const warnings: unknown[][] = [];
  const script = getInlineRedirectScript(options, base);
  const location = {
    pathname,
    hash,
    replace: (url: string) => {
      redirectedTo = url;
    },
  };
  const windowMock = {
    location,
  };

  if (redirecting) {
    Reflect.set(windowMock, Symbol.for('rspress.redirecting'), true);
  }

  Function(
    'window',
    'console',
    script,
  )(windowMock, {
    warn: (...args: unknown[]) => {
      warnings.push(args);
    },
  });

  return {
    get redirectedTo() {
      return redirectedTo;
    },
    script,
    warnings,
  };
};

describe('getInlineRedirectScript', () => {
  test('redirects internal routes and preserves the hash', () => {
    expect(
      runInlineRedirectScript(
        {
          redirects: [
            {
              from: ['/docs/2022', '/docs/2023'],
              to: '/docs/2024',
            },
          ],
        },
        {
          pathname: '/docs/2023/guide',
          hash: '#install',
        },
      ).redirectedTo,
    ).toBe('/docs/2024/guide#install');
  });

  test('redirects to external URLs', () => {
    expect(
      runInlineRedirectScript(
        {
          redirects: [
            {
              from: '/docs/old',
              to: 'https://example.com/new',
            },
          ],
        },
        { pathname: '/docs/old' },
      ).redirectedTo,
    ).toBe('https://example.com/new');
  });

  test('supports sites configured with a base path', () => {
    expect(
      runInlineRedirectScript(
        {
          redirects: [{ from: '/docs/old', to: '/docs/new' }],
        },
        {
          pathname: '/base/docs/old',
          base: '/base/',
        },
      ).redirectedTo,
    ).toBe('/base/docs/new');
  });

  test('does not race another Rspress redirect', () => {
    expect(
      runInlineRedirectScript(
        {
          redirects: [{ from: '/docs/old', to: '/docs/new' }],
        },
        {
          pathname: '/docs/old',
          redirecting: true,
        },
      ).redirectedTo,
    ).toBeUndefined();
  });

  test('warns for invalid patterns and continues matching', () => {
    const result = runInlineRedirectScript(
      {
        redirects: [
          {
            from: ['[', '/docs/old'],
            to: '/docs/new',
          },
        ],
      },
      { pathname: '/docs/old' },
    );

    expect(result.redirectedTo).toBe('/docs/new');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0][0]).toBe('Invalid redirect pattern: [');
  });

  test('does not inject a script without redirect rules', () => {
    expect(getInlineRedirectScript()).toBe('');
    expect(getInlineRedirectScript({ redirects: [] })).toBe('');
  });

  test('escapes data that could close the inline script element', () => {
    const script = getInlineRedirectScript({
      redirects: [{ from: '</script>', to: '/docs/new' }],
    });

    expect(script).not.toContain('</script>');
    expect(script).toContain('\\u003c/script>');
  });

  test('isolates runtime variables in an IIFE', () => {
    const script = getInlineRedirectScript({
      redirects: [{ from: '/docs/old', to: '/docs/new' }],
    });

    expect(script.startsWith('(function() {')).toBe(true);
    expect(script.endsWith('})()')).toBe(true);
  });
});

describe('pluginClientRedirects', () => {
  test('only injects the redirect script in production', async () => {
    const plugin = pluginClientRedirects({
      redirects: [{ from: '/docs/old', to: '/docs/new' }],
    });
    const utils = {
      addPlugin: () => {},
      removePlugin: () => {},
    };

    await plugin.config?.({}, utils, false);
    expect(plugin.builderConfig).toBeUndefined();
    expect(plugin.globalUIComponents).toBeUndefined();

    await plugin.config?.({ base: '/base/' }, utils, true);
    expect(plugin.builderConfig?.html?.tags).toHaveLength(1);
    expect(plugin.globalUIComponents).toHaveLength(1);
    expect(JSON.stringify(plugin.builderConfig?.html?.tags)).toContain(
      'base = \\"/base\\"',
    );

    await plugin.config?.({}, utils, false);
    expect(plugin.builderConfig).toBeUndefined();
    expect(plugin.globalUIComponents).toBeUndefined();
  });
});
