import { ThemeContext, useSite } from '@rspress/core/runtime';
import { IconMoon, IconSun, SvgWrapper } from '@rspress/core/theme';
import { type MouseEvent, useContext } from 'react';
import './global.scss';
import './index.scss';
import { flushSync } from 'react-dom';
import { getClipPath } from './getClipPath';

const supportAppearanceTransition = () => {
  return (
    typeof document?.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
};

// Shared by all appearance switches, including the desktop and mobile menus.
let isAppearanceTransitioning = false;

export function SwitchAppearance({ onClick }: { onClick?: () => void }) {
  const { theme, setTheme = () => {} } = useContext(ThemeContext);
  const { site } = useSite();

  const handleClick = (event: MouseEvent) => {
    if (isAppearanceTransitioning) {
      return;
    }

    const supported = supportAppearanceTransition();
    const enabled = site?.themeConfig?.enableAppearanceAnimation;

    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    if (supported && enabled) {
      isAppearanceTransitioning = true;
      const x = event.clientX;
      const y = event.clientY;
      const clipPath = getClipPath({
        height: innerHeight,
        width: innerWidth,
        x,
        y,
      });
      const root = document.documentElement;
      root.style.setProperty('--rp-vt-clip-start', clipPath[0]);
      root.style.setProperty('--rp-vt-clip-end', clipPath[1]);
      root.classList.add('rp-appearance-transition');

      const cleanup = () => {
        root.classList.remove('rp-appearance-transition');
        root.style.removeProperty('--rp-vt-clip-start');
        root.style.removeProperty('--rp-vt-clip-end');
        isAppearanceTransitioning = false;
      };

      let updated = false;
      const updateTheme = () => {
        updated = true;
        flushSync(() => {
          setTheme(nextTheme);
          onClick?.();
        });
      };

      try {
        const transition = document.startViewTransition(async () => {
          updateTheme();
        });
        transition.updateCallbackDone.catch(() => {
          transition.skipTransition();
        });
        transition.ready.catch(() => {
          // Skipping still runs the update callback. Keep ownership until
          // finished settles so a late callback cannot race another switch.
          transition.skipTransition();
        });
        transition.finished.then(cleanup, cleanup);
      } catch {
        cleanup();
        if (!updated) {
          updateTheme();
        }
      }
    } else {
      setTheme(nextTheme);
      onClick?.();
    }
  };

  return (
    <div onClick={handleClick} className="rp-switch-appearance">
      <SvgWrapper
        className="rp-switch-appearance__icon rp-switch-appearance__icon--sun"
        icon={IconSun}
        fill="currentColor"
      />
      <SvgWrapper
        className="rp-switch-appearance__icon rp-switch-appearance__icon--moon"
        icon={IconMoon}
        fill="currentColor"
      />
    </div>
  );
}
