import type { PageIndexInfo } from '@rspress/shared';
import type { FeedOptions, Item } from 'feed';
import type { PartialPartial } from './internals';

/**
 * feed information attached in `PageIndexInfo['feeds']` array
 */
export interface PageFeedData {
  url: string;
  language: string;
  mime: string;
}

export type FeedItem = Item;

/**
 * output feed file type
 */
export type FeedOutputType =
  | /** Atom 1.0 Feed */ 'atom'
  | /** RSS 2.0 Feed */ 'rss'
  | /** JSON1 Feed */ 'json';

/**
 * output config of a feed.
 * a feed will be written into path `${rspress.outDir || 'doc_build'}/${dir}/${filename}`
 */
export interface FeedOutputOptions {
  /**
   * output dir of feed files, relative to rspress's outDir
   */
  dir?: string;
  /**
   * type of feed files
   */
  type?: FeedOutputType;
  /**
   * base filename of feed files. `${id}.${extension by type}` by default.
   */
  filename?: string;
  /**
   * public path of feed files. siteUrl by default
   */
  publicPath?: string;
  /**
   * sort feed items
   */
  sorting?: (left: FeedItem, right: FeedItem) => number;
}

export interface FeedChannel
  extends PartialPartial<FeedOptions, 'title' | 'copyright'> {
  /**
   * used as the basename of rss file, should be unique
   **/
  id: string;
  /**
   * to match pages that should be listed in this feed
   * if RegExp is given, it will match against the route path of each page
   **/
  test:
    | RegExp
    | string
    | (RegExp | string)[]
    | ((item: PageIndexInfo, base: string) => boolean);
  /**
   * a function to modify feed item
   * @param item pre-generated feed item
   * @param page page data
   * @param base base path of the rspress site
   * @returns modified feed item
   */
  item?: (
    item: FeedItem,
    page: PageIndexInfo,
    base: string,
  ) => FeedItem | PromiseLike<FeedItem>;
  /**
   * feed level output config
   */
  output?: FeedOutputOptions;
}

/**
 * plugin options for `pluginRss`
 */
export interface PluginRssOptions {
  /**
   * site url of this rspress site. it will be used in feed files and feed link.
   * @requires
   */
  siteUrl: string;
  /**
   * Feed options for each rss. If array is given, this plugin will produce multiple feed files.
   * @default {{ id: 'blog', test: /^\/blog\// }}
   */
  feed?: PartialPartial<FeedChannel, 'id' | 'test'> | FeedChannel[];
  /**
   * output config for all feed files
   */
  output?: Omit<FeedOutputOptions, 'filename'>;
}
