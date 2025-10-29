import { useFrontmatter } from '@rspress/core/runtime';
import { DocContent, Overview, useWatchToc } from '@theme';
import clsx from 'clsx';
import { DocFooter } from '../../components/DocFooter';
import { Outline } from '../../components/Outline';
import { Sidebar } from '../../components/Sidebar';
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
  } = frontmatter;

  const {
    isOutlineOpen,
    isSidebarOpen,
    sidebarMenu,
    asideLayoutRef,
    sidebarLayoutRef,
  } = useSidebarMenu();

  const rspressDocRef = useWatchToc();

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
          <aside className="rp-doc-layout__sidebar-placeholder"></aside>
        )}

        {/* Main document content */}
        {isOverviewPage ? (
          <>
            <main className="rp-doc-layout__overview">
              {beforeDocContent}
              <Overview
                content={<DocContent components={components} isOverviewPage />}
              />
              {afterDocContent}
            </main>
          </>
        ) : (
          <div className="rp-doc-layout__doc">
            <main className="rp-doc-layout__doc-container">
              {beforeDocContent}
              <div className="rp-doc rspress-doc" ref={rspressDocRef}>
                <DocContent components={components} />
              </div>
              {afterDocContent}
              {beforeDocFooter}
              {showDocFooter && <DocFooter />}
              {afterDocFooter}
            </main>
          </div>
        )}

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
          <aside className="rp-doc-layout__outline-placeholder"></aside>
        )}
      </div>

      {afterDoc}
    </>
  );
}
