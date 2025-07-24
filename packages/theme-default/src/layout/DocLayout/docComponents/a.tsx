import {
  normalizeHrefInRuntime as normalizeHref,
  removeBase,
  useLang,
  usePageData,
  useVersion,
  withBase,
} from '@rspress/runtime';
import { isExternalUrl } from '@rspress/shared';
import { Link } from '@theme';
import type { ComponentProps } from 'react';
import * as styles from './index.module.scss';

function usePathUtils() {
  const currentLang = useLang();
  const currentVersion = useVersion();
  const pageData = usePageData();
  const defaultLang = pageData.siteData.lang;
  const defaultVersion = pageData.siteData.multiVersion.default;

  const normalizeLinkHref = (rawHref: string) => {
    let href = rawHref;
    if (
      (defaultLang || defaultVersion) &&
      !isExternalUrl(href) &&
      !href.startsWith('#')
    ) {
      href = removeBase(href);
      const linkParts = href.split('/').filter(Boolean);
      let versionPart = '';
      let langPart = '';
      let purePathPart = '';

      // When add the version prefix, the situation is as follows:
      // - current version is not default version
      // - current link does not start with current version
      if (defaultVersion) {
        if (currentVersion !== defaultVersion) {
          versionPart = currentVersion;

          if (linkParts[0] === currentVersion) {
            linkParts.shift();
          }
        } else if (linkParts[0] === defaultVersion) {
          linkParts.shift();
        }
      }

      if (defaultLang) {
        if (currentLang !== defaultLang) {
          langPart = currentLang;

          if (linkParts[0] === currentLang) {
            linkParts.shift();
          }
        } else if (linkParts[0] === defaultLang) {
          linkParts.shift();
        }
      }

      purePathPart = linkParts.join('/');

      return normalizeHref(
        withBase(
          [versionPart, langPart, purePathPart].filter(Boolean).join('/'),
        ),
      );
    }

    return href;
  };

  return {
    normalizeLinkHref,
  };
}

export const A = (props: ComponentProps<'a'>) => {
  const { href = '', className = '' } = props;
  const { normalizeLinkHref } = usePathUtils();

  return (
    <Link
      {...props}
      className={`${className} ${styles.link} ${styles.inlineLink}`}
      href={normalizeLinkHref(href)}
    />
  );
};
