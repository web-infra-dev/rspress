import type { EditLink } from '@rspress/core';
import { useI18n, usePageData } from '@rspress/core/runtime';

export function useEditLink() {
  const { siteData, page } = usePageData();
  const editLink: EditLink | undefined = siteData.themeConfig?.editLink;

  const t = useI18n();
  const text = t('editLinkText');

  if (!editLink?.docRepoBaseUrl || !text) {
    return null;
  }

  let { docRepoBaseUrl } = editLink;

  if (!docRepoBaseUrl.endsWith('/')) {
    docRepoBaseUrl += '/';
  }

  const relativePagePath = (page._relativePath as string).replace(/\\/g, '/');
  const link = `${docRepoBaseUrl}${relativePagePath}`;

  return {
    text,
    link,
  };
}
