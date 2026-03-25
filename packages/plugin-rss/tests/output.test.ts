import { describe, expect, test } from '@rstest/core';
import { Feed } from 'feed';
import { getOutputInfo, renderFeedContent } from '../src/options';
import type {
  FeedChannel,
  FeedOutputOptions,
  FeedOutputType,
  PluginRssOptions,
} from '../src/type';

const siteUrl = 'https://example.com/';

function createFeed() {
  const feed = new Feed({
    id: 'blog',
    title: 'Blog',
    link: siteUrl,
    description: 'Blog feed',
  });

  feed.addItem({
    id: 'hello-world',
    title: 'Hello World',
    link: `${siteUrl}blog/hello-world/`,
    date: new Date('2025-01-01T00:00:00.000Z'),
    description: 'Hello World',
  });

  return feed;
}

function createChannel(type: FeedOutputType, output?: FeedOutputOptions) {
  return {
    id: `blog-${type}`,
    test: '/blog/',
    output: {
      type,
      ...output,
    },
  } satisfies FeedChannel;
}

const transform: FeedOutputOptions['transform'] = (content, context) => {
  if (context.type === 'json') {
    return JSON.stringify({
      ...JSON.parse(content),
      foloId: context.channel.id,
    });
  }

  const closingTag = context.type === 'rss' ? '</channel>' : '</feed>';
  return content.replace(
    closingTag,
    `<folo:id>${context.channel.id}</folo:id>${closingTag}`,
  );
};

describe('plugin-rss output transform', () => {
  test('should apply the same transform hook to rss output', async () => {
    const channel = createChannel('rss', { transform });
    const output = getOutputInfo(channel, { siteUrl });

    const content = await renderFeedContent(createFeed(), channel, output);

    expect(content).toContain('<rss');
    expect(content).toContain('<folo:id>blog-rss</folo:id>');
  });

  test('should apply the same transform hook to atom output', async () => {
    const channel = createChannel('atom', { transform });
    const output = getOutputInfo(channel, { siteUrl });

    const content = await renderFeedContent(createFeed(), channel, output);

    expect(content).toContain('<feed');
    expect(content).toContain('<folo:id>blog-atom</folo:id>');
  });

  test('should apply the same transform hook to json output', async () => {
    const channel = createChannel('json', { transform });
    const output = getOutputInfo(channel, { siteUrl });

    const content = await renderFeedContent(createFeed(), channel, output);

    expect(JSON.parse(content)).toMatchObject({
      foloId: 'blog-json',
    });
  });

  test('should use the top-level output transform by default', async () => {
    const channel = createChannel('rss');
    const output = getOutputInfo(channel, {
      siteUrl,
      output: {
        transform,
      },
    } satisfies Pick<PluginRssOptions, 'output' | 'siteUrl'>);

    const content = await renderFeedContent(createFeed(), channel, output);

    expect(content).toContain('<folo:id>blog-rss</folo:id>');
  });

  test('should prefer the feed-level transform over the top-level one', async () => {
    const channel = createChannel('rss', {
      transform: content =>
        content.replace('</channel>', '<feed:id>local</feed:id></channel>'),
    });
    const output = getOutputInfo(channel, {
      siteUrl,
      output: {
        transform,
      },
    } satisfies Pick<PluginRssOptions, 'output' | 'siteUrl'>);

    const content = await renderFeedContent(createFeed(), channel, output);

    expect(content).toContain('<feed:id>local</feed:id>');
    expect(content).not.toContain('<folo:id>blog-rss</folo:id>');
  });
});
