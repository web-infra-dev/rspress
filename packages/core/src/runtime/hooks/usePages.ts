import type { PageData } from '@rspress/shared';
import { pageData } from 'virtual-page-data';

export function usePages(): { pages: PageData['pages'] } {
  return { pages: pageData.pages };
}
