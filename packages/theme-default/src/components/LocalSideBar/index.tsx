import { Fragment, useEffect, useRef, useState } from 'react';
import { useLocation } from '@rspress/runtime';
import MenuIcon from '@theme-assets/menu';
import ArrowRight from '@theme-assets/arrow-right';
import { SideBar } from '../Sidebar';
import './index.scss';
import { Toc } from '../Toc';
import { UISwitchResult } from '#theme/logic/useUISwitch';
import { SvgWrapper } from '../SvgWrapper';

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
        >
          <span className="text-sm">On this page</span>
          <div className="text-md mr-2">
            <SvgWrapper icon={ArrowRight} />
          </div>
        </button>
        <div
          className="rspress-local-toc-container"
          style={{
            display: isTocOpen ? 'block' : 'none',
          }}
          ref={tocContainerRef}
        >
          <Toc />
        </div>
      </div>
      {/* Sidebar Component */}
      <SideBar
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
