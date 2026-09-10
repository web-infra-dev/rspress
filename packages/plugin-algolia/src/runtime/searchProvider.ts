import type {
  DocSearchHit,
  DocSearchIndex,
  DocSearchProps,
  DocSearchTransformClient,
} from '@docsearch/react';
import { removeBase } from '@rspress/core/runtime';
import type { SearchProvider } from '@rspress/core/theme';
import type { SearchResponses } from 'algoliasearch/lite';

function getIndices({
  indexName,
  indices,
  searchParameters,
}: DocSearchProps): DocSearchIndex[] {
  if (indices?.length) {
    return indices.map(index =>
      typeof index === 'string'
        ? { name: index, searchParameters }
        : {
            ...index,
            searchParameters: {
              ...searchParameters,
              ...index.searchParameters,
            },
          },
    );
  }
  return indexName ? [{ name: indexName, searchParameters }] : [];
}

export function normalizeDocSearchItems(items: DocSearchHit[]): DocSearchHit[] {
  return items.map(item => {
    const url = new URL(item.url);
    return {
      ...item,
      url: removeBase(item.url.replace(url.origin, '')),
    };
  });
}

export function createAlgoliaSearchProvider(
  docSearchProps: DocSearchProps,
  searchClient: DocSearchTransformClient,
): SearchProvider | undefined {
  const indices = getIndices(docSearchProps);
  if (!indices.length) {
    return undefined;
  }

  const transformItems =
    docSearchProps.transformItems ?? normalizeDocSearchItems;
  const defaultLimit = docSearchProps.maxResultsPerGroup ?? 20;

  return {
    async search(query, limit = defaultLimit) {
      const response: SearchResponses<DocSearchHit> =
        await searchClient.search<DocSearchHit>({
          requests: indices.map(index => ({
            ...index.searchParameters,
            indexName: index.name,
            query,
            hitsPerPage: limit,
          })),
        });

      return response.results.map((result, index) => ({
        group: indices[index].name,
        result:
          'hits' in result ? transformItems(result.hits as DocSearchHit[]) : [],
      }));
    },
  };
}
