import { describe, expect, it } from '@rstest/core';
import { compile } from './processor';

describe('cjkFriendlyEmphasis', () => {
  it('should handle CJK emphasis by default', async () => {
    const result = await compile({
      source: '**中文文本（带括号）。**这句子继续也没问题。',
      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/index.mdx',
      config: null,
      pluginDriver: null,
      routeService: null,
    });
    // When CJK-friendly emphasis is enabled (default), `**...**` should be parsed as strong
    expect(result).toContain('"strong"');
  });

  it('should handle CJK emphasis when explicitly enabled', async () => {
    const result = await compile({
      source: '**中文文本（带括号）。**这句子继续也没问题。',
      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/index.mdx',
      config: { markdown: { cjkFriendlyEmphasis: true } },
      pluginDriver: null,
      routeService: null,
    });
    expect(result).toContain('"strong"');
  });

  it('should not handle CJK emphasis when disabled', async () => {
    const result = await compile({
      source: '**中文文本（带括号）。**这句子继续也没问题。',
      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/index.mdx',
      config: { markdown: { cjkFriendlyEmphasis: false } },
      pluginDriver: null,
      routeService: null,
    });
    // When CJK-friendly emphasis is disabled, `**...**` fails to parse as emphasis in CJK context
    expect(result).not.toContain('"strong"');
  });

  it('should handle CJK strikethrough with GFM', async () => {
    const result = await compile({
      source: '~~中文文本（带括号）。~~这句子继续也没问题。',
      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/index.mdx',
      config: null,
      pluginDriver: null,
      routeService: null,
    });
    // When CJK-friendly strikethrough is enabled (default), `~~...~~` should be parsed as del
    expect(result).toContain('"del"');
  });
});
