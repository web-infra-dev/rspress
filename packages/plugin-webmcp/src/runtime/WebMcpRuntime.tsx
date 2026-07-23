import {
  isProduction,
  pathnameToRouteService,
  removeBase,
  routePathToMdPath,
  useLang,
  useLocation,
  useNav,
  usePage,
  usePages,
  useSidebar,
  useSite,
  useVersion,
} from '@rspress/core/runtime';
import {
  useAwaitedLinkNavigate,
  useDocsSearch,
  usePrevNextPage,
} from '@rspress/core/theme';
import { useCallback, useMemo, useRef } from 'react';
import type { WebMcpRuntimeOptions } from '../options';
import {
  createCurrentPageTool,
  createListPagesTool,
  createNavigateTool,
  createPageTool,
  createSearchTool,
  createSiteInfoTool,
  type NavigatePageContext,
  type SearchGroup,
} from './builtins';
import { isWebMcpSupported } from './register';
import { useWebMcpTool } from './useWebMcpTool';

function resolveRoutePath(pathname: string): string | undefined {
  return pathnameToRouteService(removeBase(pathname))?.path;
}

function createNavigatePageContext(
  page: ReturnType<typeof usePage>['page'],
  search: string,
  prevPage: ReturnType<typeof usePrevNextPage>['prevPage'],
  nextPage: ReturnType<typeof usePrevNextPage>['nextPage'],
): NavigatePageContext {
  const toPageLink = (item: typeof prevPage) =>
    item?.link ? { title: item.text, routePath: item.link } : null;
  return {
    page: {
      title: page.title,
      ...(page.description === undefined
        ? {}
        : { description: page.description }),
      lang: page.lang,
      version: page.version,
    },
    sections: page.toc.map(section => ({
      title: section.text,
      depth: section.depth,
      routePath: `${page.routePath}${search}#${section.id}`,
    })),
    previousPage: toPageLink(prevPage),
    nextPage: toPageLink(nextPage),
  };
}

function useAwaitedNavigate() {
  const { page } = usePage();
  const { prevPage, nextPage } = usePrevNextPage();
  const { search, hash } = useLocation();
  const navigate = useAwaitedLinkNavigate(`${page.routePath}${search}${hash}`);
  const pageContext = createNavigatePageContext(
    page,
    search,
    prevPage,
    nextPage,
  );
  const pageContextRef = useRef(pageContext);
  pageContextRef.current = pageContext;
  return useCallback(
    async (target: string) => {
      await navigate(target);
      return pageContextRef.current;
    },
    [navigate],
  );
}

interface BuiltInToolProps {
  exposedTo?: string[];
}

function CurrentPageTool({ exposedTo }: BuiltInToolProps) {
  const { page } = usePage();
  const tool = useMemo(
    () => createCurrentPageTool(page, routePathToMdPath(page.routePath)),
    [page],
  );
  useWebMcpTool(tool, { exposedTo });
  return null;
}

function PageTool({ exposedTo }: BuiltInToolProps) {
  const { pages } = usePages();
  const origin = location.origin;
  const tool = useMemo(
    () => createPageTool(pages, resolveRoutePath, origin, routePathToMdPath),
    [pages, origin],
  );
  useWebMcpTool(tool, { exposedTo });
  return null;
}

function SiteInfoTool({ exposedTo }: BuiltInToolProps) {
  const { site } = useSite();
  const lang = useLang();
  const version = useVersion();
  const nav = useNav();
  const sidebar = useSidebar();
  const tool = useMemo(
    () =>
      createSiteInfoTool({
        title: site.title,
        description: site.description,
        base: site.base,
        siteOrigin: site.siteOrigin,
        lang,
        version,
        locales: site.locales,
        versions: site.multiVersion.versions,
        defaultVersion: site.multiVersion.default,
        nav,
        sidebar,
      }),
    [site, lang, version, nav, sidebar],
  );
  useWebMcpTool(tool, { exposedTo });
  return null;
}

function ListPagesTool({ exposedTo }: BuiltInToolProps) {
  const { pages } = usePages();
  const lang = useLang();
  const version = useVersion();
  const tool = useMemo(
    () => createListPagesTool(pages, { lang, version }),
    [pages, lang, version],
  );
  useWebMcpTool(tool, { exposedTo });
  return null;
}

function RegisteredSearchTool({
  exposedTo,
  search,
}: {
  exposedTo?: string[];
  search: (query: string, limit?: number) => Promise<SearchGroup[]>;
}) {
  useWebMcpTool(createSearchTool(search), { exposedTo });
  return null;
}

function SearchTool({ exposedTo }: BuiltInToolProps) {
  const searchState = useDocsSearch();
  return searchState.initialized ? (
    <RegisteredSearchTool exposedTo={exposedTo} search={searchState.search} />
  ) : null;
}

function NavigateTool({ exposedTo }: BuiltInToolProps) {
  const navigate = useAwaitedNavigate();
  const origin = location.origin;
  const tool = createNavigateTool(resolveRoutePath, origin, navigate);
  useWebMcpTool(tool, { exposedTo });
  return null;
}

function SupportedWebMcpRuntime({ exposedTo, tools }: WebMcpRuntimeOptions) {
  return (
    <>
      {tools.siteInfo ? <SiteInfoTool exposedTo={exposedTo} /> : null}
      {tools.listPages ? <ListPagesTool exposedTo={exposedTo} /> : null}
      {tools.getPage && isProduction() ? (
        <PageTool exposedTo={exposedTo} />
      ) : null}
      {tools.currentPage && isProduction() ? (
        <CurrentPageTool exposedTo={exposedTo} />
      ) : null}
      {tools.search ? <SearchTool exposedTo={exposedTo} /> : null}
      {tools.navigate ? <NavigateTool exposedTo={exposedTo} /> : null}
    </>
  );
}

export default function WebMcpRuntime(options: WebMcpRuntimeOptions) {
  return isWebMcpSupported() ? <SupportedWebMcpRuntime {...options} /> : null;
}
