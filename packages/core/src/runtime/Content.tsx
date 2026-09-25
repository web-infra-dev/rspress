import { type ReactNode, Suspense, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { pathnameToRouteService } from './route';

const DefaultFallback = <></>;

// TODO: fallback should be a loading spinner
export const Content = ({
  fallback = DefaultFallback,
}: {
  fallback?: ReactNode;
}) => {
  const { pathname } = useLocation();
  const matchedElement = useMemo(() => {
    const route = pathnameToRouteService(pathname);
    return route?.element;
  }, [pathname]);

  return <Suspense fallback={fallback}>{matchedElement}</Suspense>;
};
