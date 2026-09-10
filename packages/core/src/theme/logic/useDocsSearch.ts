import { useFullTextSearch } from './useFullTextSearch';
import { type SearchProvider, useSearchProvider } from './searchProvider';

type DocsSearchState =
  | { initialized: false; search: undefined }
  | { initialized: true; search: SearchProvider['search'] };

export function useDocsSearch(): DocsSearchState {
  const provider = useSearchProvider();
  const localSearch = useFullTextSearch();

  if (provider) {
    return { initialized: true, search: provider.search };
  }
  return localSearch;
}
