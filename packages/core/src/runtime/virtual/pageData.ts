import type { PageData } from '@rspress/shared';
import {
  pageData as virtualPageData,
  searchIndexHash as virtualSearchIndexHash,
} from 'virtual-page-data';
import { createVirtualStore } from './createVirtualStore';

export let pageData: PageData = virtualPageData;
export let searchIndexHash: Record<string, string> = virtualSearchIndexHash;
const store = createVirtualStore(pageData);

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
