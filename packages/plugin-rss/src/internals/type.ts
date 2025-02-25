import type { Feed } from 'feed';
import type { FeedItem, FeedOutputType } from '../type';

export interface ResolvedOutput {
  type: FeedOutputType;
  mime: string;
  filename: string;
  getContent: (feed: Feed) => string;
  dir: string;
  publicPath: string;
  url: string;
  sorting: (left: FeedItem, right: FeedItem) => number;
}
