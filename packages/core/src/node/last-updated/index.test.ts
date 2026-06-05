import type { PageIndexInfo } from '@rspress/shared';
import { beforeEach, describe, expect, it, rs } from '@rstest/core';
import { execa } from 'execa';
import { pluginLastUpdated } from './index';

rs.mock('execa', () => ({
  execa: rs.fn(async () => ({
    stdout: '100\nAlice\nalice@example.com',
  })),
}));

type TestPageIndexInfo = PageIndexInfo & {
  lastUpdatedTime?: string;
  lastUpdatedAuthor?: string;
};

const pageData = (): TestPageIndexInfo =>
  ({
    _filepath: 'docs/index.mdx',
    lang: 'en',
  }) as TestPageIndexInfo;

describe('pluginLastUpdated', () => {
  beforeEach(() => {
    rs.clearAllMocks();
  });

  it('should only add last updated time by default', async () => {
    const data = pageData();

    await pluginLastUpdated().extendPageData?.(data, true);

    expect(data.lastUpdatedTime).toBe(new Date(100000).toLocaleString('en'));
    expect(data.lastUpdatedAuthor).toBeUndefined();
  });

  it('should add author name when author is enabled', async () => {
    const data = pageData();

    await pluginLastUpdated(true).extendPageData?.(data, true);

    expect(data.lastUpdatedAuthor).toBe('Alice');
  });

  it('should support custom author display text', async () => {
    const data = pageData();

    await pluginLastUpdated(({ name, email, filePath }) => {
      return `${name} <${email}> ${filePath}`;
    }).extendPageData?.(data, true);

    expect(data.lastUpdatedAuthor).toBe(
      'Alice <alice@example.com> docs/index.mdx',
    );
  });

  it('should pass file path to git log', async () => {
    const data = pageData();

    await pluginLastUpdated().extendPageData?.(data, true);

    expect(execa).toHaveBeenCalledWith('git', [
      'log',
      '-1',
      '--format=%at%n%an%n%ae',
      '--',
      'docs/index.mdx',
    ]);
  });
});
