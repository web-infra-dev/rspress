import {
  ReactNode,
  Suspense,
  memo,
  ReactElement,
  useEffect,
  useLayoutEffect,
} from 'react';
import { matchRoutes, useLocation } from 'react-router-dom';
import siteData from 'virtual-site-data';
import { normalizeRoutePath } from './utils';
import { useViewTransition } from './hooks';

const { routes } = process.env.__SSR__
  ? (require('virtual-routes-ssr') as typeof import('virtual-routes-ssr'))
  : (require('virtual-routes') as typeof import('virtual-routes'));

function TransitionContentImpl(props: { el: ReactElement }) {
  let element = props.el;
  if (siteData?.themeConfig?.enableContentAnimation) {
    element = useViewTransition(props.el);
  }
  return element;
}

const TransitionContent = memo(
  TransitionContentImpl,
  (prevProps, nextProps) => {
    let res = prevProps.el === nextProps.el;
    return res;
  },
);

export const Content = ({ fallback = <></> }: { fallback?: ReactNode }) => {
  const { pathname } = useLocation();
  const matched = matchRoutes(routes, normalizeRoutePath(pathname));
  if (!matched) {
    return <div></div>;
  }
  const routesElement = matched[0].route.element;

  // React 17 Suspense SSR is not supported
  if (!process.env.__IS_REACT_18__ && process.env.__SSR__) {
    return routesElement;
  }

  return (
    <Suspense fallback={fallback}>
      <TransitionContent el={routesElement}></TransitionContent>
    </Suspense>
  );
};
