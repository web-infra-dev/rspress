import {
  cleanUrlByConfig,
  isActive,
  isExternalUrl,
  pathnameToRouteService,
  removeBase,
  useLocation,
  useNavigate as useNavigateInner,
  withBase,
} from '@rspress/core/runtime';
import nprogress from 'nprogress';
import {
  startTransition as reactStartTransition,
  type TransitionStartFunction,
  useCallback,
} from 'react';

nprogress.configure({ showSpinner: false });

function isAbsoluteUrl(url: string): boolean {
  return url.startsWith('/');
}

type LinkType = 'external' | 'hashOnly' | 'relative' | 'internal';

function getLinkType(href: string): LinkType {
  if (isExternalUrl(href)) {
    return 'external';
  }
  if (href.startsWith('#')) {
    return 'hashOnly';
  }

  if (!isAbsoluteUrl(href)) {
    return 'relative';
  }

  return 'internal';
}

export function getHref(href: string): {
  withBaseHref: string;
  removeBaseHref: string;
  linkType: LinkType;
} {
  let withBaseHref;
  const linkType = getLinkType(href);

  if (linkType === 'external' || linkType === 'hashOnly') {
    return { linkType: linkType, withBaseHref: href, removeBaseHref: href };
  }

  if (linkType === 'relative' && !process.env.__SSR__) {
    withBaseHref = new URL(href, window.location.href).pathname;
  } else {
    withBaseHref = withBase(cleanUrlByConfig(href));
  }
  const removeBaseHref = removeBase(withBaseHref);

  return { withBaseHref, removeBaseHref, linkType };
}

/**
 * For import { Link } from '@theme';
 * useNavigate with preload logic
 */
export function useLinkNavigate(
  { startTransition }: { startTransition?: TransitionStartFunction } = {
    startTransition: reactStartTransition,
  },
): (href: string) => Promise<void> {
  const { pathname: currPagePathname } = useLocation();
  const navigate = useNavigateInner();

  return useCallback(
    async (href: string) => {
      const { linkType, removeBaseHref, withBaseHref } = getHref(href);
      if (linkType === 'external' || linkType === 'hashOnly') {
        window.location.assign(href);
        return;
      }

      const preloadChunkThenNavigate = async () => {
        const inCurrPage = isActive(removeBaseHref, currPagePathname);
        if (!process.env.__SSR__ && !inCurrPage) {
          const matchedRoute = pathnameToRouteService(removeBaseHref);
          if (matchedRoute) {
            const timer = setTimeout(() => {
              nprogress.start();
            }, 200);
            await matchedRoute.preload();
            clearTimeout(timer);
            nprogress.done();
          } else {
            window.location.assign(withBaseHref);
            return;
          }
        }
        navigate(removeBaseHref, { replace: false });
      };

      if (startTransition) {
        startTransition(preloadChunkThenNavigate);
      } else {
        preloadChunkThenNavigate();
      }
    },
    [currPagePathname, navigate],
  );
}
