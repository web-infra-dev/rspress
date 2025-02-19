import { type ReactElement, type ReactNode, Suspense, memo } from 'react';
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

export const Content = ({ fallback = <></> }: { fallback?: ReactNode }) => {
  const { pathname } = useLocation();
  const matched = pathnameToRouteService(pathname);
  if (!matched) {
    return <div></div>;
  }
  const routesElement = matched.element;

  // React 17 Suspense SSR is not supported
  if (!process.env.__REACT_GTE_18__ && process.env.__SSR__) {
    return routesElement;
  }

  return (
    <Suspense fallback={fallback}>
      <TransitionContent el={routesElement} />
    </Suspense>
  );
};
