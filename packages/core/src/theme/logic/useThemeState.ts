import { useSite } from '@rspress/core/runtime';
import { useCallback, useEffect, useMemo } from 'react';
import { useMediaQuery } from './useMediaQuery';
import { useStorageValue } from './useStorageValue';

declare global {
  interface Window {
    MODERN_THEME?: string;
    RSPRESS_THEME?: string;
  }
}

// ============================================================================
// Constants
// ============================================================================

const APPEARANCE_KEY = 'rspress-theme-appearance';
const MEDIA_QUERY = '(prefers-color-scheme: dark)';

// ============================================================================
// Types
// ============================================================================

/** Resolved theme value used in the app */
type ThemeValue = 'light' | 'dark';
/** Theme config value stored in localStorage */
type ThemeConfigValue = ThemeValue | 'auto';

// ============================================================================
// Utils
// ============================================================================

const applyThemeToDOM = (theme: ThemeValue) => {
  if (!document || !document.documentElement) return;
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('rp-dark', theme === 'dark');
  root.style.colorScheme = theme;
};

// ============================================================================
// Hook
// ============================================================================

/**
 * State provider for theme context.
 * @internal
 */
export function useThemeState() {
  const { site } = useSite();
  const disableDarkMode = site.themeConfig.darkMode === false;

  // System theme preference (auto-updates on change)
  const prefersDark = useMediaQuery(MEDIA_QUERY);

  // Theme config stored in localStorage ('light' | 'dark' | 'auto')
  // useStorageValue handles cross-tab sync automatically
  const [storedConfig, setStoredConfig] = useStorageValue<ThemeConfigValue>(
    APPEARANCE_KEY,
    'auto',
  );

  // Resolve theme based on config and system preference
  const resolvedTheme = useMemo((): ThemeValue => {
    if (typeof window === 'undefined') return 'light';
    if (disableDarkMode) return 'light';

    // Prefer global variable for SSR hydration
    const defaultTheme = window.RSPRESS_THEME;
    if (defaultTheme) {
      return defaultTheme === 'dark' ? 'dark' : 'light';
    }

    return storedConfig === 'auto'
      ? prefersDark
        ? 'dark'
        : 'light'
      : storedConfig;
  }, [disableDarkMode, prefersDark, storedConfig]);

  const setTheme = useCallback(
    (value: ThemeValue, storeValue: ThemeConfigValue = value) => {
      if (disableDarkMode) return;

      setStoredConfig(storeValue);
      applyThemeToDOM(value);
    },
    [disableDarkMode, setStoredConfig],
  );

  // Sync theme when storedConfig or system preference changes
  useEffect(() => {
    if (disableDarkMode) return;

    applyThemeToDOM(resolvedTheme);
  }, [disableDarkMode, resolvedTheme]);

  return [resolvedTheme, setTheme] as const;
}
