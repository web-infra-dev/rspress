import { useSite } from '@rspress/core/runtime';
import {
  getDefaultDarkModeValue,
  isDarkModeSwitchEnabled,
} from '@rspress/shared';
import { useCallback, useLayoutEffect } from 'react';
import { useMediaQuery } from './useMediaQuery';
import { useStorageValue } from './useStorageValue';

const APPEARANCE_KEY = 'rspress-theme-appearance';
const MEDIA_QUERY = '(prefers-color-scheme: dark)';

type ThemeValue = 'dark' | 'light';
type ThemeConfigValue = ThemeValue | 'auto';

/**
 * @internal exported for testing
 */
export const applyThemeToDOM = (theme: ThemeValue) => {
  const root = document?.documentElement;
  if (!root) return;
  const isDark = theme === 'dark';
  // Suppress transitions only when the theme actually flips — the call after
  // hydration matches the DOM already set by the inline theme script, and the
  // suppression toggle forces two whole-document style recalcs.
  const changed = root.classList.contains('dark') !== isDark;
  if (changed) {
    // The `.rp-theme-switching` rule lives in base.css instead of an injected
    // <style> to stay compatible with strict CSP (style-src without
    // 'unsafe-inline').
    root.classList.add('rp-theme-switching');
  }
  root.classList.toggle('dark', isDark);
  root.classList.toggle('rp-dark', isDark);
  root.style.colorScheme = theme;
  if (changed) {
    // Force a style flush so the suppression applies before it is removed.
    window.getComputedStyle(root).opacity;
    requestAnimationFrame(() => {
      root.classList.remove('rp-theme-switching');
    });
  }
};

function useSystemTheme(): ThemeValue {
  const prefersDark = useMediaQuery(MEDIA_QUERY);
  const system = prefersDark ? 'dark' : 'light';
  return system;
}

/**
 * State provider for theme context.
 * @internal
 */
export function useThemeState(): readonly [
  ThemeValue,
  (value: ThemeValue) => void,
] {
  const { site } = useSite();
  const { darkMode } = site.themeConfig;
  const canSwitchDarkMode = isDarkModeSwitchEnabled(darkMode);
  const defaultThemeConfig = getDefaultDarkModeValue(darkMode);
  const [storedConfig, setStoredConfig] = useStorageValue<string>(
    APPEARANCE_KEY,
    defaultThemeConfig,
  );

  const validatedStoredConfig: ThemeConfigValue | null =
    storedConfig === 'light' ||
    storedConfig === 'dark' ||
    storedConfig === 'auto'
      ? storedConfig
      : null;

  const system = useSystemTheme();

  const themeConfigValue = canSwitchDarkMode
    ? (validatedStoredConfig ?? defaultThemeConfig)
    : defaultThemeConfig;

  const theme = themeConfigValue === 'auto' ? system : themeConfigValue;

  const setTheme = useCallback(
    (value: ThemeValue) => {
      if (!canSwitchDarkMode) return;

      setStoredConfig(system === value ? 'auto' : value);

      applyThemeToDOM(value);
    },
    [canSwitchDarkMode, system, setStoredConfig],
  );

  // Sync theme when storedConfig or system preference changes
  useLayoutEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  return [theme, setTheme] as const;
}
