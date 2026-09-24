import type {
  BeforeSearch,
  OnSearch,
  AfterSearch,
  RenderSearchFunction,
} from '@rspress/core/theme';
import * as virtualSearchHooks from 'virtual-search-hooks';
import { createExternalStore } from '../createExternalStore';

export interface SearchHooks {
  beforeSearch?: BeforeSearch;
  onSearch?: OnSearch;
  afterSearch?: AfterSearch;
  render?: RenderSearchFunction;
}

// Copy the namespace so each update has a distinct, stable snapshot.
const store = createExternalStore<SearchHooks>({ ...virtualSearchHooks });

export function useSearchHooks(): SearchHooks {
  return store.useValue();
}

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept('virtual-search-hooks', () => {
    store.update({ ...virtualSearchHooks });
  });
}
