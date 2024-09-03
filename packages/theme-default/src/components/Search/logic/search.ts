import { normalizeHrefInRuntime as normalizeHref } from '@rspress/runtime';
import type { Header, PageIndexInfo, RemotePageInfo } from '@rspress/shared';
import {
  LOCAL_INDEX,
  type NormalizedSearchResultItem,
  type Provider,
} from './Provider';
import { LocalProvider } from './providers/LocalProvider';
import { RemoteProvider } from './providers/RemoteProvider';
import {
  type DefaultMatchResultItem,
  type MatchResult,
  RenderType,
  type SearchOptions,
} from './types';
import {
  backTrackHeaders,
  byteToCharIndex,
  getStrByteLength,
  normalizeTextCase,
} from './util';

const THRESHOLD_CONTENT_LENGTH = 100;

export class PageSearcher {
  #options: SearchOptions;

  #indexName: string = LOCAL_INDEX;

  #provider?: Provider;

  constructor(options: SearchOptions & { indexName?: string }) {
    this.#options = options;
    this.#indexName = options.indexName;
    switch (options.mode) {
      case 'remote':
        this.#provider = new RemoteProvider();
        break;
      default:
        this.#provider = new LocalProvider();
        break;
    }
  }

  async init() {
    await this.#provider?.init(this.#options);
  }

  async match(keyword: string, limit = 7) {
    const searchResult = await this.#provider?.search({ keyword, limit });
    const normaizedKeyWord = normalizeTextCase(keyword);
    const currentIndexInfo = searchResult?.find(res =>
      this.#isCurrentIndex(res.index),
    ) || {
      index: LOCAL_INDEX,
      renderType: RenderType.Default,
      hits: [],
    };

    const matchResult: MatchResult = [
      {
        group: this.#indexName,
        renderType: RenderType.Default,
        result: this.#matchResultItem(normaizedKeyWord, currentIndexInfo),
      },
      ...(
        searchResult?.filter(res => !this.#isCurrentIndex(res.index)) || []
      ).map(res => ({
        group: res.index,
        renderType: RenderType.Default,
        result: this.#matchResultItem(normaizedKeyWord, res),
      })),
    ];

    return matchResult;
  }

  #matchResultItem(
    normaizedKeyWord: string,
    resultItem: NormalizedSearchResultItem,
  ) {
    const matchedResult: DefaultMatchResultItem[] = [];
    resultItem?.hits.forEach(item => {
      // Title Match
      this.#matchTitle(item, normaizedKeyWord, matchedResult);
      // Header match
      const matchHeaderSet = this.#matchHeader(
        item,
        normaizedKeyWord,
        matchedResult,
      );
      // Content match
      this.#matchContent(item, normaizedKeyWord, matchedResult, matchHeaderSet);
    });
    return matchedResult;
  }

  #matchTitle(
    item: PageIndexInfo,
    query: string,
    matchedResult: DefaultMatchResultItem[],
  ): boolean {
    const { title = '' } = item;
    const normalizedTitle = normalizeTextCase(title);
    if (normalizedTitle.includes(query)) {
      matchedResult.push({
        type: 'title',
        title,
        header: title,
        link: `${item.domain}${normalizeHref(item.routePath)}`,
        query,
        highlightInfoList: [
          {
            start: normalizedTitle.indexOf(query),
            length: getStrByteLength(query),
          },
        ],
        group: this.#options.extractGroupName(item.routePath),
      });
      return true;
    }
    return false;
  }

  #matchHeader(
    item: PageIndexInfo,
    query: string,
    matchedResult: DefaultMatchResultItem[],
  ) {
    /**
     * 记录当前匹配到的 header，用于过滤后续的 content 匹配
     */
    const matchHeaderSet = new WeakSet<Header>();
    const { toc = [], domain = '', title = '' } = item;
    for (const [index, header] of toc.entries()) {
      const normalizedHeader = normalizeTextCase(header.text);
      if (normalizedHeader.includes(query)) {
        // Find the all parent headers
        // So we can show the full path of the header in search result
        // e.g. header2 > header3 > header4
        const headerGroup = backTrackHeaders(toc, index);
        const headerStr = headerGroup.map(item => item.text).join(' > ');
        const headerMatchIndex = normalizeTextCase(headerStr).indexOf(query);
        const titlePrefix = `${title} > `;

        matchedResult.push({
          type: 'header',
          title: item.title,
          header: `${titlePrefix}${headerStr}`,
          highlightInfoList: [
            {
              start: headerMatchIndex + titlePrefix.length,
              length: getStrByteLength(query),
            },
          ],
          link: `${domain}${normalizeHref(item.routePath)}#${header.id}`,
          query,
          group: this.#options.extractGroupName(item.routePath),
        });
        matchHeaderSet.add(header);
      }
    }
    return matchHeaderSet;
  }

  #matchContent(
    item: PageIndexInfo,
    query: string,
    matchedResult: DefaultMatchResultItem[],
    matchHeaderSet?: WeakSet<Header>,
  ) {
    const { content, toc, domain } = item;
    if (!content.length) {
      return;
    }
    const normalizedContent = normalizeTextCase(content);
    let queryIndex = normalizedContent.indexOf(query);
    const headersIndex = toc.map(h => h.charIndex);
    const getCurrentHeader = (currentIndex: number) => {
      const currentHeaderIndex = headersIndex.findIndex((hIndex, position) => {
        if (position < toc.length - 1) {
          const next = headersIndex[position + 1];
          if (hIndex <= currentIndex && next >= currentIndex) {
            return true;
          }
        } else {
          return hIndex < currentIndex;
        }
        return false;
      });
      return toc[currentHeaderIndex];
    };

    const isHeaderMatched = (header: Header) =>
      header && matchHeaderSet?.has(header);

    if (queryIndex === -1) {
      // In case fuzzy search
      // We get the matched content position from server response
      const hightlightItems = (item as RemotePageInfo)._matchesPosition
        ?.content;
      if (!hightlightItems?.length) {
        return;
      }
      const highlightStartIndex = (item as RemotePageInfo)._matchesPosition
        .content[0].start;
      const currentHeader = getCurrentHeader(highlightStartIndex);

      if (isHeaderMatched(currentHeader)) {
        return;
      }

      const statementStartIndex = byteToCharIndex(content, highlightStartIndex);
      const statementEndIndex = byteToCharIndex(
        content,
        highlightStartIndex + THRESHOLD_CONTENT_LENGTH,
      );
      const statement = content.slice(statementStartIndex, statementEndIndex);
      const highlightInfoList = (
        item as RemotePageInfo
      )._matchesPosition.content
        .filter(
          match =>
            match.start >= highlightStartIndex &&
            match.start + match.length <=
              highlightStartIndex + THRESHOLD_CONTENT_LENGTH,
        )
        .map(match => {
          const startCharIndex =
            byteToCharIndex(content, match.start) - statementStartIndex + 3;
          return {
            // prefix `...` length is 3
            start: startCharIndex,
            length: match.length,
          };
        });

      matchedResult.push({
        type: 'content',
        title: item.title,
        header: currentHeader?.text ?? item.title,
        link: `${domain}${normalizeHref(item.routePath)}${
          currentHeader ? `#${currentHeader.id}` : ''
        }`,
        query,
        highlightInfoList,
        group: this.#options.extractGroupName(item.routePath),
        statement: `...${statement}...`,
      });
      return;
    }
    while (queryIndex !== -1) {
      const currentHeader = getCurrentHeader(queryIndex);
      let statementStartIndex = content.slice(0, queryIndex).lastIndexOf('\n');
      statementStartIndex =
        statementStartIndex === -1 ? 0 : statementStartIndex;
      const statementEndIndex = content.indexOf(
        '\n\n',
        queryIndex + query.length,
      );
      let statement = content.slice(statementStartIndex, statementEndIndex);
      if (statement.length > THRESHOLD_CONTENT_LENGTH) {
        statement = this.#normalizeStatement(statement, query);
      }
      const highlightIndex = normalizeTextCase(statement).indexOf(query);
      const highlightInfoList = [
        {
          start: highlightIndex,
          length: getStrByteLength(query),
        },
      ];
      if (!isHeaderMatched(currentHeader)) {
        matchedResult.push({
          type: 'content',
          title: item.title,
          header: currentHeader?.text ?? item.title,
          statement,
          highlightInfoList,
          link: `${domain}${normalizeHref(item.routePath)}${
            currentHeader ? `#${currentHeader.id}` : ''
          }`,
          query,
          group: this.#options.extractGroupName(item.routePath),
        });
        // 同一区块只匹配一次
        currentHeader && matchHeaderSet?.add(currentHeader);
      }
      queryIndex = normalizedContent.indexOf(
        query,
        queryIndex + statement.length - highlightIndex,
      );
    }
  }

  #normalizeStatement(statement: string, query: string) {
    // If statement is too long, we will only show 120 characters
    const queryIndex = normalizeTextCase(statement).indexOf(
      normalizeTextCase(query),
    );
    const maxPrefixOrSuffix = Math.floor(
      (THRESHOLD_CONTENT_LENGTH - query.length) / 2,
    );
    let prefix = statement.slice(0, queryIndex);
    if (prefix.length > maxPrefixOrSuffix) {
      prefix = `...${statement.slice(
        queryIndex - maxPrefixOrSuffix + 3,
        queryIndex,
      )}`;
    }
    let suffix = statement.slice(queryIndex + query.length);
    if (suffix.length > maxPrefixOrSuffix) {
      suffix = `${statement.slice(
        queryIndex + query.length,
        queryIndex + maxPrefixOrSuffix - 3,
      )}...`;
    }
    return prefix + query + suffix;
  }

  #isCurrentIndex(index: string) {
    return index === this.#indexName || index === LOCAL_INDEX;
  }
}
