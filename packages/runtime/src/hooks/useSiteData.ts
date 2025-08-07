import { usePageData } from './usePageData';

export function useSiteData() {
  const { siteData } = usePageData();
  return siteData;
}
