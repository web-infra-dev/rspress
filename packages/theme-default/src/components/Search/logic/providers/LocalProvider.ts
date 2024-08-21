/**
 * The local search provider.
 * Powered by FlexSearch. https://github.com/nextapps-de/flexsearch
 */

import type {
  Document,
  EnrichedDocumentSearchResultSetUnit,
  IndexOptionsForDocumentSearch,
} from 'flexsearch';
import FlexSearchDocument from 'flexsearch/dist/module/document';
import searchIndexHash from 'virtual-search-index-hash';
import {
  type PageIndexInfo,
  removeTrailingSlash,
  SEARCH_INDEX_NAME,
} from '@rspress/shared';
import type { SearchOptions } from '../types';
import { LOCAL_INDEX, type Provider, type SearchQuery } from '../Provider';
import { normalizeTextCase } from '../util';

type FlexSearchDocumentWithType = Document<PageIndexInfo, true>;

interface PageIndexForFlexSearch extends PageIndexInfo {
  normalizedContent: string;
  headers: string;
  normalizedTitle: string;
}

const cjkRegex =
  /[\u3131-\u314e|\u314f-\u3163|\uac00-\ud7a3]|[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]|[\u3041-\u3096]|[\u30A1-\u30FA]/giu;
const cyrillicRegex = /[\u0400-\u04FF]/g;

function tokenize(str: string, regex) {
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

  #cyrilicIndex?: FlexSearchDocumentWithType;

  async #getPages(lang: string, version: string): Promise<PageIndexInfo[]> {
    const searchIndexGroupID = `${version}###${lang}`;
    const searchIndexVersion = version ? `.${version.replace('.', '_')}` : '';
    const searchIndexLang = lang ? `.${lang}` : '';

    const result = await fetch(
      `${removeTrailingSlash(__webpack_public_path__)}/static/${SEARCH_INDEX_NAME}${searchIndexVersion}${searchIndexLang}.${searchIndexHash[searchIndexGroupID]}.json`,
    );
    return result.json();
  }

  async init(options: SearchOptions) {
    const { currentLang, currentVersion } = options;
    const versioned = options.mode !== 'remote' && options.versioned;

    const pagesForSearch: PageIndexForFlexSearch[] = (
      await this.#getPages(currentLang, versioned ? currentVersion : '')
    ).map(page => ({
      ...page,
      normalizedContent: normalizeTextCase(page.content),
      headers: page.toc.map(header => normalizeTextCase(header.text)).join(' '),
      normalizedTitle: normalizeTextCase(page.title),
    }));
    const createOptions: IndexOptionsForDocumentSearch<PageIndexInfo[], true> =
      {
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
    this.#index = new FlexSearchDocument(createOptions);
    // CJK: Chinese, Japanese, Korean
    this.#cjkIndex = new FlexSearchDocument({
      ...createOptions,
      tokenize: (str: string) => tokenize(str, cjkRegex),
    });
    // Cyrilic Index
    this.#cyrilicIndex = new FlexSearchDocument({
      ...createOptions,
      tokenize: (str: string) => tokenize(str, cyrillicRegex),
    });
    for (const item of pagesForSearch) {
      this.#index.add(item);
      this.#cjkIndex.add(item);
      this.#cyrilicIndex.add(item);
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
      this.#index?.search<true>(keyword, limit, options),
      this.#cjkIndex?.search<true>(keyword, limit, options),
      this.#cyrilicIndex.search<true>(keyword, limit, options),
    ]);

    const commbindSeachResult: PageIndexInfo[] = [];
    const pushedId: Set<string> = new Set();

    function insertCommbindSearchResult(
      resultFromOneSearchIndex: EnrichedDocumentSearchResultSetUnit<PageIndexInfo>[],
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
          commbindSeachResult.push(resultItem.doc);
        });
      }
    }

    searchResult.forEach(searchResultItem => {
      insertCommbindSearchResult(searchResultItem);
    });

    return [
      {
        index: LOCAL_INDEX,
        hits: commbindSeachResult,
      },
    ];
  }
}
