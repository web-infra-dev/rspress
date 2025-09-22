import { useFrontmatter } from '@rspress/runtime';
// import { SidebarMenu } from '../../components/SidebarMenu';
import { DocContent, Overview } from '@theme';
import { useState } from 'react';
import { Aside } from '../../components/Aside';
import { DocFooter } from '../../components/DocFooter';
import { Sidebar } from '../../components/Sidebar';
import type { UISwitchResult } from '../../logic/useUISwitch';
import './DocLayout.scss';
import clsx from 'clsx';
import { useWatchToc } from '../../components/Aside/useDynamicToc';
import { SidebarMenu } from '../../components/SidebarMenu';

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
  uiSwitch?: UISwitchResult;
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
    uiSwitch,
    navTitle,
    components,
  } = props;
  const { frontmatter } = useFrontmatter();

  const isOverviewPage = frontmatter?.overview ?? false;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const rspressDocRef = useWatchToc();

  return (
    <>
      {beforeDoc}
      <div className="rp-doc-layout">
        {/* Sidebar */}
        {uiSwitch?.showSidebar && (
          <aside
            className={clsx(
              'rp-doc-layout__sidebar',
              isSidebarOpen && 'rp-doc-layout__sidebar--open',
            )}
          >
            <Sidebar
              isSidebarOpen={isSidebarOpen}
              beforeSidebar={beforeSidebar}
              afterSidebar={afterSidebar}
              uiSwitch={uiSwitch}
              navTitle={navTitle}
            />
          </aside>
        )}

        {/* Main document content */}
        <div className="rp-doc-layout__doc-container">
          <div className="rp-doc-layout__menu">
            <SidebarMenu
              isSidebarOpen={isSidebarOpen}
              onIsSidebarOpenChange={setIsSidebarOpen}
              uiSwitch={uiSwitch}
            />
            {/* Menu sidebar for mobile */}
            <div className="rp-doc-layout__menu-sidebar">
              {/* Mobile sidebar content */}
            </div>

            {/* Menu aside for mobile */}
            <div className="rp-doc-layout__menu-aside">
              {/* Mobile aside content */}
            </div>
          </div>
          <main className="rp-doc-layout__doc">
            {isOverviewPage ? (
              <>
                {beforeDocContent}
                <Overview content={<DocContent components={components} />} />
                {afterDocContent}
              </>
            ) : (
              <>
                {beforeDocContent}
                <div className="rp-doc rspress-doc" ref={rspressDocRef}>
                  <DocContent components={components} />
                </div>
                {afterDocContent}
                {beforeDocFooter}
                {uiSwitch?.showDocFooter && <DocFooter />}
                {afterDocFooter}
              </>
            )}
          </main>

          {/* Right aside */}
        </div>
        {uiSwitch?.showAside && (
          <aside className="rp-doc-layout__aside">
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
