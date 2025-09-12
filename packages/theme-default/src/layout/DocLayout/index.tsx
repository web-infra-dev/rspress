import { MDXProvider } from '@mdx-js/react';
import {
  Content,
  useFrontmatter,
  useLocaleSiteData,
  usePage,
  useSite,
} from '@rspress/runtime';
import { getCustomMDXComponent, Overview } from '@theme';
import { slug } from 'github-slugger';
import { useState } from 'react';
import { Aside } from '../../components/Aside';
import { useWatchToc } from '../../components/Aside/useDynamicToc';
import { DocFooter } from '../../components/DocFooter';
import { Sidebar } from '../../components/Sidebar';
import { SidebarMenu } from '../../components/SidebarMenu';
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

function DocContent({
  components,
}: {
  components: Record<string, React.FC<any>> | undefined;
}) {
  const mdxComponents = { ...getCustomMDXComponent(), ...components };

  return (
    <MDXProvider components={mdxComponents}>
      <Content />
    </MDXProvider>
  );
}

function FallbackTitle() {
  const { site } = useSite();
  const { page } = usePage();
  const { headingTitle, title } = page;
  const titleSlug = title && slug(title);
  return (
    site.themeConfig.fallbackHeadingTitle !== false &&
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
  const { site: siteData } = useSite();
  const { frontmatter } = useFrontmatter();
  const { themeConfig } = siteData;
  // const enableScrollToTop = themeConfig.enableScrollToTop ?? false;
  const localesData = useLocaleSiteData();
  const outlineTitle =
    localesData?.outlineTitle || themeConfig?.outlineTitle || 'ON THIS PAGE';
  const isOverviewPage = frontmatter?.overview ?? false;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const rspressDocRef = useWatchToc();

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
          <div className={`rp-flex-1 rp-overflow-x-auto`}>
            {isOverviewPage ? (
              <div className="rspress-overview-container">
                {beforeDocContent}
                <Overview content={<DocContent components={components} />} />
                {afterDocContent}
              </div>
            ) : (
              <>
                <div className="rspress-doc rp-doc" ref={rspressDocRef}>
                  {beforeDocContent}
                  <FallbackTitle />
                  <DocContent components={components} />
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
          {uiSwitch?.showAside && (
            <div
              className={styles.asideContainer}
              style={
                uiSwitch?.showNavbar
                  ? undefined
                  : { marginTop: 0, paddingTop: '32px' }
              }
            >
              {beforeOutline}
              <Aside outlineTitle={outlineTitle} />
              {afterOutline}
            </div>
          )}
        </div>
      </div>
      {afterDoc}
    </div>
  );
}
