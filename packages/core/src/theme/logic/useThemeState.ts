import { useSite } from '@rspress/core/runtime';
import { useCallback, useEffect, useRef, useState } from 'react';
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

const sanitize = (value: string | null): ThemeConfigValue => {
  if (value === 'light' || value === 'dark' || value === 'auto') {
    return value;
  }
  return 'auto';
};

const getStoredConfig = (): ThemeConfigValue => {
  if (typeof window === 'undefined') return 'auto';
  try {
    return sanitize(localStorage.getItem(APPEARANCE_KEY));
  } catch {
    return 'auto';
  }
};

const applyThemeToDOM = (theme: ThemeValue) => {
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
export const useThemeState = () => {
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
  const resolveTheme = useCallback(
    (config: ThemeConfigValue): ThemeValue => {
      if (disableDarkMode) return 'light';
      return config === 'auto' ? (prefersDark ? 'dark' : 'light') : config;
    },
    [disableDarkMode, prefersDark],
  );

  // Resolved theme value ('light' | 'dark')
  const [theme, setThemeInternal] = useState<ThemeValue>(() => {
    if (typeof window === 'undefined') return 'light';
    if (disableDarkMode) return 'light';

    // Prefer global variable for SSR hydration
    const defaultTheme = window.RSPRESS_THEME ?? window.MODERN_THEME;
    if (defaultTheme) {
      return defaultTheme === 'dark' ? 'dark' : 'light';
    }

    const config = getStoredConfig();
    return config === 'auto'
      ? window.matchMedia(MEDIA_QUERY).matches
        ? 'dark'
        : 'light'
      : config;
  });

  // Track if setTheme was called locally to avoid redundant updates
  const isLocalUpdate = useRef(false);

  const setTheme = useCallback(
    (value: ThemeValue, storeValue: ThemeConfigValue = value) => {
      if (disableDarkMode) return;

      isLocalUpdate.current = true;
      setThemeInternal(value);
      setStoredConfig(storeValue);
      applyThemeToDOM(value);
    },
    [disableDarkMode, setStoredConfig],
  );

  // Apply theme to DOM on mount and when theme changes
  useEffect(() => {
    applyThemeToDOM(disableDarkMode ? 'light' : theme);
  }, [theme, disableDarkMode]);

  // Sync theme when storedConfig or system preference changes
  useEffect(() => {
    // Skip if this was a local update (already handled in setTheme)
    if (isLocalUpdate.current) {
      isLocalUpdate.current = false;
      return;
    }

    if (disableDarkMode) return;

    const newTheme = resolveTheme(sanitize(storedConfig));
    setThemeInternal(newTheme);
    applyThemeToDOM(newTheme);
  }, [storedConfig, prefersDark, disableDarkMode, resolveTheme]);

  return [theme, setTheme] as const;
};
