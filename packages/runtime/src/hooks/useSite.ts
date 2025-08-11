import { usePageData } from './usePageData';

export function useSite() {
  const { siteData } = usePageData();
  return { site: siteData };
}
