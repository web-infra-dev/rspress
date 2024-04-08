import { useContext } from 'react';
import { ThemeContext } from '@rspress/runtime';
import SunSvg from '@theme-assets/sun';
import MoonSvg from '@theme-assets/moon';
import { SvgWrapper } from '../SvgWrapper';

export function SwitchAppearance({ onClick }: { onClick?: () => void }) {
  const { theme, setTheme } = useContext(ThemeContext);

  return (
    <div
      onClick={() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        onClick?.();
      }}
      className="md:mr-2 rspress-nav-appearance"
    >
      <div className="p-1 border border-solid border-gray-300 text-gray-400  cursor-pointer rounded-md hover:border-gray-600 hover:text-gray-600 dark:hover:border-gray-200 dark:hover:text-gray-200 transition-all duration-300 w-7 h-7">
        <SvgWrapper
          className="dark:hidden"
          icon={SunSvg}
          width="18"
          height="18"
          fill="currentColor"
        />
        <SvgWrapper
          className="hidden dark:block"
          icon={MoonSvg}
          width="18"
          height="18"
          fill="currentColor"
        />
      </div>
    </div>
  );
}
