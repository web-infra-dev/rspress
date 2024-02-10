import { useEffect, useState } from 'react';
import { MDXProvider } from '@mdx-js/react';
import { getCustomMDXComponent } from '@theme';
import { Content, useLocation, usePageData, NoSSR } from '@rspress/runtime';
import { Aside } from '../../components/Aside';
import { DocFooter } from '../../components/DocFooter';
import { useDisableNav, useLocaleSiteData } from '../../logic';
import { SideMenu } from '../../components/LocalSideBar';
import { Overview } from '../../components/Overview';
import { TabDataContext } from '../../logic/TabDataContext';
import { QueryStatus } from '../Layout';
import ScrollToTop from '../../components/ScrollToTop/index';
import styles from './index.module.scss';

export interface DocLayoutProps {
  beforeSidebar?: React.ReactNode;
  afterSidebar?: React.ReactNode;
  beforeDocFooter?: React.ReactNode;
  beforeDoc?: React.ReactNode;
  afterDoc?: React.ReactNode;
  beforeOutline?: React.ReactNode;
  afterOutline?: React.ReactNode;
}

export function DocLayout(props: DocLayoutProps) {
  const {
    beforeDocFooter,
    beforeDoc,
    afterDoc,
    beforeOutline,
    afterOutline,
    beforeSidebar,
    afterSidebar,
  } = props;
  const { siteData, page } = usePageData();
  const { toc = [], frontmatter } = page;
  const [tabData, setTabData] = useState({});
  const headers = toc;
  const { themeConfig } = siteData;
  const localesData = useLocaleSiteData();
  const sidebar = localesData.sidebar || {};
  const [disableNavbar] = useDisableNav();
  const enableScrollToTop = themeConfig.enableScrollToTop ?? false;
  // siderbar Priority
  // 1. frontmatter.sidebar
  // 2. themeConfig.locales.sidebar
  // 3. themeConfig.sidebar
  const hasSidebar =
    frontmatter?.sidebar !== false && Object.keys(sidebar).length > 0;

  const outlineTitle =
    localesData?.outlineTitle || themeConfig?.outlineTitle || 'ON THIS PAGE';
  const isOverviewPage = frontmatter?.overview ?? false;
  const [hasFooter, setHasFooter] = useState(frontmatter?.footer ?? true);
  const location = useLocation();

  const getHasAside = () => {
    // if in iframe, default value is false
    const defaultHasAside =
      typeof window === 'undefined' ? true : window.top === window.self;
    return (
      (frontmatter?.outline ?? themeConfig?.outline ?? defaultHasAside) &&
      !isOverviewPage
    );
  };
  const [hasAside, setHasAside] = useState(getHasAside());

  useEffect(() => {
    setHasAside(getHasAside());
  }, [page, siteData]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const footer = query.get('footer');
    if (footer === QueryStatus.Hide) {
      setHasFooter(false);
    }
  }, []);

  const docContent = (
    <TabDataContext.Provider value={{ tabData, setTabData }}>
      <MDXProvider components={getCustomMDXComponent()}>
        <Content />
      </MDXProvider>
    </TabDataContext.Provider>
  );

  return (
    <div
      className={`${styles.docLayout} pt-0`}
      style={{
        ...(disableNavbar ? { marginTop: 0 } : {}),
      }}
    >
      {beforeDoc}
      {hasSidebar ? (
        <SideMenu beforeSidebar={beforeSidebar} afterSidebar={afterSidebar} />
      ) : null}
      <div
        className={`${styles.content} rspress-doc-container flex flex-shrink-0 mx-auto`}
      >
        <div className="w-full">
          {isOverviewPage ? (
            <Overview content={docContent} />
          ) : (
            <div>
              <div className="rspress-doc">{docContent}</div>
              <div className="rspress-doc-footer">
                {beforeDocFooter}
                {hasFooter && <DocFooter />}
              </div>
            </div>
          )}
        </div>
        {enableScrollToTop && (
          <NoSSR>
            <ScrollToTop />
          </NoSSR>
        )}
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
