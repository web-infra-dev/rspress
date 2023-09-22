import { ComponentProps } from 'react';
import { isExternalUrl, normalizeHref } from '@rspress/shared';
import styles from './index.module.scss';
import { withBase, useLang, usePageData, useVersion } from '@/runtime';

export const A = (props: ComponentProps<'a'>) => {
  let { href = '' } = props;
  const currentLang = useLang();
  const currentVersion = useVersion();
  const pageData = usePageData();
  const defaultLang = pageData.siteData.lang;
  const defaultVersion = pageData.siteData.multiVersion.default;
  if (
    (defaultLang || defaultVersion) &&
    !isExternalUrl(href) &&
    !href.startsWith('#')
  ) {
    const linkParts = href.split('/').filter(Boolean);
    let versionPart = '';
    let langPart = '';
    let purePathPart = '';

    // When add the version prefix, the situation is as follows:
    // - current version is not default version
    // - current link does not start with currrent version
    if (
      defaultVersion &&
      currentVersion !== defaultVersion &&
      linkParts[0] !== defaultVersion
    ) {
      versionPart = linkParts[0];
      linkParts.shift();
    }

    if (defaultLang) {
      if (currentLang !== defaultLang && linkParts[0] !== currentLang) {
        langPart = linkParts[0];
        linkParts.shift();
      }

      if (currentLang === defaultLang && linkParts[0] === defaultLang) {
        linkParts.shift();
      }
    }

    purePathPart = linkParts.join('/');

    href = normalizeHref(
      withBase([versionPart, langPart, purePathPart].filter(Boolean).join('/')),
    );
  }

  return (
    <a {...props} className={`${styles.link} ${props.className}`} href={href} />
  );
};
