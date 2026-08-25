import {
  initPageData,
  isActive,
  pathnameToRouteService,
  useLocation,
  useNavigate as useNavigateInner,
  useSite,
  warmPageData,
} from '@rspress/core/runtime';
import nprogress from 'nprogress';
import {
  startTransition as reactStartTransition,
  type TransitionStartFunction,
  useCallback,
} from 'react';
import { getHref } from './getHref';

nprogress.configure({ showSpinner: false });

/**
 * For import { Link } from '@rspress/core/theme';
 * useNavigate with preload logic
 */
export function useLinkNavigate(
  {
    startTransition = reactStartTransition,
  }: { startTransition?: TransitionStartFunction } = {
    startTransition: reactStartTransition,
  },
): (href: string) => Promise<void> {
  const { pathname: currPagePathname } = useLocation();
  const navigate = useNavigateInner();
  const { site } = useSite();
  const useTransitions = site?.route?.useTransitions;

  return useCallback(
    async (href: string) => {
      const { linkType, removeBaseHref, routePath, withBaseHref } =
        getHref(href);
      if (linkType === 'external' || linkType === 'hashOnly') {
        window.location.assign(href);
        return;
      }

      const isTransitionable = !!(useTransitions && startTransition);
      const preloadChunkThenNavigate = async () => {
        const inCurrPage = isActive(removeBaseHref, currPagePathname);

        if (!import.meta.env.SSR && !inCurrPage) {
          const matchedRoute = pathnameToRouteService(routePath);
          if (matchedRoute) {
            const timer = setTimeout(() => {
              nprogress.start();
            }, 200);
            const data = await initPageData(routePath);
            warmPageData(routePath, data);
            clearTimeout(timer);
            nprogress.done();
          } else {
            window.location.assign(withBaseHref);
            return;
          }
        }
        if (isTransitionable) {
          startTransition(() => {
            return navigate(removeBaseHref, { replace: false });
          });
        } else {
          navigate(removeBaseHref, { replace: false });
        }
      };

      if (isTransitionable) {
        startTransition(preloadChunkThenNavigate);
      } else {
        preloadChunkThenNavigate();
      }
    },
    [useTransitions, currPagePathname, navigate, startTransition],
  );
}
