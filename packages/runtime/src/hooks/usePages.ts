import type { PageData } from '@rspress/shared';
import pages from 'virtual-page-data';

export function usePages(): { pages: PageData['pages'] } {
  return { pages: pages.pages };
}
