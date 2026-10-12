import {
  PageContext,
  useLocation,
  useNav,
  usePages,
  useSidebar,
  useSite,
  useWebMcp,
  pathnameToRouteService,
} from '@rspress/core/runtime';
import { Layout, LlmsHint, Root } from '@rspress/core/theme';
import React, { useContext } from 'react';
import { useGlobalComponents } from './hooks/useGlobalComponents';
import { usePrevNextPage } from '../theme/logic/usePrevNextPage';
import {
  defineTool,
  listPages,
  queryField,
  resolveInternalRoute,
  routePathField,
} from './webMcp/tools';
import type { NavigationResult, SiteInfo } from './webMcp/types';
import { useToolNavigation } from './hooks/useToolNavigation';

enum QueryStatus {
  Show = '1',
  Hide = '0',
}

export function App() {
  const globalComponents = useGlobalComponents();
  const { data } = useContext(PageContext);
  const location = useLocation();
  const { search } = location;

  // This build-time condition is constant for the lifetime of the app.
  // Keep site-wide tools alongside the app's page, navigation and sidebar context.
  if (import.meta.env.ENABLE_WEBMCP && !import.meta.env.SSR) {
    const { site } = useSite();
    const page = data;
    const { pages } = usePages();
    const nav = useNav();
    const sidebar = useSidebar();
    useWebMcp(
      defineTool(
        'get_site_info',
        'Get documentation site metadata, languages, versions, navigation and the active sidebar.',
        {},
        [],
        () =>
          ({
            title: site.title,
            description: site.description,
            base: site.base,
            siteOrigin: site.siteOrigin,
            lang: page.lang,
            version: page.version,
            locales: site.locales,
            versions: site.multiVersion.versions,
            defaultVersion: site.multiVersion.default,
            nav,
            sidebar,
          }) satisfies SiteInfo,
      ),
    );
    useWebMcp(
      defineTool(
        'list_pages',
        'List documentation pages, optionally filtering titles, descriptions and headings. Defaults to the active language and version.',
        {
          query: queryField,
          lang: { type: 'string' },
          version: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
          offset: { type: 'integer', minimum: 0 },
        },
        [],
        args => listPages(pages, page, args),
      ),
    );

    const resolveRoute = (pathname: string) =>
      pathnameToRouteService(pathname)?.path;
    const { prevPage, nextPage } = usePrevNextPage();
    const toLink = (item: typeof prevPage) => {
      if (!item?.link) return null;
      try {
        return {
          title: item.text,
          routePath: resolveInternalRoute(item.link, {
            origin: window.location.origin,
            resolveRoute,
          }),
        };
      } catch {
        return null;
      }
    };
    const result: NavigationResult = {
      routePath: `${page.routePath}${location.search}${location.hash}`,
      page: {
        title: page.title,
        description: page.description,
        lang: page.lang,
        version: page.version,
      },
      sections: page.toc.map(section => ({
        title: section.text,
        depth: section.depth,
        routePath: `${page.routePath}${location.search}#${section.id}`,
      })),
      previousPage: toLink(prevPage),
      nextPage: toLink(nextPage),
    };
    const navigate = useToolNavigation(result);
    useWebMcp(
      defineTool(
        'navigate',
        'Navigate to a known internal documentation route and return the rendered page metadata, section routes and adjacent pages. Paths are relative to the site base and may include a query or hash.',
        { routePath: routePathField },
        ['routePath'],
        (args, signal) =>
          navigate(
            resolveInternalRoute(args.routePath as string, {
              origin: window.location.origin,
              resolveRoute,
            }),
            signal,
          ),
      ),
    );
  }

  const frontmatter = data.frontmatter || {};
  const GLOBAL_COMPONENTS_KEY = 'globalUIComponents';

  const query = new URLSearchParams(search);
  const hideGlobalUIComponents =
    // Disable global components in frontmatter or query
    frontmatter[GLOBAL_COMPONENTS_KEY] === false ||
    query.get(GLOBAL_COMPONENTS_KEY) === QueryStatus.Hide;

  if (import.meta.env.SSG_MD) {
    return (
      <Root>
        {import.meta.env.ENABLE_LLMS_HINT && <LlmsHint />}
        <Layout />
      </Root>
    );
  }

  return (
    <Root>
      {import.meta.env.ENABLE_LLMS_HINT && <LlmsHint />}
      <Layout />
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
                // FIXME: ` as object` should be omitted, seems like `@microsoft/api-extractor` issue
                ...(props as object),
              });
            }

            return React.createElement(componentInfo, {
              // eslint-disable-next-line react/no-array-index-key
              key: index,
            });
          })
      }
    </Root>
  );
}
