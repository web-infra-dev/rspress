import {
  cleanUrlByConfig,
  isActive,
  pathnameToRouteService,
  removeBase,
  useLocation,
  useNavigate as useNavigateInner,
  withBase,
} from '@rspress/runtime';
import { isExternalUrl } from '@rspress/shared';
import nprogress from 'nprogress';
import { useCallback } from 'react';
import { scrollToTarget } from '../../logic/sideEffects';
import { useUISwitch } from '../../logic/useUISwitch';

nprogress.configure({ showSpinner: false });

function isAbsoluteUrl(url: string): boolean {
  return url.startsWith('/');
}

type LinkType = 'external' | 'hashOnly' | 'relative' | 'internal';

const scrollToAnchor = (smooth: boolean, scrollPaddingTop: number) => {
  const currentUrl = window.location;
  const { hash: rawHash } = currentUrl;
  const hash = decodeURIComponent(rawHash);
  const target = hash.length > 1 && document.getElementById(hash.slice(1));
  if (hash && target) {
    scrollToTarget(target, smooth, scrollPaddingTop);
  }
};

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

export function useNavigate(): (href: string) => Promise<void> {
  const { pathname: currPagePathname } = useLocation();
  const { scrollPaddingTop } = useUISwitch();
  const navigate = useNavigateInner();

  return useCallback(
    async (href: string) => {
      const { linkType, removeBaseHref, withBaseHref } = getHref(href);
      if (linkType === 'external' || linkType === 'hashOnly') {
        window.location.assign(href);
        return;
      }

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
      setTimeout(() => {
        scrollToAnchor(false, scrollPaddingTop);
      }, 100);
    },
    [currPagePathname, scrollPaddingTop, navigate],
  );
}
