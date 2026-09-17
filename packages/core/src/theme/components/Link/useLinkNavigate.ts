import {
  pathnameToRouteService,
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
  const navigate = useNavigate();
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
      if (!pathnameToRouteService(routePath)) {
        window.location.assign(withBaseHref);
        return;
      }

      if (useTransitions && startTransition) {
        let navigation: void | Promise<void> = undefined;
        startTransition(() => {
          navigation = navigate(removeBaseHref);
          return navigation;
        });
        await navigation;
      } else {
        await navigate(removeBaseHref);
      }
    },
    [useTransitions, navigate, startTransition],
  );
}
