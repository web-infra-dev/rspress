import { usePageData } from '@rspress/runtime';
import { useLocaleSiteData } from './useLocaleSiteData';

interface EditLink {
  docRepoBaseUrl?: string;
  text?: string;
}

export function useEditLink() {
  const { siteData, page } = usePageData();
  const locales = useLocaleSiteData();

  const editLink: EditLink =
    locales.editLink ?? siteData.themeConfig?.editLink ?? {};

  if (!editLink.docRepoBaseUrl || !editLink.text) {
    return null;
  }

  let { docRepoBaseUrl } = editLink;

  if (!docRepoBaseUrl.endsWith('/')) {
    docRepoBaseUrl += '/';
  }

  const relativePagePath = page._relativePath.replace(/\\/g, '/');
  const link = `${docRepoBaseUrl}${relativePagePath}`;

  return {
    text: editLink.text,
    link,
  };
}
