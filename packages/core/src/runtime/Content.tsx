import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { RouteContent, type RouteRenderProps } from './RouteContent';

// TODO: fallback should be a loading spinner
export const Content = ({
  fallback = <></>,
  routeProps,
}: {
  fallback?: ReactNode;
  routeProps?: RouteRenderProps;
}) => {
  const { pathname } = useLocation();

  return (
    <RouteContent
      pathname={pathname}
      fallback={fallback}
      routeProps={routeProps}
    />
  );
};
