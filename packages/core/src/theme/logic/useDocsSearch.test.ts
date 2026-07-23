import { beforeEach, describe, expect, rs, test } from '@rstest/core';
import { useFullTextSearch } from './useFullTextSearch';
import { useDocsSearch } from './useDocsSearch';
import { useSearchProvider } from './searchProvider';

rs.mock('./useFullTextSearch', () => ({
  useFullTextSearch: rs.fn(),
}));

rs.mock('./searchProvider', () => ({
  useSearchProvider: rs.fn(),
}));

const mockUseFullTextSearch = rs.mocked(useFullTextSearch);
const mockUseSearchProvider = rs.mocked(useSearchProvider);

beforeEach(() => {
  mockUseSearchProvider.mockReturnValue(undefined);
  mockUseFullTextSearch.mockReturnValue({
    initialized: false,
    search: undefined,
  });
});

describe('useDocsSearch', () => {
  test('falls back to local search', () => {
    const search = rs.fn();
    mockUseFullTextSearch.mockReturnValue({ initialized: true, search });

    expect(useDocsSearch()).toEqual({ initialized: true, search });
  });

  test('prefers a registered provider', () => {
    const search = rs.fn();
    mockUseSearchProvider.mockReturnValue({ search });

    expect(useDocsSearch()).toEqual({ initialized: true, search });
  });

  test('is unavailable without any search provider', () => {
    expect(useDocsSearch()).toEqual({
      initialized: false,
      search: undefined,
    });
  });
});
