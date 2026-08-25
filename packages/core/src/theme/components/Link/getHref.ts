import { cleanUrl, isExternalUrl } from '@rspress/shared';
import { cleanUrlByConfig, removeBase, withBase } from '../../../runtime/utils';

type LinkType = 'external' | 'hashOnly' | 'relative' | 'internal';

function isAbsoluteUrl(url: string): boolean {
  return url.startsWith('/');
}

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

export function getHref(
  href: string,
  currentUrl = typeof window === 'undefined' ? undefined : window.location.href,
): {
  withBaseHref: string;
  removeBaseHref: string;
  routePath: string;
  linkType: LinkType;
} {
  let withBaseHref;
  const linkType = getLinkType(href);

  if (linkType === 'external' || linkType === 'hashOnly') {
    return {
      linkType,
      withBaseHref: href,
      removeBaseHref: href,
      routePath: cleanUrl(href),
    };
  }

  if (linkType === 'relative' && currentUrl) {
    const url = new URL(href, currentUrl);
    withBaseHref = `${url.pathname}${url.search}${url.hash}`;
  } else {
    withBaseHref = withBase(cleanUrlByConfig(href));
  }
  const removeBaseHref = removeBase(withBaseHref);

  return {
    withBaseHref,
    removeBaseHref,
    routePath: cleanUrl(removeBaseHref),
    linkType,
  };
}
