import { useSite } from '@rspress/core/runtime';
import { useCallback, useEffect, useState } from 'react';

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

const getSystemTheme = (): ThemeValue => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light';
};

const resolveTheme = (config: ThemeConfigValue): ThemeValue => {
  return config === 'auto' ? getSystemTheme() : config;
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

  // Theme config stored in localStorage ('light' | 'dark' | 'auto')
  const [storedConfig, setStoredConfig] =
    useState<ThemeConfigValue>(getStoredConfig);

  // Resolved theme value ('light' | 'dark')
  const [theme, setThemeInternal] = useState<ThemeValue>(() => {
    if (typeof window === 'undefined') return 'light';
    if (disableDarkMode) return 'light';

    // Prefer global variable for SSR hydration
    const defaultTheme = window.RSPRESS_THEME ?? window.MODERN_THEME;
    if (defaultTheme) {
      return defaultTheme === 'dark' ? 'dark' : 'light';
    }

    return resolveTheme(getStoredConfig());
  });

  const setTheme = useCallback(
    (value: ThemeValue, storeValue: ThemeConfigValue = value) => {
      if (disableDarkMode) return;

      setThemeInternal(value);
      setStoredConfig(storeValue);
      applyThemeToDOM(value);

      try {
        localStorage.setItem(APPEARANCE_KEY, storeValue);
      } catch {
        // Silently fail when localStorage is not available
      }
    },
    [disableDarkMode],
  );

  // Apply theme to DOM on mount
  useEffect(() => {
    applyThemeToDOM(disableDarkMode ? 'light' : theme);
  }, []);

  // Listen for system theme changes (only in 'auto' mode)
  useEffect(() => {
    if (storedConfig !== 'auto' || disableDarkMode) return;

    const mediaQuery = window.matchMedia(MEDIA_QUERY);
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme: ThemeValue = e.matches ? 'dark' : 'light';
      setThemeInternal(newTheme);
      applyThemeToDOM(newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [storedConfig, disableDarkMode]);

  // Listen for localStorage changes (cross-tab sync)
  useEffect(() => {
    if (disableDarkMode) return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== APPEARANCE_KEY) return;

      const newConfig = sanitize(e.newValue);
      setStoredConfig(newConfig);

      const newTheme = resolveTheme(newConfig);
      setThemeInternal(newTheme);
      applyThemeToDOM(newTheme);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [disableDarkMode]);

  return [theme, setTheme] as const;
};
