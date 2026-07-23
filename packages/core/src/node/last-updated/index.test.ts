import path from 'node:path';
import type { PageIndexInfo, RouteMeta, RspressPlugin } from '@rspress/shared';
import { beforeEach, describe, expect, it, rs } from '@rstest/core';
import { execa } from 'execa';
import { pluginLastUpdated } from './index';

rs.mock('execa', () => {
  // A commit as printed by `--pretty=format:%x00%at%x00%an%x00%ae --name-only`,
  // commits being separated by an empty line.
  const commit = (at: number, name: string, email: string, files: string[]) => [
    `\u0000${at}\u0000${name}\u0000${email}`,
    ...files,
    '',
  ];
  const stdout = [
    ...commit(100, 'Alice', 'alice@example.com', [
      'index.mdx',
      'guide/nested.mdx',
    ]),
    ...commit(50, 'Bob', 'bob@example.com', ['index.mdx', 'guide/legacy.mdx']),
  ].join('\n');

  return { execa: rs.fn(async () => ({ stdout })) };
});

const DOC_ROOT = path.join(process.cwd(), 'docs');

const docPath = (relativePath: string) => path.join(DOC_ROOT, relativePath);

type TestPageIndexInfo = PageIndexInfo & {
  lastUpdatedTime?: string;
  lastUpdatedAuthor?: string;
};

const pageData = (relativePath = 'index.mdx'): TestPageIndexInfo =>
  ({
    _filepath: docPath(relativePath),
    lang: 'en',
  }) as TestPageIndexInfo;

/**
 * `routeGenerated` is what gives the plugin the whole page list, it always runs
 * before the page data is created.
 */
async function extendPages(plugin: RspressPlugin, pages: TestPageIndexInfo[]) {
  await plugin.routeGenerated?.(
    pages.map(page => ({ absolutePath: page._filepath }) as RouteMeta),
  );
  await Promise.all(pages.map(page => plugin.extendPageData?.(page, true)));
}

describe('pluginLastUpdated', () => {
  beforeEach(() => {
    rs.clearAllMocks();
  });

  it('should only add last updated time by default', async () => {
    const data = pageData();

    await extendPages(pluginLastUpdated(), [data]);

    expect(data.lastUpdatedTime).toBe(new Date(100000).toLocaleString('en'));
    expect(data.lastUpdatedAuthor).toBeUndefined();
  });

  it('should add author name when author is enabled', async () => {
    const data = pageData();

    await extendPages(pluginLastUpdated(true), [data]);

    expect(data.lastUpdatedAuthor).toBe('Alice');
  });

  it('should support custom author display text', async () => {
    const data = pageData();

    await extendPages(
      pluginLastUpdated(({ name, email, filePath }) => {
        return `${name} <${email}> ${filePath}`;
      }),
      [data],
    );

    expect(data.lastUpdatedAuthor).toBe(
      `Alice <alice@example.com> ${docPath('index.mdx')}`,
    );
  });

  it('should read the git log of the doc directory in one pass', async () => {
    await extendPages(pluginLastUpdated(), [pageData()]);

    expect(execa).toHaveBeenCalledWith(
      'git',
      [
        '-c',
        'core.quotePath=false',
        'log',
        '--pretty=format:%x00%at%x00%an%x00%ae',
        '--name-only',
        '--no-renames',
        '--relative',
        '--',
        '.',
      ],
      { cwd: DOC_ROOT },
    );
  });

  it('should spawn a single git process whatever the page count is', async () => {
    const pages = [
      pageData('guide/nested.mdx'),
      ...Array.from({ length: 100 }, (_, i) => pageData(`page-${i}.mdx`)),
    ];

    await extendPages(pluginLastUpdated(true), pages);

    expect(execa).toHaveBeenCalledTimes(1);
    // The pages are still resolved from that single git log.
    expect(pages[0].lastUpdatedAuthor).toBe('Alice');
  });

  it('should take the most recent commit of each file', async () => {
    // `index.mdx` belongs to both commits, `guide/legacy.mdx` to the older one.
    const updatedTwice = pageData('index.mdx');
    const updatedOnce = pageData('guide/legacy.mdx');

    await extendPages(pluginLastUpdated(true), [updatedTwice, updatedOnce]);

    expect(updatedTwice.lastUpdatedTime).toBe(
      new Date(100000).toLocaleString('en'),
    );
    expect(updatedTwice.lastUpdatedAuthor).toBe('Alice');
    expect(updatedOnce.lastUpdatedTime).toBe(
      new Date(50000).toLocaleString('en'),
    );
    expect(updatedOnce.lastUpdatedAuthor).toBe('Bob');
  });

  it('should leave pages without any commit untouched', async () => {
    const data = pageData('untracked.mdx');

    await extendPages(pluginLastUpdated(true), [data]);

    expect(data.lastUpdatedTime).toBeUndefined();
    expect(data.lastUpdatedAuthor).toBeUndefined();
  });
});
