import type React from 'react';
import type { ComponentProps } from 'react';
import {
  matchRoutes,
  useLocation,
  useNavigate,
  normalizeHrefInRuntime as normalizeHref,
  normalizeRoutePath,
  withBase,
  isEqualPath,
} from '@rspress/runtime';
import nprogress from 'nprogress';
import { routes } from 'virtual-routes';
import { isExternalUrl } from '@rspress/shared';
import styles from './index.module.scss';
import { scrollToTarget } from '../../logic';

export interface LinkProps extends ComponentProps<'a'> {
  href?: string;
  children?: React.ReactNode;
  className?: string;
  onNavigate?: () => void;
  // keep current url parameters when href is internal
  keepCurrentParams?: boolean;
}

nprogress.configure({ showSpinner: false });

export function Link(props: LinkProps) {
  const {
    href = '/',
    children,
    className = '',
    onNavigate,
    keepCurrentParams = false,
    ...rest
  } = props;
  const isExternal = isExternalUrl(href);
  const target = isExternal ? '_blank' : '';
  const rel = isExternal ? 'noopener noreferrer' : undefined;
  const withBaseUrl = isExternal ? href : withBase(normalizeHref(href));
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const withQueryUrl = keepCurrentParams ? withBaseUrl + search : withBaseUrl;
  const inCurrentPage = isEqualPath(pathname, withBaseUrl);
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
    // handle hash link in current page
    const hash = withBaseUrl.split('#')[1];
    if (!isExternal && inCurrentPage && hash) {
      const el = document.getElementById(hash);
      if (el) {
        scrollToTarget(el, true);
      }
      return;
    }

    // handle normal link
    if (!process.env.__SSR__ && !inCurrentPage) {
      const matchedRoutes = matchRoutes(
        routes,
        normalizeRoutePath(withBaseUrl),
      );
      if (matchedRoutes?.length) {
        const timer = setTimeout(() => {
          nprogress.start();
        }, 200);
        await matchedRoutes[0].route.preload();
        clearTimeout(timer);
        nprogress.done();
      }
      onNavigate?.();
      navigate(withQueryUrl, { replace: false });
    }
  };

  if (!isExternal) {
    return (
      <a
        {...rest}
        className={`${styles.link} ${className} cursor-pointer`}
        rel={rel}
        target={target}
        onClick={handleNavigate}
        href={withBaseUrl}
      >
        {children}
      </a>
    );
  }

  return (
    <a
      {...rest}
      href={withBaseUrl}
      target={target}
      rel={rel}
      className={`${styles.link} ${className}`}
    >
      {children}
    </a>
  );
}
