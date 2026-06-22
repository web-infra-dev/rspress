import type { DarkMode, NormalizedDarkMode } from '../types/theme';

export type DarkModeDefaultValue = 'light' | 'dark' | 'auto';

export const normalizeDarkMode = (
  darkMode: DarkMode | undefined,
): NormalizedDarkMode => {
  if (darkMode === false) {
    return 'force-light';
  }

  if (darkMode === true || darkMode === undefined) {
    return 'auto';
  }

  return darkMode;
};

export const getDefaultDarkModeValue = (
  darkMode: DarkMode | undefined,
): DarkModeDefaultValue => {
  const normalizedDarkMode = normalizeDarkMode(darkMode);

  if (normalizedDarkMode.startsWith('force-')) {
    return normalizedDarkMode.slice('force-'.length) as DarkModeDefaultValue;
  }

  return normalizedDarkMode as DarkModeDefaultValue;
};

export const isDarkModeSwitchEnabled = (
  darkMode: DarkMode | undefined,
): boolean => !normalizeDarkMode(darkMode).startsWith('force-');
