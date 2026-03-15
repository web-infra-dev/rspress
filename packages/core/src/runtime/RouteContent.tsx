import { type ReactNode, Suspense } from 'react';
import { pathnameToRouteService } from './route';

export type RouteRenderProps = Record<string, unknown>;

export function renderRouteElement(
  pathname: string,
  routeProps?: RouteRenderProps,
) {
  const route = pathnameToRouteService(pathname);
  if (!route) {
    return null;
  }

  return route.render(routeProps);
}

export function RouteContent({
  pathname,
  fallback = <></>,
  routeProps,
}: {
  pathname: string;
  fallback?: ReactNode;
  routeProps?: RouteRenderProps;
}) {
  return (
    <Suspense fallback={fallback}>
      {renderRouteElement(pathname, routeProps)}
    </Suspense>
  );
}
