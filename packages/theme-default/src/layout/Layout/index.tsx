import {
  Content,
  useFrontmatter,
  useLocaleSiteData,
  usePageData,
  useSite,
} from '@rspress/runtime';
import type { FrontMatterMeta } from '@rspress/shared';
import {
  HomeLayout as DefaultHomeLayout,
  NotFoundLayout as DefaultNotFoundLayout,
  Nav,
} from '@theme';
import { Head, useHead } from '@unhead/react';
import React, { memo, useMemo } from 'react';
import type { NavProps } from '../../components/Nav';
import { useSetup } from '../../logic/sideEffects';
import { useRedirect4FirstVisit } from '../../logic/useRedirect4FirstVisit';
import { type UISwitchResult, useUISwitch } from '../../logic/useUISwitch';
import { DocLayout, type DocLayoutProps } from '../DocLayout';
import type { HomeLayoutProps } from '../HomeLayout';

export type LayoutProps = {
  top?: React.ReactNode;
  bottom?: React.ReactNode;
  /**
   * Control whether or not to display the navbar, sidebar, outline and footer
   */
  uiSwitch?: Partial<UISwitchResult>;
  HomeLayout?: React.FC<HomeLayoutProps>;
  NotFoundLayout?: React.FC<any>;
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
        return <HomeLayout {...homeProps} />;
      case 'doc':
        return (
          <DocLayout {...docProps} uiSwitch={uiSwitch} navTitle={navTitle} />
        );
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
    <>
      <HeadTags
        lang={currentLang}
        title={title}
        description={description}
        frontmatter={frontmatter}
      />

      {top}

      {pageType !== 'blank' && uiSwitch.showNavbar && (
        <Nav
          beforeNavTitle={beforeNavTitle}
          afterNavTitle={afterNavTitle}
          navTitle={navTitle}
          beforeNav={beforeNav}
          afterNavMenu={afterNavMenu}
        />
      )}

      <section>{getContentLayout()}</section>
      {bottom}
    </>
  );
}
