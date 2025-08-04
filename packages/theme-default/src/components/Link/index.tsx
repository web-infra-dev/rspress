import {
  normalizeHrefInRuntime as normalizeHref,
  pathnameToRouteService,
  removeBase,
  useLocation,
  useNavigate,
  withBase,
} from '@rspress/runtime';
import { isExternalUrl } from '@rspress/shared';
import nprogress from 'nprogress';
import type React from 'react';
import { type ComponentProps, useMemo } from 'react';
import { isActive } from '../../logic/getSidebarDataGroup';
import { scrollToTarget } from '../../logic/sideEffects';
import { useUISwitch } from '../../logic/useUISwitch.js';
import { preloadLink } from '../Sidebar/utils';
import * as styles from './index.module.scss';

const scrollToAnchor = (smooth: boolean, scrollPaddingTop: number) => {
  const currentUrl = window.location;
  const { hash: rawHash } = currentUrl;
  const hash = decodeURIComponent(rawHash);
  const target = hash.length > 1 && document.getElementById(hash.slice(1));
  if (hash && target) {
    scrollToTarget(target, smooth, scrollPaddingTop);
  }
};

export interface LinkProps extends ComponentProps<'a'> {
  href?: string;
  children?: React.ReactNode;
  className?: string;
  onNavigate?: () => void;
  // keep current url parameters when href is internal
  keepCurrentParams?: boolean;
}

nprogress.configure({ showSpinner: false });

/**
 * What's the difference between <Link> and <a>?
 * Link can tell whether it's in current site or external site.
 * 1. If external, open a new page and navigate to it.
 * 2. If inCurrentPage, scroll to anchor.
 * 3. If inCurrentSite, it will navigate and scroll to anchor, preload the asyncChunk onHover the link
 * 4. Link is styled.
 */
export function Link(props: LinkProps) {
  const { href = '/', children, className = '', onNavigate, onClick } = props;

  const navigate = useNavigate();

  const { pathname } = useLocation();

  const { scrollPaddingTop } = useUISwitch();

  const withBaseUrl = useMemo(() => {
    return withBase(normalizeHref(href));
  }, [href]);

  const withoutBaseUrl = useMemo(() => {
    return removeBase(normalizeHref(href));
  }, [href]);

  const isExternal = isExternalUrl(href);
  const isHashOnlyLink = href.startsWith('#');

  if (isExternal) {
    return (
      <a
        {...props}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${styles.link} ${className}`}
      >
        {children}
      </a>
    );
  }

  if (isHashOnlyLink) {
    return (
      <a {...props} href={href} className={`${styles.link} ${className}`}>
        {children}
      </a>
    );
  }

  const handleNavigate = async (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) => {
    if (
      // left click only
      e.button !== 0 ||
      // `target` are usually used for open link in new window/tab
      (e.currentTarget.target && e.currentTarget.target !== '_self') ||
      // modifier keys are usually used for open link in new window/tab
      e.metaKey ||
      e.shiftKey ||
      e.altKey ||
      e.ctrlKey
    ) {
      return;
    }
    e.preventDefault();

    // handle normal link
    const inCurrentPage = isActive(withoutBaseUrl, pathname);
    if (!process.env.__SSR__ && !inCurrentPage) {
      const matchedRoute = pathnameToRouteService(withoutBaseUrl);
      if (matchedRoute) {
        const timer = setTimeout(() => {
          nprogress.start();
        }, 200);
        await matchedRoute.preload();
        clearTimeout(timer);
        nprogress.done();
      } else {
        window.location.href = withBaseUrl;
        return;
      }
    }
    onNavigate?.();
    navigate(withoutBaseUrl, { replace: false });
    setTimeout(() => {
      scrollToAnchor(false, scrollPaddingTop);
    }, 100);
  };

  return (
    <a
      {...props}
      href={withBaseUrl}
      className={`${styles.link} ${className}`}
      onMouseEnter={() => preloadLink(withoutBaseUrl)}
      onClick={event => {
        onClick?.(event);
        handleNavigate(event);
      }}
    >
      {children}
    </a>
  );
}
