import {
  isActive,
  pathnameToRouteService,
  useLocation,
  useNavigate,
  useSite,
} from '@rspress/core/runtime';
import { type TransitionStartFunction, useCallback } from 'react';
import { getHref } from './getHref';

/**
 * Navigate with Rspress link normalization. The router loader handles page
 * loading for both this helper and the native useNavigate hook.
 */
export function useLinkNavigate({
  startTransition,
}: { startTransition?: TransitionStartFunction } = {}): (
  href: string,
) => Promise<void> {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { site } = useSite();
  const useTransitions = site?.route?.useTransitions;

  return useCallback(
    async (href: string) => {
      const { linkType, removeBaseHref, routePath, withBaseHref } =
        getHref(href);
      if (linkType === 'external') {
        window.location.assign(href);
        return;
      }
      // Keep same-page links client-side, including on a 404 page, so clicking
      // a parent menu link does not reload the document and close its submenu.
      if (
        linkType !== 'hashOnly' &&
        !isActive(removeBaseHref, pathname) &&
        !pathnameToRouteService(routePath)
      ) {
        window.location.assign(withBaseHref);
        return;
      }

      // Native hash navigation creates history entries without router keys.
      // Preserve the current query and let the router track each anchor visit.
      const hashUrl =
        linkType === 'hashOnly'
          ? new URL(href, window.location.href)
          : undefined;
      const to = hashUrl
        ? { search: hashUrl.search, hash: hashUrl.hash }
        : removeBaseHref;
      const options = hashUrl
        ? { replace: hashUrl.href === window.location.href }
        : undefined;

      if (useTransitions && startTransition) {
        let navigation: void | Promise<void> = undefined;
        startTransition(() => {
          navigation = navigate(to, options);
          return navigation;
        });
        await navigation;
      } else {
        await navigate(to, options);
      }
    },
    [useTransitions, pathname, navigate, startTransition],
  );
}
