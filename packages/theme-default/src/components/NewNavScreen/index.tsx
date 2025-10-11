import { useNav } from '@rspress/runtime';
import { SocialLinks } from '@theme';
import { clearAllBodyScrollLocks, disableBodyScroll } from 'body-scroll-lock';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import './index.scss';
import { NavScreenAppearance } from './NavScreenAppearance';
import { NavScreenLangs } from './NavScreenLangs';
import { NavScreenMenu } from './NavScreenMenu';
import { NavScreenVersions } from './NavScreenVersions';

export interface NavScreenProps {
  isScreenOpen: boolean;
  toggleScreen: () => void;
}

export function NavScreenDivider() {
  return <div className="rp-nav-screen-divider"></div>;
}

export function NavScreen(props: NavScreenProps) {
  const { isScreenOpen, toggleScreen } = props;
  const screen = useRef<HTMLDivElement | null>(null);
  const menuItems = useNav();

  useEffect(() => {
    if (screen.current && isScreenOpen) {
      disableBodyScroll(screen.current, { reserveScrollBarGap: true });
    }
    return () => {
      clearAllBodyScrollLocks();
    };
  }, [isScreenOpen]);

  return (
    <div
      className={clsx('rp-nav-screen', { 'rp-nav-screen--open': isScreenOpen })}
      ref={screen}
      onClick={toggleScreen}
    >
      <div
        className="rp-nav-screen__container"
        onClick={e => e.stopPropagation()}
      >
        <NavScreenMenu menuItems={menuItems} />
        <NavScreenDivider />
        <NavScreenAppearance />
        <NavScreenLangs />
        <NavScreenVersions />
        <NavScreenDivider />
        <SocialLinks />
      </div>
    </div>
  );
}
