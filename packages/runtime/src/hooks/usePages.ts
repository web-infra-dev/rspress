import type { PageData } from '@rspress/shared';
import { createContext } from 'react';
import pages from 'virtual-page-data';

interface IPagesContext {
  data: PageData;
  setData?: (data: PageData) => void;
}

export const PagesContext = createContext({} as IPagesContext);

export function usePages(): { pages: PageData['pages'] } {
  return { pages: pages.pages };
}
