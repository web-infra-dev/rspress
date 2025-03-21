import { MDXProvider } from '@mdx-js/react';
import { Content, NoSSR, usePageData } from '@rspress/runtime';
import { Overview, ScrollToTop, getCustomMDXComponent } from '@theme';
import { slug } from 'github-slugger';
import { useMemo, useState } from 'react';
import { Aside } from '../../components/Aside';
import { DocFooter } from '../../components/DocFooter';
import { Sidebar } from '../../components/Sidebar';
import { SidebarMenu } from '../../components/SidebarMenu';
import { TabDataContext } from '../../logic/TabDataContext';
import { useLocaleSiteData } from '../../logic/useLocaleSiteData';
import type { UISwitchResult } from '../../logic/useUISwitch';
import { A } from './docComponents/a';
import { H1 } from './docComponents/title';
import * as styles from './index.module.scss';

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
  const { siteData, page } = usePageData();
  const { headingTitle, title, toc = [], frontmatter } = page;
  const [tabData, setTabData] = useState({});
  const headers = toc;
  const { themeConfig } = siteData;
  const enableScrollToTop = themeConfig.enableScrollToTop ?? false;
  const localesData = useLocaleSiteData();

  const outlineTitle =
    localesData?.outlineTitle || themeConfig?.outlineTitle || 'ON THIS PAGE';
  const isOverviewPage = frontmatter?.overview ?? false;

  const mdxComponents = { ...getCustomMDXComponent(), ...components };

  const docContent = (
    <TabDataContext.Provider value={{ tabData, setTabData }}>
      <MDXProvider components={mdxComponents}>
        <Content />
      </MDXProvider>
    </TabDataContext.Provider>
  );

  const fallbackTitle = useMemo(() => {
    const titleSlug = title && slug(title);
    return (
      siteData.themeConfig.fallbackHeadingTitle !== false &&
      !headingTitle &&
      titleSlug && (
        <H1 id={titleSlug}>
          {title}
          <A className="header-anchor" href={`#${titleSlug}`} aria-hidden>
            #
          </A>
        </H1>
      )
    );
  }, [headingTitle, title, siteData.themeConfig.fallbackHeadingTitle]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div
      className={`${styles.docLayout} rp-pt-0`}
      style={{
        ...(uiSwitch?.showNavbar ? {} : { marginTop: 0 }),
      }}
    >
      {beforeDoc}
      {uiSwitch?.showSidebar && (
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          beforeSidebar={beforeSidebar}
          afterSidebar={afterSidebar}
          uiSwitch={uiSwitch}
          navTitle={navTitle}
        />
      )}
      <div className="rp-flex-1 rp-relative rp-min-w-0">
        <SidebarMenu
          isSidebarOpen={isSidebarOpen}
          onIsSidebarOpenChange={setIsSidebarOpen}
          outlineTitle={outlineTitle}
          uiSwitch={uiSwitch}
        />
        <div className={`${styles.content} rspress-doc-container rp-flex`}>
          <div
            className={`rp-flex-1 ${isOverviewPage ? '' : 'rp-overflow-x-auto'}`}
          >
            {isOverviewPage ? (
              <>
                {beforeDocContent}
                <Overview content={docContent} />
                {afterDocContent}
              </>
            ) : (
              <>
                <div className="rspress-doc">
                  {beforeDocContent}
                  {fallbackTitle}
                  {docContent}
                  {afterDocContent}
                </div>
                <div className="rspress-doc-footer">
                  {beforeDocFooter}
                  {uiSwitch?.showDocFooter && <DocFooter />}
                  {afterDocFooter}
                </div>
              </>
            )}
          </div>
          {enableScrollToTop && (
            <NoSSR>
              <ScrollToTop />
            </NoSSR>
          )}
          {uiSwitch?.showAside && headers.length > 0 && (
            <div
              className={styles.asideContainer}
              style={
                uiSwitch?.showNavbar
                  ? undefined
                  : { marginTop: 0, paddingTop: '32px' }
              }
            >
              {beforeOutline}
              <Aside headers={headers} outlineTitle={outlineTitle} />
              {afterOutline}
            </div>
          )}
        </div>
      </div>
      {afterDoc}
    </div>
  );
}
