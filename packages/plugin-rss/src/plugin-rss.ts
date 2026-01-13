/// <reference path="../index.d.ts" />

import NodePath from 'node:path';
import { resolve as resolveUrl } from 'node:url';
import type { PageIndexInfo, RspressPlugin, UserConfig } from '@rspress/core';
import { getIconUrlPath } from '@rspress/core';
import { Feed } from 'feed';

import { createFeed, generateFeedItem } from './createFeed';
import { PluginComponents, PluginName } from './exports';
import {
  concatArray,
  extractHtmlContent,
  type ResolvedOutput,
  readFile,
  routePathToHtmlPath,
  writeFile,
} from './internals';
import { getDefaultFeedOption, getOutputInfo, testPage } from './options';
import type { FeedChannel, FeedItem, PluginRssOptions } from './type';

type FeedItemWithChannel = FeedItem & { channel: string };
type TransformedFeedChannel = FeedChannel & { output: ResolvedOutput };

class FeedsSet {
  feeds: TransformedFeedChannel[] = [];
  feedsMapById: Record<string, TransformedFeedChannel> = Object.create(null);
  set({ feed, output, siteUrl }: PluginRssOptions, config: UserConfig) {
    this.feeds = (
      Array.isArray(feed) ? feed : [{ ...getDefaultFeedOption(), ...feed }]
    ).map(options => ({
      title: config.title || '',
      description: config.description || '',
      favicon: config.icon && resolveUrl(siteUrl, getIconUrlPath(config.icon)),
      copyright: config.themeConfig?.footer?.message || '',
      link: siteUrl,
      docs: '',
      ...options,
      output: getOutputInfo(options, { siteUrl, output }),
    }));

    this.feedsMapById = this.feeds.reduce(
      (m, f) => ({ ...m, [f.id]: f }),
      Object.create(null),
    );
  }
  get(): TransformedFeedChannel[];
  get(id: string): TransformedFeedChannel | null;
  get(id?: string): TransformedFeedChannel[] | TransformedFeedChannel | null {
    if (id) {
      return this.feedsMapById[id] || null;
    }
    return this.feeds.slice(0);
  }
}

interface PageRssInfo {
  page: PageIndexInfo;
  channels: string[];
}

async function getRssItems(
  feeds: TransformedFeedChannel[],
  page: PageIndexInfo,
  siteUrl: string,
  htmlContent: string | null,
): Promise<FeedItemWithChannel[]> {
  return Promise.all(
    feeds
      .filter(options => testPage(options.test, page))
      .map(async options => {
        const after = options.item || ((feed: FeedItem) => feed);
        const item = await after(
          generateFeedItem(page, siteUrl, htmlContent),
          page,
        );
        return { ...item, channel: options.id };
      }),
  );
}

export function pluginRss(pluginRssOptions: PluginRssOptions): RspressPlugin {
  const feedsSet = new FeedsSet();

  /**
   * Store page data for generating RSS items in afterBuild
   * Key: routePath, Value: PageRssInfo
   */
  let _pagesForRss: null | Map<string, PageRssInfo> = null;

  return {
    name: PluginName,
    globalUIComponents: Object.values(PluginComponents),
    beforeBuild(config, isProd) {
      if (!isProd) {
        _pagesForRss = null;
        return;
      }

      // RSS plugin requires SSG to be enabled
      const enableSSG = Boolean((config.ssg || config.llms) ?? true);
      if (!enableSSG) {
        throw new Error(
          '[plugin-rss] RSS plugin requires SSG to be enabled. ' +
            'Please set `ssg: true` in your rspress.config.ts or remove the RSS plugin.',
        );
      }

      _pagesForRss = new Map();
      feedsSet.set(pluginRssOptions, config);
    },
    async extendPageData(pageData) {
      if (!_pagesForRss) return;

      // Find which feeds this page belongs to
      const matchedChannels = feedsSet
        .get()
        .filter(options => testPage(options.test, pageData))
        .map(options => options.id);

      if (matchedChannels.length > 0) {
        _pagesForRss.set(pageData.routePath, {
          page: pageData,
          channels: matchedChannels,
        });
      }

      // Set up feed links for the page
      const showRssList = new Set(
        concatArray(pageData.frontmatter['link-rss'] as string[] | string),
      );
      for (const channel of matchedChannels) {
        showRssList.add(channel);
      }

      pageData.feeds = Array.from(showRssList, id => {
        const feedChannel = feedsSet.get(id);
        if (!feedChannel) return null;
        const { output, language } = feedChannel;
        return {
          url: output.url,
          mime: output.mime,
          language: language || pageData.lang,
        };
      }).filter(Boolean) as typeof pageData.feeds;
    },
    async afterBuild(config) {
      if (!_pagesForRss) return;

      const outDir = config.outDir || 'doc_build';
      const feeds: Record<string, Feed> = Object.create(null);

      // Process each page: read HTML from SSG output and generate feed items
      for (const [routePath, { page, channels }] of _pagesForRss) {
        // Read HTML content from SSG output
        const htmlPath = NodePath.resolve(
          outDir,
          routePathToHtmlPath(routePath),
        );
        const htmlFile = await readFile(htmlPath);
        const htmlContent = htmlFile ? extractHtmlContent(htmlFile) : null;

        // Generate feed items for each channel
        const items = await getRssItems(
          channels.map(id => feedsSet.get(id)!),
          page,
          pluginRssOptions.siteUrl,
          htmlContent,
        );

        for (const { channel, ...item } of items) {
          feeds[channel] =
            feeds[channel] ||
            new Feed(createFeed(feedsSet.get(channel)!, config));
          feeds[channel].addItem(item);
        }
      }

      // Write feed files
      for (const [channel, feed] of Object.entries(feeds)) {
        const { output } = feedsSet.get(channel)!;
        feed.items.sort(output.sorting);
        const path = NodePath.resolve(outDir, output.dir, output.filename);
        await writeFile(path, output.getContent(feed));
      }

      _pagesForRss = null;
    },
  };
}
