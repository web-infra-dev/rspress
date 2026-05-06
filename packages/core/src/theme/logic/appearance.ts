/** Resolved theme value used in the app */
export type ThemeValue = 'light' | 'dark';
/** Theme config value stored in localStorage */
export type ThemeConfigValue = ThemeValue | 'auto';

export const getStoredThemeConfig = (
  theme: ThemeValue,
  prefersDark: boolean,
): ThemeConfigValue => {
  const systemTheme = prefersDark ? 'dark' : 'light';
  return theme === systemTheme ? 'auto' : theme;
};
