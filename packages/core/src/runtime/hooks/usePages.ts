import type { PageData } from '@rspress/shared';
import {
  pageData as virtualPageData,
  searchIndexHash as virtualSearchIndexHash,
} from 'virtual-page-data';
import { createExternalStore } from '../createExternalStore';

export let pageData: PageData = virtualPageData;
export let searchIndexHash: Record<string, string> = virtualSearchIndexHash;
const store = createExternalStore(pageData);

export function usePages(): { pages: PageData['pages'] } {
  return { pages: store.useValue().pages };
}

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept('virtual-page-data', () => {
    pageData = virtualPageData;
    searchIndexHash = virtualSearchIndexHash;
    store.update(pageData);
  });
}
