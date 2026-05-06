import { createContext, useContext } from 'react';
import type {
  ThemeConfigValue,
  ThemeValue,
} from '../../theme/logic/appearance';

interface IThemeContext {
  theme: ThemeValue;
  setTheme?: (theme: ThemeValue, storeValue?: ThemeConfigValue) => void;
}

export const ThemeContext = createContext({} as IThemeContext);

export function useDark() {
  const ctx = useContext(ThemeContext);
  return ctx.theme === 'dark';
}
