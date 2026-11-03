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
    const isDark = nextTheme === 'dark';

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
      root.classList.add('rp-appearance-transition');

      // Clip the new light snapshot before the animation is attached.
      if (!isDark) {
        root.style.setProperty('--rp-vt-clip-initial', clipPath[0]);
        root.classList.add('rp-transition-dark-to-light');
      }

      let animation: Animation | undefined;
      let cleaned = false;
      const cleanup = () => {
        if (cleaned) {
          return;
        }
        cleaned = true;
        animation?.cancel();
        root.classList.remove('rp-appearance-transition');
        root.classList.remove('rp-transition-dark-to-light');
        root.style.removeProperty('--rp-vt-clip-initial');
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
        transition.ready
          .then(() => {
            if (cleaned) {
              return;
            }
            animation = root.animate(
              {
                clipPath: isDark ? [...clipPath].reverse() : clipPath,
              },
              {
                duration: 400,
                easing: 'ease-in',
                fill: 'both',
                pseudoElement: isDark
                  ? '::view-transition-old(root)'
                  : '::view-transition-new(root)',
              },
            );
          })
          .catch(() => {
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
