import { ReactNode, Suspense } from 'react';
import { matchRoutes, useLocation } from 'react-router-dom';
import siteData from 'virtual-site-data';
import { normalizeRoutePath } from './utils';
import { useViewTransition } from './hooks';

(window as any).eles = [];

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
  (window as any).eles.push(routesElement);

  let element = routesElement;
  if (siteData.themeConfig.enableContentAnimation) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    element = useViewTransition(routesElement);
  }

  // React 17 Suspense SSR is not supported
  if (!process.env.__IS_REACT_18__ && process.env.__SSR__) {
    return element;
  }
  return <Suspense fallback={fallback}>{element}</Suspense>;
};
