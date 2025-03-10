import { MDXProvider } from '@mdx-js/react';
import { Content, NoSSR, usePageData } from '@rspress/runtime';
import { Overview, ScrollToTop, getCustomMDXComponent } from '@theme';
import { slug } from 'github-slugger';
import { useMemo, useState } from 'react';
import { Aside } from '../../components/Aside';
import { DocFooter } from '../../components/DocFooter';
import { SideMenu } from '../../components/LocalSideBar';
import { TabDataContext } from '../../logic/TabDataContext';
import { useLocaleSiteData } from '../../logic/useLocaleSiteData';
import type { UISwitchResult } from '../../logic/useUISwitch';
import { A } from './docComponents/link';
import { H1 } from './docComponents/title';
import styles from './index.module.scss';

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
  }, [headingTitle, title]);

  return (
    <div
      className={`${styles.docLayout} pt-0`}
      style={{
        ...(uiSwitch?.showNavbar ? {} : { marginTop: 0 }),
      }}
    >
      {beforeDoc}
      <SideMenu
        outlineTitle={outlineTitle}
        beforeSidebar={beforeSidebar}
        afterSidebar={afterSidebar}
        uiSwitch={uiSwitch}
        navTitle={navTitle}
      />
      <div
        className={`${styles.content} rspress-doc-container flex flex-shrink-0 mx-auto`}
      >
        <div className="w-full flex-1">
          {isOverviewPage ? (
            <>
              {beforeDocContent}
              <Overview content={docContent} />
              {afterDocContent}
            </>
          ) : (
            <div>
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
            </div>
          )}
        </div>
        {enableScrollToTop && (
          <NoSSR>
            <ScrollToTop />
          </NoSSR>
        )}
        {uiSwitch?.showAside ? (
          <div
            className={styles.asideContainer}
            style={{
              ...(uiSwitch?.showNavbar
                ? {}
                : {
                    marginTop: 0,
                    paddingTop: '32px',
                  }),
            }}
          >
            <div>
              {beforeOutline}
              <Aside headers={headers} outlineTitle={outlineTitle} />
              {afterOutline}
            </div>
          </div>
        ) : null}
      </div>
      {afterDoc}
    </div>
  );
}
