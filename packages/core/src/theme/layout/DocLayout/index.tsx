import { useFrontmatter, useLocation } from '@rspress/core/runtime';
import {
  DocContent,
  DocFooter,
  Outline,
  Overview,
  Sidebar,
  useWatchToc,
} from '@theme';
import clsx from 'clsx';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useSidebarMenu } from '../../components/SidebarMenu/useSidebarMenu';
import './index.scss';

export interface DocLayoutProps {
  beforeSidebar?: React.ReactNode;
  afterSidebar?: React.ReactNode;
  beforeDocFooter?: React.ReactNode;
  afterDocFooter?: React.ReactNode;
  beforeDoc?: React.ReactNode;
  afterDoc?: React.ReactNode;
  beforeDocContent?: React.ReactNode;
  afterDocContent?: React.ReactNode;
  beforeOutline?: React.ReactNode;
  afterOutline?: React.ReactNode;
  navTitle?: React.ReactNode;
  components?: Record<string, React.FC>;
}

export function DocLayout(props: DocLayoutProps) {
  const {
    beforeDocFooter,
    afterDocFooter,
    beforeDoc,
    afterDoc,
    beforeDocContent,
    afterDocContent,
    beforeOutline,
    afterOutline,
    beforeSidebar,
    afterSidebar,
    components,
  } = props;
  const { frontmatter } = useFrontmatter();

  const isOverviewPage = frontmatter?.overview ?? false;

  const {
    sidebar: showSidebar = true,
    outline: showOutline = true,
    footer: showDocFooter = true,
    pageType,
  } = frontmatter;

  if (process.env.__SSR_MD__) {
    return (
      <>
        {isOverviewPage ? (
          <Overview
            content={<DocContent components={components} isOverviewPage />}
          />
        ) : (
          <DocContent components={components} />
        )}
      </>
    );
  }

  const isDocWide = pageType === 'doc-wide';

  const {
    isOutlineOpen,
    isSidebarOpen,
    sidebarMenu,
    asideLayoutRef,
    sidebarLayoutRef,
  } = useSidebarMenu();

  const { rspressDocRef } = useWatchToc();

  // Defer main content rendering on client-side navigation so the sidebar
  // commits to the DOM first, avoiding jank when pages are content-heavy.
  const { pathname } = useLocation();
  const [, startTransition] = useTransition();
  const [contentVisible, setContentVisible] = useState(true);
  const prevPathname = useRef(pathname);

  if (prevPathname.current !== pathname) {
    prevPathname.current = pathname;
    if (contentVisible) {
      setContentVisible(false);
    }
  }

  useEffect(() => {
    if (!contentVisible) {
      startTransition(() => {
        setContentVisible(true);
      });
    }
  }, [contentVisible]);

  const docContent = <DocContent components={components} />;

  return (
    <>
      <div className="rp-doc-layout__menu">{sidebarMenu}</div>
      {beforeDoc}
      <div className="rp-doc-layout__container">
        {/* Sidebar */}
        {showSidebar ? (
          <aside
            className={clsx(
              'rp-doc-layout__sidebar',
              isSidebarOpen && 'rp-doc-layout__sidebar--open',
              'rp-scrollbar',
            )}
            ref={sidebarLayoutRef}
          >
            {beforeSidebar}
            <Sidebar />
            {afterSidebar}
          </aside>
        ) : (
          <aside
            className="rp-doc-layout__sidebar-placeholder"
            style={isDocWide ? { width: '0' } : {}}
          ></aside>
        )}

        {/* Main document content */}
        {contentVisible ? (
          isOverviewPage ? (
            <>
              <main className="rp-doc-layout__overview">
                {beforeDocContent}
                <Overview
                  content={
                    <DocContent components={components} isOverviewPage />
                  }
                />
                {afterDocContent}
              </main>
            </>
          ) : (
            <div
              className={clsx(
                'rp-doc-layout__doc',
                isDocWide && 'rp-doc-layout__doc--wide',
              )}
            >
              <main className="rp-doc-layout__doc-container">
                {beforeDocContent}
                <div className="rp-doc rspress-doc" ref={rspressDocRef}>
                  {docContent}
                </div>
                {afterDocContent}
                {beforeDocFooter}
                {showDocFooter && <DocFooter />}
                {afterDocFooter}
              </main>
            </div>
          )
        ) : null}

        {/* Right outline */}
        {isOverviewPage ? null : showOutline ? (
          <aside
            className={clsx(
              'rp-doc-layout__outline',
              isOutlineOpen && 'rp-doc-layout__outline--open',
              'rp-scrollbar',
            )}
            ref={asideLayoutRef}
          >
            {beforeOutline}
            <Outline />
            {afterOutline}
          </aside>
        ) : (
          <aside
            className="rp-doc-layout__outline-placeholder"
            style={isDocWide ? { width: '0' } : {}}
          ></aside>
        )}
      </div>

      {afterDoc}
    </>
  );
}
