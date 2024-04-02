import type { PageIndexInfo } from '@rspress/shared';
import type { Feed } from 'feed';
import type { FeedOutputType, PageFeedData } from '../type';

export type PageWithFeeds = PageIndexInfo & { feeds: PageFeedData[] };

export interface ResolvedOutput {
  type: FeedOutputType;
  mime: string;
  filename: string;
  getContent: (feed: Feed) => string;
  dir: string;
  publicPath: string;
  url: string;
}
