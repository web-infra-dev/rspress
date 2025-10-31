import { Link, mergeRefs } from '@theme';
import CloseSvg from '@theme-assets/close';
import clsx from 'clsx';
import { forwardRef, type ReactNode, useState } from 'react';
import { SvgWrapper } from '../SvgWrapper';
import './index.scss';
import { NoSSR } from '@rspress/core/runtime';

export type BannerProps = {
  /**
   * @default true
   */
  display?: boolean;
  className?: string;
} & (
  | {
      /**
       * @default 'localStorage'
       */
      storage?: 'localStorage' | 'sessionStorage' | false;
      /**
       * @default 'rp-banner-closed'
       */
      storageKey?: string;
      href: string;
      message: string | ReactNode;
    }
  | {
      customChildren: ReactNode;
    }
);

/**
 * @example
 * // theme/index.tsx
 * import { Layout as BasicLayout, Banner } from '@rspress/core/theme';
 * import { useLang } from '@rspress/core/runtime';
 * const Layout = () => {
      const lang = useLang();
      return (
        <BasicLayout
          beforeNav={
              <Banner
                href="/"
                message={
                  lang === 'en'
                    ? '🚧 Rspress 2.0 document is under development'
                    : '🚧 Rspress 2.0 文档还在开发中'
                }
              />
          }
        />
      );
    };
    export { Layout }
 *
 */
export const Banner = forwardRef<HTMLDivElement, BannerProps>((props, ref) => {
  return (
    <NoSSR>
      <BannerInner {...props} ref={ref} />
    </NoSSR>
  );
});

const BannerInner = forwardRef<HTMLDivElement, BannerProps>(
  (props, forwardedRef) => {
    const {
      href,
      message,
      display = true,
      className,
      storageKey = 'rp-banner-closed',
      storage = 'localStorage',
      customChildren,
    } = props as {
      href?: string;
      message?: string | ReactNode;
      display?: boolean;
      className?: string;
      storageKey?: string;
      storage?: 'localStorage' | 'sessionStorage' | false;
      customChildren?: ReactNode;
    };

    if (!display) {
      return null;
    }
    const [height, setHeight] = useState(36);
    const ref = mergeRefs(forwardedRef, element => {
      element?.offsetHeight && setHeight(element?.offsetHeight);
    });
    const [disable, setDisable] = useState(
      typeof window === 'undefined'
        ? false
        : storage
          ? (window[storage].getItem(storageKey) ?? false)
          : false,
    );

    if (disable) {
      return null;
    }

    return (
      <>
        <div className={clsx('rp-banner', className)} ref={ref}>
          {customChildren ?? (
            <>
              <Link href={href} className="rp-banner__link">
                {message}
              </Link>
              <SvgWrapper
                icon={CloseSvg}
                onClick={() => {
                  setDisable(true);
                  if (storage) {
                    window[storage].setItem(storageKey, 'true');
                  }
                }}
                className="rp-banner__close"
              />
            </>
          )}
        </div>
        <style>{`:root {--rp-banner-height: ${height}px;}`}</style>
      </>
    );
  },
);

BannerInner.displayName = 'BannerInner';
