import { useState } from 'react';
import { MDXProvider } from '@mdx-js/react';
import { getCustomMDXComponent, ScrollToTop, Overview } from '@theme';
import { Content, usePageData, NoSSR } from '@rspress/runtime';
import { Aside } from '../../components/Aside';
import { DocFooter } from '../../components/DocFooter';
import { useLocaleSiteData } from '../../logic';
import { SideMenu } from '../../components/LocalSideBar';
import { TabDataContext } from '../../logic/TabDataContext';
import styles from './index.module.scss';
import type { UISwitchResult } from '../../logic/useUISwitch';

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
  } = props;
  const { siteData, page } = usePageData();
  const { toc = [], frontmatter } = page;
  const [tabData, setTabData] = useState({});
  const headers = toc;
  const { themeConfig } = siteData;
  const enableScrollToTop = themeConfig.enableScrollToTop ?? false;
  const localesData = useLocaleSiteData();

  const outlineTitle =
    localesData?.outlineTitle || themeConfig?.outlineTitle || 'ON THIS PAGE';
  const isOverviewPage = frontmatter?.overview ?? false;

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
        ...(uiSwitch.showNavbar ? {} : { marginTop: 0 }),
      }}
    >
      {beforeDoc}
      <SideMenu
        outlineTitle={outlineTitle}
        beforeSidebar={beforeSidebar}
        afterSidebar={afterSidebar}
        uiSwitch={uiSwitch}
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
                {docContent}
                {afterDocContent}
              </div>
              <div className="rspress-doc-footer">
                {beforeDocFooter}
                {uiSwitch.showDocFooter && <DocFooter />}
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
        {uiSwitch.showAside ? (
          <div
            className={styles.asideContainer}
            style={{
              ...(uiSwitch.showNavbar
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
