import 'nprogress/nprogress.css';
import '../../styles';
import React from 'react';
import { Helmet } from 'react-helmet-async';
import Theme, { Nav } from '@theme';
import { usePageData, Content } from '@rspress/runtime';
import { DocLayout, DocLayoutProps } from '../DocLayout';
import { HomeLayoutProps } from '../HomeLayout';
import type { NavProps } from '../../components/Nav';
import { useLocaleSiteData } from '#theme/logic';
import { useRedirect4FirstVisit } from '#theme/logic/useRedirect4FirstVisit';
import { useUISwitch } from '#theme/logic/useUISwitch';

export type LayoutProps = {
  top?: React.ReactNode;
  bottom?: React.ReactNode;
} & DocLayoutProps &
  HomeLayoutProps &
  NavProps;

export const Layout: React.FC<LayoutProps> = props => {
  const {
    top,
    bottom,
    beforeDocFooter,
    afterDocFooter,
    beforeDoc,
    afterDoc,
    beforeSidebar,
    afterSidebar,
    beforeOutline,
    afterOutline,
    beforeNavTitle,
    afterNavTitle,
    beforeNav,
    beforeHero,
    afterHero,
    beforeFeatures,
    afterFeatures,
    afterNavMenu,
  } = props;
  const docProps: DocLayoutProps = {
    beforeDocFooter,
    afterDocFooter,
    beforeDoc,
    afterDoc,
    beforeSidebar,
    afterSidebar,
    beforeOutline,
    afterOutline,
  };
  const homeProps: HomeLayoutProps = {
    beforeHero,
    afterHero,
    beforeFeatures,
    afterFeatures,
  };
  const { siteData, page } = usePageData();
  const {
    pageType,
    lang: currentLang,
    // Inject by remark-plugin-toc
    title: articleTitle,
    frontmatter,
  } = page;
  const localesData = useLocaleSiteData();
  useRedirect4FirstVisit();
  // Always show sidebar by default
  // Priority: front matter title > h1 title
  let title = (frontmatter?.title as string) ?? articleTitle;
  const mainTitle = siteData.title || localesData.title;

  if (title && pageType === 'doc') {
    // append main title as a suffix
    title = `${title} - ${mainTitle}`;
  } else {
    title = mainTitle;
  }
  const description =
    (frontmatter?.description as string) ||
    siteData.description ||
    localesData.description;
  // Control whether to show navbar/sidebar/outline/footer
  const uiSwitch = useUISwitch();
  // Use doc layout by default
  const getContentLayout = () => {
    switch (pageType) {
      case 'home':
        return <Theme.HomeLayout {...homeProps} />;
      case 'doc':
        return <DocLayout {...docProps} uiSwitch={uiSwitch} />;
      case '404':
        return <Theme.NotFoundLayout />;
      // The custom pageType will have navbar while the blank pageType will not.
      case 'custom':
      case 'blank':
        return <Content />;
      default:
        return <DocLayout {...docProps} />;
    }
  };

  return (
    <div>
      <Helmet
        htmlAttributes={{
          lang: currentLang || 'en',
        }}
      >
        {title ? <title>{title}</title> : null}
        {description ? <meta name="description" content={description} /> : null}
      </Helmet>
      {top}

      {pageType !== 'blank' && uiSwitch.showNavbar && (
        <Nav
          beforeNavTitle={beforeNavTitle}
          afterNavTitle={afterNavTitle}
          beforeNav={beforeNav}
          afterNavMenu={afterNavMenu}
        />
      )}

      <section>{getContentLayout()}</section>
      {bottom}
    </div>
  );
};
