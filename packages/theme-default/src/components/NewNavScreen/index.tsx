import { useNav } from '@rspress/runtime';
import { clearAllBodyScrollLocks, disableBodyScroll } from 'body-scroll-lock';
import { useEffect, useRef } from 'react';
import './index.scss';
import { NavScreenMenu } from './NavScreenMenu';
import { NavScreenMenuOthers } from './NavScreenMenuOthers';

export interface NavScreenProps {
  isScreenOpen: boolean;
  toggleScreen: () => void;
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
      className={`rp-nav-screen ${isScreenOpen ? 'rp-nav-screen--active' : ''}`}
      ref={screen}
      onClick={toggleScreen}
    >
      <div
        className="rp-nav-screen__container"
        onClick={(e) => e.stopPropagation()}
      >
        <NavScreenMenu menuItems={menuItems} />
        <NavScreenMenuOthers />
      </div>
    </div>
  );
}
