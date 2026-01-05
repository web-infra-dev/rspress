import { useSite } from '@rspress/core/runtime';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  // useStorageValue handles cross-tab sync automatically
  const [storedConfig, setStoredConfig] = useStorageValue<ThemeConfigValue>(
    APPEARANCE_KEY,
    'auto',
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

    return resolveTheme(getStoredConfig());
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

  // Apply theme to DOM on mount and when theme or disableDarkMode changes
  useEffect(() => {
    applyThemeToDOM(disableDarkMode ? 'light' : theme);
  }, [theme, disableDarkMode]);

  // Listen for system theme changes (only in 'auto' mode)
  useEffect(() => {
    if (sanitize(storedConfig) !== 'auto' || disableDarkMode) return;

    const mediaQuery = window.matchMedia(MEDIA_QUERY);
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme: ThemeValue = e.matches ? 'dark' : 'light';
      setThemeInternal(newTheme);
      applyThemeToDOM(newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [storedConfig, disableDarkMode]);

  // Sync theme when storedConfig changes (from other tabs or useStorageValue init)
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
  }, [storedConfig, disableDarkMode]);

  return [theme, setTheme] as const;
};
