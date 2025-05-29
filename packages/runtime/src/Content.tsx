import { inBrowser } from '@rspress/shared';
import {
  type ReactElement,
  type ReactNode,
  Suspense,
  memo,
  useMemo,
} from 'react';
import { useLocation } from 'react-router-dom';
import siteData from 'virtual-site-data';
import { useViewTransition } from './hooks';
import { pathnameToRouteService } from './route';

function TransitionContentImpl(props: { el: ReactElement }) {
  let element = props.el;
  if (siteData?.themeConfig?.enableContentAnimation) {
    element = useViewTransition(props.el);
  }
  return element;
}

const TransitionContent = memo(
  TransitionContentImpl,
  (prevProps, nextProps) => prevProps.el === nextProps.el,
);

// TODO: fallback should be a loading spinner
export const Content = ({ fallback = <></> }: { fallback?: ReactNode }) => {
  const { pathname } = useLocation();
  const matchedElement = useMemo(() => {
    const route = pathnameToRouteService(pathname);
    return route?.element;
  }, [pathname]);

  if (!matchedElement) {
    return <div></div>;
  }

  // why no Suspense during SSG?
  // 1. Suspense will hide the error
  // 2. during SSG, we use sync component instead of async component via `React.lazy`, so we do not need Suspense
  if (!inBrowser()) {
    return <TransitionContent el={matchedElement} />;
  }

  return (
    <Suspense fallback={fallback}>
      <TransitionContent el={matchedElement} />
    </Suspense>
  );
};
