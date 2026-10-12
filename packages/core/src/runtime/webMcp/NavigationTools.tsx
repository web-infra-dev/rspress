import { useLocation } from 'react-router-dom';
import { usePrevNextPage } from '../../theme/logic/usePrevNextPage';
import { usePage } from '../hooks/usePage';
import { useWebMcp } from '../hooks/useWebMcp';
import { pathnameToRouteService } from '../route';
import { defineTool, resolveInternalRoute, routePathField } from './tools';
import type { NavigationResult } from './types';
import { useToolNavigation } from './useToolNavigation';

const resolveRoute = (pathname: string) =>
  pathnameToRouteService(pathname)?.path;

export function NavigationTools() {
  const { page } = usePage();
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
  return null;
}
