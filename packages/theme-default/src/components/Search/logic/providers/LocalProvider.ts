/**
 * The local search provider.
 * Powered by FlexSearch. https://github.com/nextapps-de/flexsearch
 */

import type { CreateOptions, Index as SearchIndex } from 'flexsearch';
import FlexSearch from 'flexsearch';
import searchIndexHash from 'virtual-search-index-hash';
import { PageIndexInfo, SEARCH_INDEX_NAME } from '@rspress/shared';
import { SearchOptions } from '../types';
import { LOCAL_INDEX, Provider, SearchQuery } from '../Provider';
import { normalizeTextCase } from '../util';

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
  #index?: SearchIndex<PageIndexInfo[]>;

  #cjkIndex?: SearchIndex<PageIndexInfo[]>;

  #cyrilicIndex?: SearchIndex<PageIndexInfo[]>;

  async #getPages(lang: string, version: string): Promise<PageIndexInfo[]> {
    const searchIndexGroupID = `${version}###${lang}`;
    const searchIndexVersion = version ? `.${version.replace('.', '_')}` : '';
    const searchIndexLang = lang ? `.${lang}` : '';

    const result = await fetch(
      `${process.env.__ASSET_PREFIX__}/static/${SEARCH_INDEX_NAME}${searchIndexVersion}${searchIndexLang}.${searchIndexHash[searchIndexGroupID]}.json`,
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
    const createOptions: CreateOptions = {
      tokenize: 'full',
      async: true,
      doc: {
        id: 'routePath',
        field: ['normalizedTitle', 'headers', 'normalizedContent'],
      },
      cache: 100,
      split: /\W+/,
    };
    // Init Search Indexes
    // English Index
    this.#index = FlexSearch.create(createOptions);
    // CJK: Chinese, Japanese, Korean
    this.#cjkIndex = FlexSearch.create({
      ...createOptions,
      tokenize: (str: string) => tokenize(str, cjkRegex),
    });
    // Cyrilic Index
    this.#cyrilicIndex = FlexSearch.create({
      ...createOptions,
      tokenize: (str: string) => tokenize(str, cyrillicRegex),
    });
    this.#index.add(pagesForSearch);
    this.#cjkIndex.add(pagesForSearch);
    this.#cyrilicIndex.add(pagesForSearch);
  }

  async search(query: SearchQuery) {
    const { keyword, limit } = query;
    const searchParams = {
      query: keyword,
      limit,
      field: ['normalizedTitle', 'headers', 'normalizedContent'],
    };

    const searchResult = await Promise.all([
      this.#index?.search(searchParams),
      this.#cjkIndex?.search(searchParams),
      this.#cyrilicIndex.search(searchParams),
    ]);

    const flattenSearchResult = searchResult.flat(2).filter(Boolean);

    // There may be duplicate search results when there are multiple languages ​​in the search keyword
    const uniqueSearchResult = Array.from(
      new Set(flattenSearchResult.map(item => item.id)),
    ).map(id => {
      return flattenSearchResult.find(item => item.id === id);
    });

    return [
      {
        index: LOCAL_INDEX,
        hits: uniqueSearchResult,
      },
    ];
  }
}
