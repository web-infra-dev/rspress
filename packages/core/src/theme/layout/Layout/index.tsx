import type { FrontMatterMeta } from '@rspress/core';
import {
  Content,
  useFrontmatter,
  useLocaleSiteData,
  usePageData,
  useSite,
} from '@rspress/core/runtime';
import {
  HomeLayout as DefaultHomeLayout,
  NotFoundLayout as DefaultNotFoundLayout,
  DocLayout,
  type DocLayoutProps,
  Nav,
} from '@theme';
import { Head, useHead } from '@unhead/react';
import React, { memo, useMemo, useState } from 'react';
import type { NavProps } from '../../components/Nav';
import { useSetup } from '../../logic/sideEffects';
import { TabDataContext } from '../../logic/TabDataContext';
import { useRedirect4FirstVisit } from '../../logic/useRedirect4FirstVisit';
import type { HomeLayoutProps } from '../HomeLayout';
import {
  UISwitchContext,
  type UISwitchResult,
  useCreateUISwitch,
} from './useUISwitch';

export type LayoutProps = {
  top?: React.ReactNode;
  bottom?: React.ReactNode;
  /**
   * Control whether or not to display the navbar, sidebar, outline and footer
   */
  uiSwitch?: Partial<UISwitchResult>;
  HomeLayout?: React.FC<HomeLayoutProps>;
  NotFoundLayout?: React.FC<any>;
  beforeNav?: React.ReactNode;
  afterNav?: React.ReactNode;
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

const HeadTags = memo(
  (props: {
    title: string | undefined;
    description: string | undefined;
    frontmatter: FrontMatterMeta;
    lang?: string;
  }) => {
    const { lang, frontmatter, description, title } = props;

    const head = frontmatter.head;
    const frontmatterTags = useMemo(() => {
      return head?.map(([tagName, attrs]) => {
        return tagName ? React.createElement(tagName, { ...attrs }) : null;
      });
    }, [head]);

    useHead({
      htmlAttrs: {
        lang: lang || 'en',
      },
      title: title || undefined,
      meta: [
        {
          property: 'og:type',
          content: 'website',
        },
        title
          ? {
              property: 'og:title',
              content: title,
            }
          : undefined,
        description
          ? {
              name: 'description',
              content: description,
            }
          : undefined,
      ],
    });

    return <Head>{frontmatterTags ?? null}</Head>;
  },
);

export function Layout(props: LayoutProps) {
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
    navTitle,
    beforeNav,
    afterNav,
    beforeHero,
    afterHero,
    beforeFeatures,
    afterFeatures,
    afterNavMenu,
    components,
    HomeLayout = DefaultHomeLayout,
    NotFoundLayout = DefaultNotFoundLayout,
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
    components,
  };
  const homeProps: HomeLayoutProps = {
    beforeHero,
    afterHero,
    beforeFeatures,
    afterFeatures,
  };
  const { page } = usePageData();
  const { site } = useSite();
  const { frontmatter } = useFrontmatter();
  const {
    pageType,
    lang: currentLang,
    // Inject by remark-plugin-toc
    title: articleTitle,
  } = page;
  const localesData = useLocaleSiteData();

  useSetup();

  useRedirect4FirstVisit();

  const [tabData, setTabData] = useState({});

  // Always show sidebar by default
  // Priority: front matter title > h1 title
  let title = (frontmatter.title as string) ?? articleTitle;
  const mainTitle = site.title || localesData.title || '';

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
    site.description ||
    localesData.description;

  const uiSwitchResult = useCreateUISwitch();

  // Control whether or not to display the navbar, sidebar, outline and footer
  // `props.uiSwitch` has higher priority and allows user to override the default value
  const uiSwitch = {
    ...uiSwitchResult,
    ...props.uiSwitch,
  };

  // Use doc layout by default
  const getContentLayout = () => {
    switch (pageType) {
      case 'home':
        return <HomeLayout {...homeProps} />;
      case 'doc':
        return <DocLayout {...docProps} navTitle={navTitle} />;
      case '404':
        return <NotFoundLayout />;
      // The custom pageType will have navbar while the blank pageType will not.
      case 'custom':
      case 'blank':
        return <Content />;
      default:
        return <DocLayout {...docProps} />;
    }
  };

  return (
    <TabDataContext.Provider value={{ tabData, setTabData }}>
      <UISwitchContext.Provider value={uiSwitch}>
        <HeadTags
          lang={currentLang}
          title={title}
          description={description}
          frontmatter={frontmatter}
        />

        {top}
        {pageType !== 'blank' && uiSwitch.showNavbar && (
          <>
            {beforeNav}
            <Nav
              beforeNavTitle={beforeNavTitle}
              afterNavTitle={afterNavTitle}
              navTitle={navTitle}
              afterNavMenu={afterNavMenu}
            />
            {afterNav}
          </>
        )}

        {getContentLayout()}
        {bottom}
      </UISwitchContext.Provider>
    </TabDataContext.Provider>
  );
}
