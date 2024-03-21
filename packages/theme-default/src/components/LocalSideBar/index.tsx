import { Fragment, useEffect, useRef, useState } from 'react';
import { useLocation } from '@rspress/runtime';
import MenuIcon from '@theme-assets/menu';
import ArrowRight from '@theme-assets/arrow-right';
import { Sidebar, Toc } from '@theme';
import './index.scss';
import { UISwitchResult } from '../../logic/useUISwitch';
import { SvgWrapper } from '../SvgWrapper';
import { CSSTransition } from 'react-transition-group';

export function SideMenu({
  beforeSidebar,
  afterSidebar,
  uiSwitch,
}: {
  beforeSidebar?: React.ReactNode;
  afterSidebar?: React.ReactNode;
  uiSwitch?: UISwitchResult;
}) {
  const [isSidebarOpen, setSidebarIsOpen] = useState<boolean>(false);
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);
  const tocContainerRef = useRef<HTMLDivElement>();
  const outlineButtonRef = useRef<HTMLButtonElement>();
  const { pathname } = useLocation();

  function openSidebar() {
    setSidebarIsOpen(true);
  }

  function closeSidebar() {
    setSidebarIsOpen(false);
  }

  useEffect(() => {
    setSidebarIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.addEventListener('mouseup', handleClickOutsideForToc);
    document.addEventListener('touchend', handleClickOutsideForToc);

    return () => {
      document.addEventListener('mouseup', handleClickOutsideForToc);
      document.removeEventListener('touchend', handleClickOutsideForToc);
    };
  }, []);

  const handleClickOutsideForToc = e => {
    const { current: tocContainer } = tocContainerRef;
    if (outlineButtonRef.current.contains(e.target)) {
      return;
    }

    if (tocContainer && !tocContainer.contains(e.target)) {
      setIsTocOpen(false);
    }
  };

  return (
    <Fragment>
      {/* Top Menu, only displayed in mobile device */}
      <div className="rspress-sidebar-menu">
        <button onClick={openSidebar} className="flex-center">
          <div className="text-md mr-2">
            <SvgWrapper icon={MenuIcon} />
          </div>
          <span className="text-sm">Menu</span>
        </button>
        <button
          onClick={() => setIsTocOpen(tocOpened => !tocOpened)}
          className="flex-center"
          ref={outlineButtonRef}
        >
          <span className="text-sm">On this page</span>
          <div
            className="text-md mr-2"
            style={{
              transform: isTocOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease-out',
              marginTop: '2px',
            }}
          >
            <SvgWrapper icon={ArrowRight} />
          </div>
        </button>

        <CSSTransition
          in={isTocOpen}
          timeout={300}
          unmountOnExit
          classNames="fly-in"
          nodeRef={tocContainerRef}
        >
          <div className="rspress-local-toc-container" ref={tocContainerRef}>
            <Toc
              onItemClick={() => {
                setIsTocOpen(false);
              }}
            />
          </div>
        </CSSTransition>
      </div>
      {/* Sidebar Component */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        beforeSidebar={beforeSidebar}
        afterSidebar={afterSidebar}
        uiSwitch={uiSwitch}
      />
      {isSidebarOpen ? (
        <div
          onClick={closeSidebar}
          className="rspress-sidebar-back-drop"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
          }}
        />
      ) : null}
    </Fragment>
  );
}
