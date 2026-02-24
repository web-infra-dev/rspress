/**
 * The local search provider.
 * Powered by FlexSearch. https://github.com/nextapps-de/flexsearch
 */

import {
  type PageIndexInfo,
  removeTrailingSlash,
  SEARCH_INDEX_NAME,
} from '@rspress/shared';
// https://github.com/nextapps-de/flexsearch/issues/438
import {
  Document,
  type DocumentOptions,
  type DocumentValue,
  type EnrichedDocumentSearchResults,
} from 'flexsearch';
import { searchIndexHash } from 'virtual-page-data';
import { LOCAL_INDEX, type Provider, type SearchQuery } from '../Provider';
import type { SearchOptions } from '../types';
import { normalizeTextCase } from '../util';

interface PageIndexForFlexSearch extends PageIndexInfo {
  normalizedContent: string;
  headers: string;
  normalizedTitle: string;
}

// Create a type that satisfies DocumentData constraints by mapping all properties
// to DocumentValue | DocumentValue[] while preserving the original structure
type FlexSearchCompatibleData = {
  [K in keyof PageIndexForFlexSearch]: PageIndexForFlexSearch[K] extends DocumentValue
    ? PageIndexForFlexSearch[K]
    : DocumentValue;
} & {
  [key: string]: DocumentValue | DocumentValue[];
};

type FlexSearchDocumentWithType = Document<
  FlexSearchCompatibleData,
  false,
  false
>;

const cjkRegex =
  /[\u3131-\u314e|\u314f-\u3163|\uac00-\ud7a3]|[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]|[\u3041-\u3096]|[\u30A1-\u30FA]/giu;
const cyrillicRegex = /[\u0400-\u04FF]/g;

function tokenize(str: string, regex: RegExp) {
  const words: string[] = [];
  let m: RegExpExecArray | null = null;
  do {
    m = regex.exec(str);
    if (m) {
      words.push(m[0]);
    }
  } while (m);
  return words;
}

export class LocalProvider implements Provider {
  #index?: FlexSearchDocumentWithType;

  #cjkIndex?: FlexSearchDocumentWithType;

  #cyrillicIndex?: FlexSearchDocumentWithType;

  #fetchPromise?: Promise<PageIndexInfo[]>;

  async #getPages(lang: string, version: string): Promise<PageIndexInfo[]> {
    const searchIndexGroupID = `${version ?? ''}###${lang ?? ''}`;

    // for example, in page-type-home fixture, there is only home index.md, so no search index generated
    if (!searchIndexHash[searchIndexGroupID]) {
      return [];
    }

    const searchIndexVersion = version ? `.${version.replace('.', '_')}` : '';
    const searchIndexLang = lang ? `.${lang}` : '';
    const searchIndexURL = `${removeTrailingSlash(__WEBPACK_PUBLIC_PATH__)}/static/${SEARCH_INDEX_NAME}${searchIndexVersion}${searchIndexLang}.${searchIndexHash[searchIndexGroupID]}.json`;

    const handleError = (result: unknown) => {
      console.error(
        'Failed to fetch search index, please reload the page and try again.',
      );
      console.error(result);
    };

    try {
      const result = await fetch(searchIndexURL);
      if (result.ok) {
        return result.json();
      }
      handleError(result);
    } catch (error) {
      handleError(error);
    }
    return [];
  }

  async fetchSearchIndex(options: SearchOptions) {
    if (this.#fetchPromise) {
      return this.#fetchPromise;
    }

    const { currentLang, currentVersion } = options;
    const versioned = options.versioned ?? true;

    this.#fetchPromise = this.#getPages(
      currentLang,
      versioned ? currentVersion : '',
    );

    return this.#fetchPromise;
  }

  async init(options: SearchOptions) {
    const pagesForSearch: PageIndexForFlexSearch[] = (
      await this.fetchSearchIndex(options)
    ).map(page => ({
      ...page,
      normalizedContent: normalizeTextCase(page.content),
      headers: page.toc.map(header => normalizeTextCase(header.text)).join(' '),
      normalizedTitle: normalizeTextCase(page.title),
    }));

    const createOptions: DocumentOptions<
      FlexSearchCompatibleData,
      false,
      false
    > = {
      tokenize: 'full',
      document: {
        id: 'id',
        store: true,
        index: ['normalizedTitle', 'headers', 'normalizedContent'],
      },
      cache: 100,
      // charset: {
      //   split: /\W+/,
      // },
    };
    // Init Search Indexes
    // English Index
    this.#index = new Document(createOptions);
    // CJK: Chinese, Japanese, Korean
    this.#cjkIndex = new Document({
      ...createOptions,
      encoder: {
        finalize: (str: string[]) => str.flatMap(s => tokenize(s, cjkRegex)),
      },
    });
    // Cyrillic Index
    this.#cyrillicIndex = new Document({
      ...createOptions,
      encoder: {
        finalize: (str: string[]) =>
          str.flatMap(s => tokenize(s, cyrillicRegex)),
      },
    });
    for (const item of pagesForSearch) {
      // Add search index async to avoid blocking the main thread
      // Type assertion: PageIndexForFlexSearch is compatible with FlexSearchCompatibleData at runtime
      const flexSearchItem = item as unknown as FlexSearchCompatibleData;
      this.#index!.addAsync(item.routePath, flexSearchItem);
      this.#cjkIndex!.addAsync(item.routePath, flexSearchItem);
      this.#cyrillicIndex!.addAsync(item.routePath, flexSearchItem);
    }
  }

  async search(query: SearchQuery) {
    const { keyword, limit } = query;

    const options = {
      enrich: true as const,
      limit,
      index: ['normalizedTitle', 'headers', 'normalizedContent'],
    };

    const searchResult = await Promise.all([
      this.#index?.searchAsync(keyword, options),
      this.#cjkIndex?.searchAsync(keyword, options),
      this.#cyrillicIndex?.searchAsync(keyword, options),
    ]);

    const combinedSearchResult: PageIndexInfo[] = [];
    const pushedId: Set<string> = new Set();

    function insertCombinedSearchResult(
      resultFromOneSearchIndex: EnrichedDocumentSearchResults<FlexSearchCompatibleData>,
    ) {
      for (const item of resultFromOneSearchIndex) {
        // item.field; // ignored
        item.result.forEach(resultItem => {
          // type of resultItem doesn't match with runtime
          const id = resultItem.id as unknown as string;
          if (pushedId.has(id)) {
            return;
          }
          // mark the doc is in the searched results
          pushedId.add(id);
          if (resultItem.doc) {
            // Type assertion: FlexSearchCompatibleData is compatible with PageIndexInfo at runtime
            combinedSearchResult.push(
              resultItem.doc as unknown as PageIndexInfo,
            );
          }
        });
      }
    }

    searchResult.forEach(searchResultItem => {
      searchResultItem && insertCombinedSearchResult(searchResultItem);
    });

    return [
      {
        index: LOCAL_INDEX,
        hits: combinedSearchResult,
      },
    ];
  }
}
