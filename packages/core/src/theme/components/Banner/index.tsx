import { IconClose, Link, mergeRefs, SvgWrapper } from '@rspress/core/theme';
import clsx from 'clsx';
import { forwardRef, type ReactNode, useEffect, useId, useState } from 'react';
import './index.scss';

const inlineStorageScript = `(function () {
  var script = document.currentScript;
  if (!script) return;
  try {
    var storage = window[script.dataset.rpBannerStorage];
    var storageKey = script.dataset.rpBannerStorageKey;
    var hiddenClass = script.dataset.rpBannerHiddenClass;
    if (storage && storageKey && hiddenClass && storage.getItem(storageKey)) {
      document.documentElement.classList.add(hiddenClass);
    }
  } catch (e) {}
})();`;

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
 * import { Layout as BasicLayout, Banner } from '@rspress/core/theme-original';
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
export const Banner = forwardRef<HTMLDivElement, BannerProps>(
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
    const isCustom = 'customChildren' in props;

    const [height, setHeight] = useState(36);
    const ref = mergeRefs(forwardedRef, element => {
      if (element?.offsetHeight) {
        setHeight(element?.offsetHeight);
      }
    });
    const [disable, setDisable] = useState(false);
    const bannerId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const bannerClass = `rp-banner-${bannerId}`;
    const hiddenClass = `${bannerClass}-hidden`;

    useEffect(() => {
      let isDisabled = false;
      if (!isCustom && typeof window !== 'undefined' && storage && storageKey) {
        try {
          isDisabled = Boolean(window[storage].getItem(storageKey));
        } catch {
          isDisabled = false;
        }
      }

      document.documentElement.classList.toggle(hiddenClass, isDisabled);
      setDisable(isDisabled);

      return () => {
        document.documentElement.classList.remove(hiddenClass);
      };
    }, [hiddenClass, isCustom, storage, storageKey]);

    if (!display || disable) {
      return null;
    }

    return (
      <>
        {!isCustom && storage && storageKey ? (
          <script
            data-rp-banner-hidden-class={hiddenClass}
            data-rp-banner-storage={storage}
            data-rp-banner-storage-key={storageKey}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: inlineStorageScript }}
          />
        ) : null}
        <style>{`:root {--rp-banner-height: ${height}px;} :root.${hiddenClass} {--rp-banner-height: 0px;} :root.${hiddenClass} .${bannerClass} {display: none;}`}</style>
        <div className={clsx('rp-banner', bannerClass, className)} ref={ref}>
          {customChildren ?? (
            <>
              <Link
                href={href}
                className="rp-banner__link"
                title={typeof message === 'string' ? message : undefined}
              >
                {message}
              </Link>
              <SvgWrapper
                icon={IconClose}
                onClick={() => {
                  document.documentElement.classList.add(hiddenClass);
                  setDisable(true);
                  if (storage) {
                    try {
                      window[storage].setItem(storageKey, 'true');
                    } catch {
                      return;
                    }
                  }
                }}
                className="rp-banner__close"
              />
            </>
          )}
        </div>
      </>
    );
  },
);
