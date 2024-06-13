import { resolve as resolveUrl } from 'node:url';
import type { PageIndexInfo } from '@rspress/shared';
import type { Feed } from 'feed';
import { type ResolvedOutput, sortByDate } from './internals';
import type { FeedChannel, FeedOutputType, PluginRssOptions } from './type';

export function testPage(
  test: FeedChannel['test'],
  page: PageIndexInfo,
  base = '/',
): boolean {
  if (Array.isArray(test)) {
    return test.some(item => testPage(item, page, base));
  }
  if (typeof test === 'function') {
    return test(page, base);
  }
  const routePath = page.routePath;
  const pureRoutePath = `/${
    routePath.startsWith(base) ? routePath.slice(base.length) : routePath
  }`.replace(/^\/+/, '/');
  if (typeof test === 'string') {
    return [routePath, pureRoutePath].some(path => path.startsWith(test));
  }
  if (test instanceof RegExp) {
    return [routePath, pureRoutePath].some(path => test.test(path));
  }

  throw new Error(
    'test must be of `RegExp` or `string` or `(page: PageIndexInfo, base: string) => boolean`',
  );
}

export function getDefaultFeedOption() {
  return { id: 'blog', test: '/blog/' } satisfies FeedChannel;
}

export function getFeedFileType(type: FeedOutputType) {
  switch (type) {
    case 'rss':
      return {
        extension: 'rss',
        mime: 'application/rss+xml',
        getContent: (feed: Feed) => feed.rss2(),
      };
    case 'json':
      return {
        extension: 'json',
        mime: 'application/json',
        getContent: (feed: Feed) => feed.json1(),
      };
    case 'atom':
    default:
      return {
        extension: 'xml',
        mime: 'application/atom+xml',
        getContent: (feed: Feed) => feed.atom1(),
      };
  }
}
export function getOutputInfo(
  { id, output }: Pick<FeedChannel, 'id' | 'output'>,
  {
    siteUrl,
    output: globalOutput,
  }: Pick<PluginRssOptions, 'output' | 'siteUrl'>,
): ResolvedOutput {
  const type = output?.type || globalOutput?.type || 'atom';
  const { extension, mime, getContent } = getFeedFileType(type);
  const filename = output?.filename || `${id}.${extension}`;
  const dir = output?.dir || globalOutput?.dir || 'rss';
  const publicPath = output?.publicPath || globalOutput?.publicPath || siteUrl;
  const url = [publicPath, `${dir}/`, filename].reduce((u, part) =>
    u ? resolveUrl(u, part) : part,
  );
  const sorting =
    output?.sorting ||
    globalOutput?.sorting ||
    ((l, r) => sortByDate(l.date, r.date));
  return { type, mime, filename, getContent, dir, publicPath, url, sorting };
}
