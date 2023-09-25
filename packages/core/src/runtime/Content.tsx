import { ReactNode, Suspense } from 'react';
import { matchRoutes, useLocation } from 'react-router-dom';
import { normalizeRoutePath } from './utils';
import { usePageData, useViewTransition } from './hooks';

const { routes } = process.env.__SSR__
  ? (require('virtual-routes-ssr') as typeof import('virtual-routes-ssr'))
  : (require('virtual-routes') as typeof import('virtual-routes'));

export const Content = ({ fallback = <></> }: { fallback?: ReactNode }) => {
  const { pathname } = useLocation();
  const matched = matchRoutes(routes, normalizeRoutePath(pathname));
  if (!matched) {
    return <div></div>;
  }
  const routesElement = matched[0].route.element;
  /**
   * useLayoutEffect to flush elements animation
   */
  let element = routesElement;
  if (usePageData().siteData.themeConfig.enableContentAnimation) {
    element = useViewTransition(routesElement);
  }

  // React 17 Suspense SSR is not supported
  if (!process.env.__IS_REACT_18__ && process.env.__SSR__) {
    return element;
  }
  return <Suspense fallback={fallback}>{element}</Suspense>;
};
