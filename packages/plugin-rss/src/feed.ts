import { resolve as resolveUrl } from 'node:url';
import type { PageIndexInfo, UserConfig } from '@rspress/shared';
import type { FeedOptions } from 'feed';
import {
  ResolvedOutput,
  concatArray,
  selectNonNullishProperty,
  toDate,
} from './internals';
import type { FeedChannel, FeedItem } from './type';

/**
 * @public
 * @param page Rspress Page Data
 * @param siteUrl
 */
export function generateFeedItem(page: PageIndexInfo, siteUrl: string) {
  const { frontmatter: fm } = page;
  return {
    title: selectNonNullishProperty(fm.title, page.title) || '',
    id: selectNonNullishProperty(page.id) || '',
    link: resolveUrl(
      siteUrl,
      selectNonNullishProperty(fm.permalink, page.routePath) || '',
    ),
    description: selectNonNullishProperty(fm.description) || '',
    content: selectNonNullishProperty(fm.summary, page.content) || '',
    date: toDate((fm.date as string) || (fm.published_at as string))!,
    category: concatArray(fm.categories as string[], fm.category as string).map(
      cat => ({ name: cat }),
    ),
  } satisfies FeedItem;
}

export function createFeed(
  options: Omit<FeedChannel, 'test' | 'item' | 'output'> & {
    item?: any;
    test?: any;
    output: ResolvedOutput;
  },
  config: UserConfig,
): FeedOptions {
  const { output, item, id, title, ..._options } = options;
  return {
    id,
    copyright: config.themeConfig?.footer?.message || '',
    description: config.description || '',
    link: output.url,
    ..._options,
    title: title || config.title || '',
  };
}
