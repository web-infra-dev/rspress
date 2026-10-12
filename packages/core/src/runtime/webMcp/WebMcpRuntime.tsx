import { normalizeHref, removeTrailingSlash } from '@rspress/shared';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { usePrevNextPage } from '../../theme/logic/usePrevNextPage';
import { useNav } from '../hooks/useNav';
import { usePage } from '../hooks/usePage';
import { searchIndexHash, usePages } from '../hooks/usePages';
import { useSidebar } from '../hooks/useSidebar';
import { useSite } from '../hooks/useSite';
import { pathnameToRouteService } from '../route';
import { createTools, resolveInternalRoute } from './tools';
import type { ModelContext, NavigationResult, ToolContext } from './types';
import { useToolNavigation } from './useToolNavigation';

const options = import.meta.env.WEBMCP_OPTIONS;
const resolveRoute = (pathname: string) =>
  pathnameToRouteService(pathname)?.path;

export default function WebMcpRuntime() {
  const { page } = usePage();
  const { pages } = usePages();
  const { site } = useSite();
  const nav = useNav();
  const sidebar = useSidebar();
  const location = useLocation();
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
  const version =
    site.search !== false && site.search.versioned === false
      ? ''
      : page.version;
  const indexHash = searchIndexHash[`${version}###${page.lang}`];
  const search = useMemo(() => {
    if (!options.search || !indexHash) return undefined;
    let instance:
      | Promise<
          import('../../theme/components/Search/logic/search').PageSearcher
        >
      | undefined;
    return async (query: string, limit: number) => {
      instance ??= import('../../theme/components/Search/logic/search')
        .then(async ({ PageSearcher }) => {
          const searcher = new PageSearcher({
            ...site.search,
            currentLang: page.lang,
            currentVersion: version,
          });
          await searcher.init();
          return searcher;
        })
        .catch(error => {
          instance = undefined;
          throw error;
        });
      const groups = await (await instance).match(query, limit);
      return groups.map(({ group, result }) => ({ group, results: result }));
    };
  }, [site.search, page.lang, version, indexHash]);
  const context: ToolContext = {
    site: {
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
    },
    page,
    pages,
    origin: window.location.origin,
    resolveRoute,
    // Tool paths always exclude base, even when a route starts with the same prefix.
    markdownUrl: routePath =>
      `${removeTrailingSlash(site.base)}${normalizeHref(routePath, false).replace(/\.html$/, '.md')}`,
    markdown: options.markdown,
    fetch: window.fetch.bind(window),
    search,
    navigate,
  };
  const current = useRef(context);
  useLayoutEffect(() => {
    current.current = context;
  });
  const hasSearch = Boolean(search);
  useEffect(() => {
    const modelContext = (
      document as Document & { modelContext?: ModelContext }
    ).modelContext;
    if (!modelContext) return;
    const controller = new AbortController();
    for (const tool of createTools(() => current.current)) {
      void modelContext
        .registerTool(tool, {
          signal: controller.signal,
          exposedTo: options.exposedTo,
        })
        .catch(error => {
          if (!controller.signal.aborted)
            console.error(`[Rspress] Failed to register ${tool.name}:`, error);
        });
    }
    return () => controller.abort();
  }, [hasSearch]);
  return null;
}
