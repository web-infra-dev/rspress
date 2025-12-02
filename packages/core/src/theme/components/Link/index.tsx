import { preloadLink } from '@rspress/core/runtime';
import clsx from 'clsx';
import nprogress from 'nprogress';
import type React from 'react';
import type { ComponentProps, TransitionStartFunction } from 'react';
import './index.scss';
import { getHref, useLinkNavigate } from './useLinkNavigate';

export interface LinkProps extends ComponentProps<'a'> {
  href?: string;
  children?: React.ReactNode;
  className?: string;
  onMouseEnter?: (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) => void;

  /**
   * Get isPending state of Link navigation
   *
   * ```tsx
   * const [isPending, startTransition] = useTransition();
   * <Link
   *   href="/some-path"
   *   startTransition={startTransition}
   * >
   *   Some Link
   * </Link>
   * ```
   *
   * @private
   * @unstable
   */
  startTransition?: TransitionStartFunction;
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
  const {
    href = '/',
    children,
    className = '',
    onClick,
    onMouseEnter,
    startTransition,
    ...otherProps
  } = props;

  const { linkType, removeBaseHref, withBaseHref } = getHref(href);
  const navigate = useLinkNavigate({ startTransition });

  if (linkType === 'external') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(className, 'rp-link')}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        {...otherProps}
      >
        {children}
      </a>
    );
  }

  if (linkType === 'hashOnly') {
    return (
      <a
        href={href}
        className={clsx(className, 'rp-link')}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        {...otherProps}
      >
        {children}
      </a>
    );
  }

  if (linkType === 'relative') {
    return (
      <a
        href={href}
        className={clsx(className, 'rp-link')}
        onMouseEnter={event => {
          onMouseEnter?.(event);
          preloadLink(removeBaseHref);
        }}
        onClick={e => {
          onClick?.(e);
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
          navigate(href);
        }}
        {...otherProps}
      >
        {children}
      </a>
    );
  }

  return (
    <a
      href={withBaseHref}
      className={clsx(className, 'rp-link')}
      onMouseEnter={event => {
        onMouseEnter?.(event);
        preloadLink(removeBaseHref);
      }}
      onClick={e => {
        onClick?.(e);
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
        navigate(removeBaseHref);
      }}
      {...otherProps}
    >
      {children}
    </a>
  );
}
