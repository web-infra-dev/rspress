import { useLocaleSiteData, useLocation, useSite } from '@rspress/runtime';
import MenuIcon from '@theme-assets/menu';
import { forwardRef, useEffect, useRef } from 'react';
import { useUISwitch } from '../../layout/Layout/useUISwitch';
import { ReadPercent } from '../ReadPercent';
import { SvgWrapper } from '../SvgWrapper';
import './index.scss';
import { useActiveAnchor } from '../Toc/useActiveAnchor';
import { useDynamicToc } from '../Toc/useDynamicToc';

/* Top Menu, only displayed on <1280px screen width */
export const SidebarMenu = forwardRef(
  (
    {
      isSidebarOpen,
      onIsSidebarOpenChange,
      isAsideOpen,
      onIsAsideOpenChange,
    }: {
      isSidebarOpen: boolean;
      onIsSidebarOpenChange: (isOpen: boolean) => void;
      isAsideOpen: boolean;
      onIsAsideOpenChange: (isOpen: boolean) => void;
    },
    forwardedRef,
  ) => {
    const uiSwitch = useUISwitch();
    const localesData = useLocaleSiteData();
    const {
      site: { themeConfig },
    } = useSite();
    const outlineTitle =
      localesData?.outlineTitle || themeConfig?.outlineTitle || 'ON THIS PAGE';

    const sidebarMenuRef = useRef<HTMLDivElement>(null);

    const { pathname, hash } = useLocation();

    const headers = useDynamicToc();
    const { lastAnchor } = useActiveAnchor(headers, false);

    function openSidebar() {
      onIsSidebarOpenChange(true);
    }

    function closeSidebar() {
      onIsSidebarOpenChange(false);
    }

    function openAside() {
      onIsAsideOpenChange(!isAsideOpen);
    }

    function closeAside() {
      onIsAsideOpenChange(false);
    }

    useEffect(() => {
      closeSidebar();
    }, [pathname]);

    useEffect(() => {
      if (hash) {
        closeAside();
      }
    }, [hash]);

    return (
      <>
        <div
          className="rp-sidebar-menu"
          ref={ref => {
            sidebarMenuRef.current = ref;
            if (typeof forwardedRef === 'function') {
              forwardedRef(sidebarMenuRef.current);
            } else if (forwardedRef) {
              forwardedRef.current = sidebarMenuRef.current;
            }
          }}
        >
          {uiSwitch?.showSidebar && (
            <button
              type="button"
              onClick={openSidebar}
              className="rp-sidebar-menu__left"
            >
              <SvgWrapper icon={MenuIcon} />
              <span>Menu</span>
            </button>
          )}
          {uiSwitch?.showAside && (
            <button
              type="button"
              disabled={headers.length === 0}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                openAside();
              }}
              className="rp-sidebar-menu__right"
            >
              <span>{lastAnchor?.text ?? outlineTitle}</span>
              <ReadPercent size={14} strokeWidth={2} />
              {/* TODO: discussion */}
              {/* <SvgWrapper
                icon={ArrowRight}
                style={{
                  transform: isAsideOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease-out',
                }}
              /> */}
            </button>
          )}
        </div>
        {(isSidebarOpen || isAsideOpen) && (
          <div onClick={closeSidebar} className="rp-sidebar-menu__mask" />
        )}
      </>
    );
  },
);
