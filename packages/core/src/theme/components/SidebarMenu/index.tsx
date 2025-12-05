import { useFrontmatter, useI18n, useLocation } from '@rspress/core/runtime';
import {
  IconArrowRight,
  IconMenu,
  ReadPercent,
  renderInlineMarkdown,
  SvgWrapper,
  useActiveAnchor,
  useDynamicToc,
} from '@theme';
import { forwardRef, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './index.scss';

/* Top Menu, only displayed on <1280px screen width */
export const SidebarMenu = forwardRef(
  (
    {
      isSidebarOpen,
      onIsSidebarOpenChange,
      isOutlineOpen,
      onIsOutlineOpenChange,
    }: {
      isSidebarOpen: boolean;
      onIsSidebarOpenChange: (isOpen: boolean) => void;
      isOutlineOpen: boolean;
      onIsOutlineOpenChange: (isOpen: boolean) => void;
    },
    forwardedRef,
  ) => {
    const sidebarMenuRef = useRef<HTMLDivElement>(null);
    const t = useI18n();

    const { pathname, hash } = useLocation();

    const headers = useDynamicToc();
    const { scrolledHeader } = useActiveAnchor(headers);

    const {
      frontmatter: { sidebar: showSidebar = true, outline: showOutline = true },
    } = useFrontmatter();

    function openSidebar() {
      onIsSidebarOpenChange(true);
    }

    function closeSidebar() {
      onIsSidebarOpenChange(false);
    }

    function openOutline() {
      onIsOutlineOpenChange(!isOutlineOpen);
    }

    function closeOutline() {
      onIsOutlineOpenChange(false);
    }

    useEffect(() => {
      closeSidebar();
    }, [pathname]);

    useEffect(() => {
      if (hash) {
        closeOutline();
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
          {showSidebar ? (
            <button
              type="button"
              onClick={openSidebar}
              className="rp-sidebar-menu__left"
            >
              <SvgWrapper icon={IconMenu} />
              <span>{t('menuTitle')}</span>
            </button>
          ) : (
            <div className="rp-sidebar-menu__left" />
          )}
          {showOutline ? (
            <button
              type="button"
              disabled={headers.length === 0}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                openOutline();
              }}
              className="rp-sidebar-menu__right"
            >
              {scrolledHeader?.text ? (
                <span
                  className="rp-doc"
                  {...renderInlineMarkdown(scrolledHeader.text)}
                />
              ) : (
                <span>{t('outlineTitle')}</span>
              )}
              <ReadPercent size={14} strokeWidth={2} />
              {/* TODO: discussion */}
              {headers.length !== 0 && (
                <SvgWrapper
                  icon={IconArrowRight}
                  style={{
                    transform: isOutlineOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease-out',
                  }}
                />
              )}
            </button>
          ) : (
            <div className="rp-sidebar-menu__right" />
          )}
        </div>
        {(isSidebarOpen || isOutlineOpen) &&
          createPortal(
            <div onClick={closeSidebar} className="rp-sidebar-menu__mask" />,
            document.getElementById('__rspress_modal_container')!,
          )}
      </>
    );
  },
);
