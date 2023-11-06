import 'nprogress/nprogress.css';
import '../../styles';
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Theme, { Nav } from '@theme';
import { usePageData, Content, removeBase, withBase } from '@rspress/runtime';
import { DocLayout, DocLayoutProps } from '../DocLayout';
import { HomeLayoutProps } from '../HomeLayout';
import type { NavProps } from '../../components/Nav';
import { useDisableNav, useLocaleSiteData } from '@/logic';

export enum QueryStatus {
  Show = '1',
  Hide = '0',
}

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
    beforeDoc,
    afterDoc,
    beforeOutline,
    afterOutline,
    beforeNavTitle,
    afterNavTitle,
    beforeNav,
    beforeHero,
    afterHero,
    beforeFeatures,
    afterFeatures,
  } = props;
  const docProps: DocLayoutProps = {
    beforeDocFooter,
    beforeDoc,
    afterDoc,
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
  const defaultLang = siteData.lang || '';
  const [hideNavbar, setHideNavbar] = useDisableNav();
  // Always show sidebar by default
  // Priority: front matter title > h1 title
  let title = (frontmatter?.title as string) ?? articleTitle;
  const mainTitle = siteData.title || localesData.title;
  const localeLanguages = Object.values(siteData.themeConfig.locales || {});
  const langs = localeLanguages.map(item => item.lang) || [];

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
  // Use doc layout by default
  const getContentLayout = () => {
    switch (pageType) {
      case 'home':
        return <Theme.HomeLayout {...homeProps} />;
      case 'doc':
        return <DocLayout {...docProps} />;
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

  useEffect(() => {
    if (!defaultLang || process.env.TEST === '1') {
      // Check the window.navigator.language to determine the default language
      // If the default language is not the same as the current language, redirect to the default language
      // The default language will not have a lang prefix in the URL
      return;
    }
    // Normalize current url, to ensure that the home url is always with a trailing slash
    const { pathname } = window.location;
    const cleanPathname = removeBase(pathname);
    // Check if the user is visiting the site for the first time
    const FIRST_VISIT_KEY = 'rspress-visited';
    const visited = localStorage.getItem(FIRST_VISIT_KEY);
    if (visited) {
      return;
    } else {
      localStorage.setItem(FIRST_VISIT_KEY, '1');
    }
    const targetLang = window.navigator.language.split('-')[0];
    if (!langs.includes(targetLang)) {
      return;
    }
    if (targetLang !== currentLang) {
      if (targetLang === defaultLang) {
        // Redirect to the default language
        window.location.replace(pathname.replace(`/${currentLang}`, ''));
      } else if (currentLang === defaultLang) {
        // Redirect to the current language
        window.location.replace(withBase(`/${targetLang}${cleanPathname}`));
      } else {
        // Redirect to the current language
        window.location.replace(
          pathname.replace(`/${currentLang}`, `/${targetLang}`),
        );
      }
    }
  }, []);

  // Control the display of the navbar, sidebar and aside
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const navbar = query.get('navbar');
    const sidebar = query.get('sidebar');
    const aside = query.get('outline');
    if (navbar === QueryStatus.Hide) {
      setHideNavbar(true);
    }

    if (sidebar === QueryStatus.Hide) {
      document.documentElement.style.setProperty('--rp-sidebar-width', '0');
    }

    if (aside === QueryStatus.Hide) {
      document.documentElement.style.setProperty('--rp-aside-width', '0');
    }
  }, []);
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

      {pageType !== 'blank' && !hideNavbar && (
        <Nav
          beforeNavTitle={beforeNavTitle}
          afterNavTitle={afterNavTitle}
          beforeNav={beforeNav}
        />
      )}

      <section>{getContentLayout()}</section>
      {bottom}
    </div>
  );
};
