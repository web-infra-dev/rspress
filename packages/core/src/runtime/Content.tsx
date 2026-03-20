import { type ReactNode, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { ContentSourceContext } from './ContentSourceContext';
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
  const contentSource = useContext(ContentSourceContext);

  if (contentSource !== null) {
    return <>{contentSource}</>;
  }

  return (
    <RouteContent
      pathname={pathname}
      fallback={fallback}
      routeProps={routeProps}
    />
  );
};
