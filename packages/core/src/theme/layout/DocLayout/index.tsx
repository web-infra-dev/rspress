import { useFrontmatter } from '@rspress/core/runtime';
import { DocContent, Overview, useWatchToc } from '@theme';
import clsx from 'clsx';
import { Aside } from '../../components/Aside';
import { DocFooter } from '../../components/DocFooter';
import { Sidebar } from '../../components/Sidebar';
import { useSidebarMenu } from '../../components/SidebarMenu/useSidebarMenu';
import { useUISwitch } from '../Layout/useUISwitch';
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
    isAsideOpen,
    isSidebarOpen,
    sidebarMenu,
    asideLayoutRef,
    sidebarLayoutRef,
  } = useSidebarMenu();

  const rspressDocRef = useWatchToc();

  const uiSwitch = useUISwitch();

  return (
    <>
      <div className="rp-doc-layout__menu">{sidebarMenu}</div>
      {beforeDoc}
      <div className="rp-doc-layout__container">
        {/* Sidebar */}
        {uiSwitch?.showSidebar && (
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
              {uiSwitch?.showDocFooter && <DocFooter />}
              {afterDocFooter}
            </main>
          </div>
        )}

        {/* Right aside */}
        {uiSwitch?.showAside && !isOverviewPage && (
          <aside
            className={clsx(
              'rp-doc-layout__aside',
              isAsideOpen && 'rp-doc-layout__aside--open',
              'rp-scrollbar',
            )}
            ref={asideLayoutRef}
          >
            {beforeOutline}
            <Aside />
            {afterOutline}
          </aside>
        )}
      </div>

      {afterDoc}
    </>
  );
}
