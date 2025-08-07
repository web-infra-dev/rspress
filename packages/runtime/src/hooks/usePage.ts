import { usePageData } from './usePageData';

export function usePage() {
  const { page } = usePageData();
  return { page };
}
