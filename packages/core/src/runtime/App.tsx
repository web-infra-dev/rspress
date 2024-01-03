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
  Header,
  PageData,
  cleanUrl,
  isProduction,
  MDX_REGEXP,
} from '@rspress/shared';
import globalComponents from 'virtual-global-components';
import 'virtual-global-styles';

// eslint-disable-next-line import/no-commonjs
const { default: Theme } = require('@theme');

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
        p.replace(/\/$/, '').toLowerCase();
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
    } = MDX_REGEXP.test(matchedRoute.filePath) ? meta : mod;
    return {
      siteData,
      page: {
        pagePath,
        ...extractPageInfo,
        pageType: frontmatter?.pageType || 'doc',
        title,
        frontmatter,
        // Trade off:
        // 1. the `extractPageInfo` includes complete toc even if import doc fragments, because we use `flattenMdxContent` function to make all doc fragments' toc included.However, it is only computed once when build
        // 2. the mod.toc is not complete toc, but it is computed every time through loader when doc changed
        // We choose the better solutions for different environments:
        // In production, we use the extractPageInfo.toc to ensure the toc is complete and accurate.
        // In development, we use the mod.toc to ensure the toc is up to date to ensure DX.However, we cannot ensure the complete toc info when including doc fragments.
        toc: isProduction() ? extractPageInfo?.toc : toc,
      },
    };
  } else {
    // 404 Page
    return {
      siteData,
      page: {
        pagePath: '',
        pageType: '404',
        routePath: '/404',
        lang: siteData.lang || '',
        frontmatter: {},
        title: '404',
        toc: [],
        version: '',
        _filepath: '',
        _relativePath: '',
      },
    };
  }
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
            } else {
              return React.createElement(componentInfo, {
                // eslint-disable-next-line react/no-array-index-key
                key: index,
              });
            }
          })
      }
    </HelmetProvider>
  );
}
