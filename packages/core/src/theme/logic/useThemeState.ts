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

const applyThemeToDOM = (theme: ThemeValue) => {
  if (!document?.documentElement) return;
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('rp-dark', theme === 'dark');
  root.style.colorScheme = theme;
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
