import { ThemeContext, useSite } from '@rspress/core/runtime';
import { IconMoon, IconSun, SvgWrapper } from '@theme';
import { type MouseEvent, useContext } from 'react';
import './global.scss';
import './index.scss';
import { flushSync } from 'react-dom';

const supportAppearanceTransition = () => {
  return (
    typeof document?.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
};

// two view-transition name is conflicted, 'flip' and 'root', see https://github.com/web-infra-dev/rspress/pull/1272
const removeClipViewTransition = () => {
  const styleDom = document.createElement('style');
  styleDom.innerHTML = `
      .rspress-doc {
        view-transition-name: none !important;
      }
  `;
  document.head.appendChild(styleDom);
  return () => {
    document.head.removeChild(styleDom);
  };
};

export function SwitchAppearance({ onClick }: { onClick?: () => void }) {
  const { theme, setTheme = () => {} } = useContext(ThemeContext);
  const { site } = useSite();

  const handleClick = (event: MouseEvent) => {
    const supported = supportAppearanceTransition();
    const enabled = site?.themeConfig?.enableAppearanceAnimation;

    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const isDark = nextTheme === 'dark';

    if (supported && enabled) {
      const x = event.clientX;
      const y = event.clientY;

      const endRadius = Math.hypot(
        Math.max(x, innerWidth - x + 200),
        Math.max(y, innerHeight - y + 200),
      );

      const dispose = removeClipViewTransition();
      const transition = document.startViewTransition(async () => {
        flushSync(() => {
          setTheme(nextTheme);
          onClick?.();
        });
      });

      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      transition.ready.then(() => {
        document.documentElement
          .animate(
            {
              clipPath: isDark ? [...clipPath].reverse() : clipPath,
            },
            {
              duration: 400,
              easing: 'ease-in',
              pseudoElement: isDark
                ? '::view-transition-old(root)'
                : '::view-transition-new(root)',

              id: '',
            },
          )
          .finished.then(() => {
            dispose();
          });
      });
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
