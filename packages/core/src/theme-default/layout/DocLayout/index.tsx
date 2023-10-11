import { useEffect, useState } from 'react';
import { MDXProvider } from '@mdx-js/react';
import { getCustomMDXComponent } from '@theme';
import { Aside } from '../../components/Aside';
import { DocFooter } from '../../components/DocFooter';
import { useLocaleSiteData } from '../../logic';
import { SideMenu } from '../../components/LocalSideBar';
import { Overview } from '../../components/Overview';
import { TabDataContext } from '../../logic/TabDataContext';
import styles from './index.module.scss';
import { Content, usePageData } from '@/runtime';

export interface DocLayoutProps {
  beforeDocFooter?: React.ReactNode;
  beforeDoc?: React.ReactNode;
  afterDoc?: React.ReactNode;
  beforeOutline?: React.ReactNode;
  afterOutline?: React.ReactNode;
}

export function DocLayout(props: DocLayoutProps) {
  const { beforeDocFooter, beforeDoc, afterDoc, beforeOutline, afterOutline } =
    props;
  const { siteData, page } = usePageData();
  const { toc = [], frontmatter } = page;
  const [tabData, setTabData] = useState({});
  const headers = toc;
  const { themeConfig } = siteData;
  const localesData = useLocaleSiteData();
  const sidebar = localesData.sidebar || {};

  const disableNavbar =
    frontmatter?.hideNavbar ?? themeConfig?.hideNavbar ?? false;
  // siderbar Priority
  // 1. frontmatter.sidebar
  // 2. themeConfig.locales.sidebar
  // 3. themeConfig.sidebar
  const hasSidebar =
    frontmatter?.sidebar !== false && Object.keys(sidebar).length > 0;
  const outlineTitle =
    localesData?.outlineTitle || themeConfig?.outlineTitle || 'ON THIS PAGE';
  const isOverviewPage = frontmatter?.overview ?? false;
  const hasFooter = frontmatter?.footer ?? true;

  const getHasAside = () => {
    // if in iframe, default value is false
    const defaultHasAside =
      typeof window === 'undefined' ? true : window.top === window.self;
    return (
      (frontmatter?.outline ?? themeConfig?.outline ?? defaultHasAside) &&
      headers.length > 0
    );
  };
  const [hasAside, setHasAside] = useState(getHasAside());

  useEffect(() => {
    setHasAside(getHasAside());
  }, [page, siteData]);

  return (
    <div
      className={`${styles.docLayout} pt-0`}
      style={{
        ...(disableNavbar ? { marginTop: 0 } : {}),
      }}
    >
      {beforeDoc}
      {hasSidebar ? <SideMenu /> : null}
      <div
        className={`${styles.content} rspress-doc-container flex flex-shrink-0`}
      >
        <div className="w-full">
          {isOverviewPage ? (
            <Overview />
          ) : (
            <div>
              <div className="rspress-doc">
                <TabDataContext.Provider value={{ tabData, setTabData }}>
                  <MDXProvider components={getCustomMDXComponent()}>
                    <Content />
                  </MDXProvider>
                </TabDataContext.Provider>
              </div>
              <div className="rspress-doc-footer">
                {beforeDocFooter}
                {hasFooter && <DocFooter />}
              </div>
            </div>
          )}
        </div>

        {hasAside ? (
          <div
            className={styles.asideContainer}
            style={{
              ...(disableNavbar
                ? {
                    marginTop: 0,
                    paddingTop: '32px',
                  }
                : {}),
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
