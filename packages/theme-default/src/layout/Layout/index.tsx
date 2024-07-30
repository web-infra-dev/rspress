import 'nprogress/nprogress.css';
import '../../styles';
import type React from 'react';
import { Helmet } from 'react-helmet-async';
import Theme, { Nav } from '@theme';
import { usePageData, Content } from '@rspress/runtime';
import { DocLayout, type DocLayoutProps } from '../DocLayout';
import type { HomeLayoutProps } from '../HomeLayout';
import type { NavProps } from '../../components/Nav';
import { useLocaleSiteData } from '../../logic';
import { useRedirect4FirstVisit } from '../../logic/useRedirect4FirstVisit';
import { type UISwitchResult, useUISwitch } from '../../logic/useUISwitch';

export type LayoutProps = {
  top?: React.ReactNode;
  bottom?: React.ReactNode;
  /**
   * Control whether or not to display the navbar, sidebar, outline and footer
   */
  uiSwitch?: Partial<UISwitchResult>;
} & Omit<DocLayoutProps, 'uiSwitch'> &
  HomeLayoutProps &
  NavProps;

const concatTitle = (title: string, suffix?: string) => {
  if (!suffix) {
    return title;
  }

  title = title.trim();
  suffix = suffix.trim();

  if (!suffix.startsWith('-') && !suffix.startsWith('|')) {
    return `${title} - ${suffix}`;
  }

  return `${title} ${suffix}`;
};

export const Layout: React.FC<LayoutProps> = props => {
  const {
    top,
    bottom,
    beforeDocFooter,
    afterDocFooter,
    beforeDoc,
    afterDoc,
    beforeDocContent,
    afterDocContent,
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
    beforeDocContent,
    afterDocContent,
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
    frontmatter = {},
  } = page;
  const localesData = useLocaleSiteData();
  useRedirect4FirstVisit();

  // Always show sidebar by default
  // Priority: front matter title > h1 title
  let title = (frontmatter.title as string) ?? articleTitle;
  const mainTitle = siteData.title || localesData.title;

  if (title && pageType === 'doc') {
    // append main title as a suffix
    title = concatTitle(
      title,
      (frontmatter.titleSuffix as string) || mainTitle,
    );
  } else if (pageType === 'home') {
    title = concatTitle(mainTitle, frontmatter.titleSuffix as string);
  } else if (pageType === '404') {
    title = concatTitle('404', mainTitle);
  } else {
    title = mainTitle;
  }

  const description =
    (frontmatter?.description as string) ||
    siteData.description ||
    localesData.description;

  // Control whether or not to display the navbar, sidebar, outline and footer
  // `props.uiSwitch` has higher priority and allows user to override the default value
  const uiSwitch = {
    ...useUISwitch(),
    ...props.uiSwitch,
  };

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
