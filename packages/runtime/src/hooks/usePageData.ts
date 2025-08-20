import type { PageDataLegacy } from '@rspress/shared';
import { usePage } from './usePage';
import { usePages } from './usePages';
import { useSite } from './useSite';

// TODO: mark this as deprecated after V2 theme refactoring
/**
 * should use `usePage` and `useSite` instead
 */
export function usePageData(): PageDataLegacy {
  const { page } = usePage();
  const { pages } = usePages();
  const { site } = useSite();

  return { page, siteData: { ...site, pages } };
}
