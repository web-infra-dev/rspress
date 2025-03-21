import { useLocation, usePageData } from '@rspress/runtime';
import ArrowRight from '@theme-assets/arrow-right';
import MenuIcon from '@theme-assets/menu';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { UISwitchResult } from '../../logic/useUISwitch';
import { SvgWrapper } from '../SvgWrapper';
import { Toc } from '../Toc';
import './index.scss';

/* Top Menu, only displayed on <1280px screen width */
export function SidebarMenu({
  isSidebarOpen,
  onIsSidebarOpenChange,
  outlineTitle,
  uiSwitch,
}: {
  isSidebarOpen: boolean;
  onIsSidebarOpenChange: (isOpen: boolean) => void;
  outlineTitle: string;
  uiSwitch?: UISwitchResult;
}) {
  const { page } = usePageData();
  const tocContainerRef = useRef<HTMLDivElement>(null);
  const outlineButtonRef = useRef<HTMLButtonElement>(null);

  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);

  const { pathname } = useLocation();

  function openSidebar() {
    onIsSidebarOpenChange(true);
  }

  function closeSidebar() {
    onIsSidebarOpenChange(false);
  }

  useEffect(() => {
    onIsSidebarOpenChange(false);
  }, [pathname]);

  useEffect(() => {
    document.addEventListener('mouseup', handleClickOutsideForToc);
    document.addEventListener('touchend', handleClickOutsideForToc);

    return () => {
      document.addEventListener('mouseup', handleClickOutsideForToc);
      document.removeEventListener('touchend', handleClickOutsideForToc);
    };
  }, []);

  const handleClickOutsideForToc = useCallback((e: MouseEvent | TouchEvent) => {
    const { current: outlineButton } = outlineButtonRef;
    if (outlineButton?.contains(e.target as Node)) {
      return;
    }

    const { current: tocContainer } = tocContainerRef;
    if (tocContainer && !tocContainer.contains(e.target as Node)) {
      setIsTocOpen(false);
    }
  }, []);

  const toggleTocItem = useCallback(() => {
    setIsTocOpen(false);
  }, []);

  const hasToc = page.toc.length > 0;

  return (
    <div className={`rspress-sidebar-menu-container ${hasToc ? '' : 'no-toc'}`}>
      <div className="rspress-sidebar-menu">
        {uiSwitch?.showSidebar && (
          <>
            <button
              type="button"
              onClick={openSidebar}
              className="rp-flex-center rp-mr-auto"
            >
              <div className="rp-text-md rp-mr-2">
                <SvgWrapper icon={MenuIcon} />
              </div>
              <span className="rp-text-sm">Menu</span>
            </button>
            {isSidebarOpen && (
              <div
                onClick={closeSidebar}
                className="rspress-sidebar-back-drop"
                style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                }}
              />
            )}
          </>
        )}
        {uiSwitch?.showAside && hasToc && (
          <>
            <button
              type="button"
              onClick={() => setIsTocOpen(tocOpened => !tocOpened)}
              className="rp-flex-center rp-ml-auto"
              ref={outlineButtonRef}
            >
              <span className="rp-text-sm">{outlineTitle}</span>
              <div
                className="rp-text-md rp-mr-2"
                style={{
                  transform: isTocOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease-out',
                  marginTop: '2px',
                }}
              >
                <SvgWrapper icon={ArrowRight} />
              </div>
            </button>

            <div
              className={`rspress-local-toc-container ${isTocOpen ? 'rspress-local-toc-container-show' : ''}`}
            >
              <Toc onItemClick={toggleTocItem} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
