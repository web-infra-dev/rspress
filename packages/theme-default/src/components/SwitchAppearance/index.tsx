import { useContext, useEffect } from 'react';
import { ThemeContext } from '@rspress/runtime';
import SunSvg from '@theme-assets/sun';
import MoonSvg from '@theme-assets/moon';
import {
  getToggle,
  isDarkMode,
  updateUserPreferenceFromStorage,
} from '../../logic/useAppearance';
import { SvgWrapper } from '../SvgWrapper';

export function SwitchAppearance({ onClick }: { onClick?: () => void }) {
  const { theme, setTheme } = useContext(ThemeContext);
  const toggleAppearance = getToggle();
  const updateAppearanceAndTheme = () => {
    const isDark = updateUserPreferenceFromStorage();
    setTheme(isDark ? 'dark' : 'light');
  };

  useEffect(() => {
    if (isDarkMode()) {
      setTheme('dark');
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', updateAppearanceAndTheme);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', updateAppearanceAndTheme);
      }
    };
  }, []);

  return (
    <div
      onClick={() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        toggleAppearance();
        onClick?.();
      }}
      className="md:mr-2 rspress-nav-appearance"
    >
      <div className="p-1 border border-solid border-gray-300 text-gray-400  cursor-pointer rounded-md hover:border-gray-600 hover:text-gray-600 dark:hover:border-gray-200 dark:hover:text-gray-200 transition-all duration-300">
        <SvgWrapper
          icon={theme === 'light' ? SunSvg : MoonSvg}
          width="18"
          height="18"
          fill="currentColor"
        />
      </div>
    </div>
  );
}
