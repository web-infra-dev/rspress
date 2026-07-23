import type {
  DocSearchHit,
  DocSearchProps,
  DocSearchTransformClient,
} from '@docsearch/react';
import { describe, expect, rs, test } from '@rstest/core';
import { createAlgoliaSearchProvider } from '../src/runtime/searchProvider';

rs.mock('@rspress/core/runtime', () => ({
  removeBase: (url: string) => url.replace('/docs', ''),
}));

function hit(url: string): DocSearchHit {
  return {
    objectID: url,
    content: 'Search content',
    url,
    url_without_anchor: url,
    type: 'content',
    anchor: null,
    hierarchy: {
      lvl0: 'Guide',
      lvl1: 'Search',
      lvl2: null,
      lvl3: null,
      lvl4: null,
      lvl5: null,
      lvl6: null,
    },
    _highlightResult: {} as DocSearchHit['_highlightResult'],
    _snippetResult: {} as DocSearchHit['_snippetResult'],
  };
}

function setup(props: Partial<DocSearchProps>) {
  const search = rs.fn().mockResolvedValue({
    results: [{ hits: [hit('https://example.com/docs/guide#search')] }],
  });
  const client = { search } as unknown as DocSearchTransformClient;
  const provider = createAlgoliaSearchProvider(
    { appId: 'app', apiKey: 'key', ...props },
    client,
  );
  return { provider, search };
}

describe('Algolia search provider', () => {
  test('searches a legacy index and normalizes result URLs', async () => {
    const { provider, search } = setup({
      indexName: 'docs',
      searchParameters: { facetFilters: ['lang:en'] },
    });

    await expect(provider?.search('routing', 5)).resolves.toEqual([
      {
        group: 'docs',
        result: [expect.objectContaining({ url: '/guide#search' })],
      },
    ]);
    expect(search).toHaveBeenCalledWith({
      requests: [
        {
          facetFilters: ['lang:en'],
          indexName: 'docs',
          query: 'routing',
          hitsPerPage: 5,
        },
      ],
    });
  });

  test('supports multiple indices and custom item transforms', async () => {
    const transformItems = rs.fn((items: DocSearchHit[]) =>
      items.map(item => ({ ...item, content: 'transformed' })),
    );
    const { provider, search } = setup({
      indices: [
        'main',
        { name: 'api', searchParameters: { facetFilters: ['kind:api'] } },
      ],
      searchParameters: { facetFilters: ['lang:en'], typoTolerance: false },
      maxResultsPerGroup: 8,
      transformItems,
    });
    search.mockResolvedValueOnce({
      results: [
        { hits: [hit('https://example.com/docs/main')] },
        { hits: [hit('https://example.com/docs/api')] },
      ],
    });

    const results = await provider?.search('config');
    expect(results?.map(result => result.group)).toEqual(['main', 'api']);
    expect(results?.[0].result).toEqual([
      expect.objectContaining({ content: 'transformed' }),
    ]);
    expect(search).toHaveBeenCalledWith({
      requests: [
        {
          facetFilters: ['lang:en'],
          typoTolerance: false,
          indexName: 'main',
          query: 'config',
          hitsPerPage: 8,
        },
        {
          facetFilters: ['kind:api'],
          typoTolerance: false,
          indexName: 'api',
          query: 'config',
          hitsPerPage: 8,
        },
      ],
    });
    expect(transformItems).toHaveBeenCalledTimes(2);
  });

  test('does not create a provider without an index', () => {
    expect(setup({}).provider).toBeUndefined();
  });
});
