import { usePageData } from './usePageData';

export function useVersion(): string {
  const { page } = usePageData();
  return page.version || '';
}
