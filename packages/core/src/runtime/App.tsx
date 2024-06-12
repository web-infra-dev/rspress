import siteData from 'virtual-site-data';
import {
  matchRoutes,
  useLocation,
  isEqualPath,
  normalizeRoutePath,
  DataContext,
} from '@rspress/runtime';
import { HelmetProvider } from 'react-helmet-async';
import React, { useContext, useLayoutEffect } from 'react';
import {
  type Header,
  type PageData,
  cleanUrl,
  MDX_REGEXP,
} from '@rspress/shared';
import globalComponents from 'virtual-global-components';
import Theme from '@theme';
import 'virtual-global-styles';

export enum QueryStatus {
  Show = '1',
  Hide = '0',
}

type PageMeta = {
  title: string;
  toc: Header[];
  frontmatter: Record<string, any>;
};

export async function initPageData(routePath: string): Promise<PageData> {
  const { routes } = process.env.__SSR__
    ? (require('virtual-routes-ssr') as typeof import('virtual-routes-ssr'))
    : (require('virtual-routes') as typeof import('virtual-routes'));
  const matched = matchRoutes(routes, routePath)!;
  if (matched) {
    // Preload route component
    const matchedRoute = matched[0].route;
    const mod = await matchedRoute.preload();
    const pagePath = cleanUrl(matched[0].route.filePath);
    const extractPageInfo = siteData.pages.find(page => {
      const normalize = (p: string) =>
        // compat the path that has no / suffix and ignore case
        p
          .replace(/\/$/, '')
          .toLowerCase();
      return isEqualPath(normalize(page.routePath), normalize(routePath));
    });

    // FIXME: when sidebar item is configured as link string, the sidebar text won't updated when page title changed
    // Reason: The sidebar item text depends on pageData, which is not updated when page title changed, because the pageData is computed once when build
    const encodedPagePath = encodeURIComponent(pagePath);
    const meta: PageMeta =
      mod.default.__RSPRESS_PAGE_META?.[encodedPagePath] || {};
    // mdx loader will generate __RSPRESS_PAGE_META,
    // if the filePath don't match it, we can get meta from j(t)sx if we customize it
    const {
      toc = [],
      title = '',
      frontmatter = {},
      ...rest
    } = MDX_REGEXP.test(matchedRoute.filePath) ? meta : mod;
    return {
      siteData,
      page: {
        ...rest,
        pagePath,
        ...extractPageInfo,
        pageType: frontmatter?.pageType || 'doc',
        title,
        frontmatter,
        toc,
      },
    };
  }

  let lang = siteData.lang || '';
  let version = siteData.multiVersion?.default || '';

  if (siteData.lang && typeof window !== 'undefined') {
    const path = location.pathname
      .replace(siteData.base, '')
      .split('/')
      .slice(0, 2);

    if (siteData.locales.length) {
      const result = siteData.locales.find(({ lang }) => path.includes(lang));

      if (result) {
        lang = result.lang;
      }
    }

    if (siteData.multiVersion.versions) {
      const result = siteData.multiVersion.versions.find(version =>
        path.includes(version),
      );

      if (result) {
        version = result;
      }
    }
  }

  // 404 Page
  return {
    siteData,
    page: {
      pagePath: '',
      pageType: '404',
      routePath: '/404',
      lang,
      frontmatter: {},
      title: '404',
      toc: [],
      version,
      _filepath: '',
      _relativePath: '',
    },
  };
}

export function App({ helmetContext }: { helmetContext?: object }) {
  const { setData: setPageData, data } = useContext(DataContext);
  const frontmatter = data.page.frontmatter || {};
  const { pathname, search } = useLocation();
  const query = new URLSearchParams(search);
  const GLOBAL_COMPONENTS_KEY = 'globalUIComponents';
  const hideGlobalUIComponents =
    // Disable global components in frontmatter or query
    frontmatter[GLOBAL_COMPONENTS_KEY] === false ||
    query.get(GLOBAL_COMPONENTS_KEY) === QueryStatus.Hide;
  useLayoutEffect(() => {
    async function refetchData() {
      try {
        const pageData = await initPageData(normalizeRoutePath(pathname));
        setPageData(pageData);
      } catch (e) {
        console.log(e);
      }
    }
    refetchData();
  }, [pathname, setPageData]);

  return (
    <HelmetProvider context={helmetContext}>
      <Theme.Layout />
      {
        // Global UI
        !hideGlobalUIComponents &&
          globalComponents.map((componentInfo, index) => {
            if (Array.isArray(componentInfo)) {
              const [component, props] = componentInfo;
              return React.createElement(component, {
                // The component order is stable
                // eslint-disable-next-line react/no-array-index-key
                key: index,
                ...props,
              });
            }

            return React.createElement(componentInfo, {
              // eslint-disable-next-line react/no-array-index-key
              key: index,
            });
          })
      }
    </HelmetProvider>
  );
}
