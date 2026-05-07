import { useSite } from '@rspress/core/runtime';
import { useCallback, useLayoutEffect } from 'react';
import { useMediaQuery } from './useMediaQuery';
import { useStorageValue } from './useStorageValue';

// ============================================================================
// Constants
// ============================================================================

const APPEARANCE_KEY = 'rspress-theme-appearance';
const MEDIA_QUERY = '(prefers-color-scheme: dark)';

// ============================================================================
// Types
// ============================================================================

/** Resolved theme value used in the app */
export type ThemeValue = 'light' | 'dark';
/** Theme config value stored in localStorage */
export type ThemeConfigValue = ThemeValue | 'auto';

// ============================================================================
// Utils
// ============================================================================

const getSystemTheme = (prefersDark: boolean): ThemeValue =>
  prefersDark ? 'dark' : 'light';

export const getStoredThemeConfig = (
  theme: ThemeValue,
  prefersDark: boolean,
): ThemeConfigValue => {
  const systemTheme = getSystemTheme(prefersDark);
  return theme === systemTheme ? 'auto' : theme;
};

export const getResolvedTheme = (
  config: ThemeConfigValue,
  prefersDark: boolean,
): ThemeValue => (config === 'auto' ? getSystemTheme(prefersDark) : config);

const applyThemeToDOM = (theme: ThemeValue) => {
  if (!document?.documentElement) return;
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('rp-dark', theme === 'dark');
  root.style.colorScheme = theme;
};

/**
 * State provider for theme context.
 * @internal
 */
export function useThemeState() {
  const { site } = useSite();
  const disableDarkMode = site.themeConfig.darkMode === false;
  const prefersDark = useMediaQuery(MEDIA_QUERY);
  const [storedConfig, setStoredConfig] = useStorageValue<ThemeConfigValue>(
    APPEARANCE_KEY,
    'auto',
  );

  const theme = disableDarkMode
    ? 'light'
    : getResolvedTheme(storedConfig, prefersDark);

  const setTheme = useCallback(
    (value: ThemeValue) => {
      if (disableDarkMode) return;

      setStoredConfig(getStoredThemeConfig(value, prefersDark));
      applyThemeToDOM(value);
    },
    [disableDarkMode, prefersDark, setStoredConfig],
  );

  // Sync theme when storedConfig or system preference changes
  useLayoutEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  return [theme, setTheme] as const;
}
