import { createContext, useContext } from 'react';

interface IThemeContext {
  theme: 'light' | 'dark';
  setTheme?: (theme: 'light' | 'dark') => void;
}

export const ThemeContext = createContext({} as IThemeContext);

export function useDark() {
  const ctx = useContext(ThemeContext);
  return ctx.theme === 'dark';
}
