import { usePageData } from './usePageData';

export function useLang(): string {
  const { page } = usePageData();
  return page.lang || '';
}
