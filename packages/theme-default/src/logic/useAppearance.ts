import siteData from 'virtual-site-data';
import { APPEARANCE_KEY } from '@rspress/shared';
import { useCallback, useEffect, useState } from 'react';
import { useHandler } from './useHandler';
import { useMediaQuery } from './useMediaQuery';
import { useStorageValue } from './useStorageValue';

declare global {
  interface Window {
    MODERN_THEME?: string;
    RSPRESS_THEME?: string;
  }
}

// Value to be used in the app
type ThemeValue = 'light' | 'dark';
// Value to be stored
type ThemeConfigValue = ThemeValue | 'auto';

const sanitize = (value: string): ThemeConfigValue => {
  return ['light', 'dark', 'auto'].includes(value)
    ? (value as ThemeConfigValue)
    : 'auto';
};

const disableDarkMode = siteData.themeConfig.darkMode === false;

/**
 * State provider for theme context.
 */
export const useThemeState = () => {
  const matchesDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [storedTheme, setStoredTheme] = useStorageValue(APPEARANCE_KEY);

  const getPreferredTheme = useHandler(() => {
    if (disableDarkMode) {
      return 'light';
    }
    const sanitized = sanitize(storedTheme);
    return sanitized === 'auto' ? (matchesDark ? 'dark' : 'light') : sanitized;
  });

  const [theme, setThemeInternal] = useState<ThemeValue>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }
    // We set the RSPRESS_THEME as a global variable to determine whether the theme is dark or light.
    const defaultTheme = window.RSPRESS_THEME ?? window.MODERN_THEME;
    if (defaultTheme) {
      return defaultTheme === 'dark' ? 'dark' : 'light';
    }
    return getPreferredTheme();
  });
  const setTheme = useCallback(
    (value: ThemeValue, storeValue: ThemeConfigValue = value) => {
      if (disableDarkMode) {
        return;
      }
      setThemeInternal(value);
      setStoredTheme(storeValue);
      setSkipEffect(true);
    },
    [],
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  // Skip the first effect on mount, only run on updates
  const [skipEffect, setSkipEffect] = useState(true);
  useEffect(() => {
    setSkipEffect(false);
  }, [skipEffect]);

  // Update the theme when the localStorage changes
  useEffect(() => {
    if (skipEffect) {
      return;
    }
    setTheme(getPreferredTheme(), sanitize(storedTheme));
  }, [storedTheme]);

  // Update the theme when the OS theme changes
  useEffect(() => {
    if (skipEffect) {
      return;
    }
    setTheme(matchesDark ? 'dark' : 'light', 'auto');
  }, [matchesDark]);

  return [theme, setTheme] as const;
};
