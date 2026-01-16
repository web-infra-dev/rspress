import { useMemo } from 'react';
import INITIAL_CONTENT from '../../../packages/core/src/theme/styles/vars/shiki-vars.css?raw';
import {
  CssLiveCodeEditorWithSelect,
  type SelectOption,
} from './CssLiveCodeEditorWithSelect';
import shikiThemeCssVars from './shikiThemeCssVars.json';

export interface ThemeSwitcherProps {
  styleId?: string;
}

export function ShikiThemeSwitcher({
  styleId = 'theme-switcher-style',
}: ThemeSwitcherProps) {
  // Convert theme data to CSS options
  const themeOptions: SelectOption[] = useMemo(() => {
    return Object.entries(shikiThemeCssVars).map(([themeName, cssVars]) => {
      const cssCode = `:root {\n${Object.entries(cssVars)
        .map(([key, value]) => `  ${key}: ${value};`)
        .join('\n')}\n}`;

      return {
        label: themeName
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        code: cssCode,
      };
    });
  }, []);

  return (
    <CssLiveCodeEditorWithSelect
      options={themeOptions}
      styleId={styleId}
      initialCode={INITIAL_CONTENT}
    />
  );
}
