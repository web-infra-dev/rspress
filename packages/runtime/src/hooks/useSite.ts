import { usePageData } from './usePageData';

export function useSite() {
  const { site: siteData } = usePageData();
  return { site: siteData };
}
