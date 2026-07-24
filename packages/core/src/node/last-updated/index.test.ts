import path from 'node:path';
import type { PageIndexInfo, RouteMeta, RspressPlugin } from '@rspress/shared';
import { beforeEach, describe, expect, it, rs } from '@rstest/core';
import { execa } from 'execa';
import { pluginLastUpdated } from './index';

rs.mock('execa', () => {
  // A commit as printed by `--pretty=format:%x00%at%x00%an%x00%ae --name-only`,
  // commits being separated by an empty line and paths being relative to the
  // repository root.
  const commit = (at: number, name: string, email: string, files: string[]) => [
    `\u0000${at}\u0000${name}\u0000${email}`,
    ...files,
    '',
  ];
  const stdout = [
    ...commit(100, 'Alice', 'alice@example.com', [
      'docs/index.mdx',
      'docs/guide/nested.mdx',
    ]),
    ...commit(50, 'Bob', 'bob@example.com', [
      'docs/index.mdx',
      'docs/guide/legacy.mdx',
    ]),
  ].join('\n');

  return {
    execa: rs.fn(async (_file: string, args: string[]) =>
      args[0] === 'rev-parse' ? { stdout: 'docs/\n' } : { stdout },
    ),
  };
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

    expect(execa).toHaveBeenNthCalledWith(
      1,
      'git',
      ['rev-parse', '--show-prefix'],
      { cwd: DOC_ROOT },
    );
    expect(execa).toHaveBeenNthCalledWith(
      2,
      'git',
      [
        '-c',
        'core.quotePath=false',
        'log',
        '--pretty=format:%x00%at%x00%an%x00%ae',
        '--name-only',
        '--cc',
        '--no-renames',
        '--',
        '.',
      ],
      { cwd: DOC_ROOT },
    );
  });

  it('should spawn a fixed number of git processes whatever the page count is', async () => {
    const pages = [
      pageData('guide/nested.mdx'),
      ...Array.from({ length: 100 }, (_, i) => pageData(`page-${i}.mdx`)),
    ];

    await extendPages(pluginLastUpdated(true), pages);

    // One `rev-parse` for the repository root and one `log` for the site.
    expect(execa).toHaveBeenCalledTimes(2);
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

  it('should fall back to the repository root when the common directory is outside of it', async () => {
    const mocked = execa as unknown as ReturnType<typeof rs.fn>;
    // The common directory of the pages is `/`, outside of any repository.
    mocked.mockRejectedValueOnce(new Error('fatal: not a git repository'));
    const inRepo = pageData();
    const outsideRepo = {
      _filepath: path.parse(DOC_ROOT).root + 'external.mdx',
      lang: 'en',
    } as TestPageIndexInfo;

    await extendPages(pluginLastUpdated(true), [inRepo, outsideRepo]);

    expect(execa).toHaveBeenCalledTimes(3);
    // The retried `rev-parse` runs from the directory holding the most pages,
    // and the log walks the repository it found.
    expect(execa).toHaveBeenNthCalledWith(
      2,
      'git',
      ['rev-parse', '--show-prefix'],
      { cwd: DOC_ROOT },
    );
    expect(execa).toHaveBeenNthCalledWith(
      3,
      'git',
      expect.arrayContaining(['log']),
      {
        cwd: process.cwd(),
      },
    );
    expect(inRepo.lastUpdatedAuthor).toBe('Alice');
    expect(outsideRepo.lastUpdatedTime).toBeUndefined();
  });

  it('should leave pages without any commit untouched', async () => {
    const data = pageData('untracked.mdx');

    await extendPages(pluginLastUpdated(true), [data]);

    expect(data.lastUpdatedTime).toBeUndefined();
    expect(data.lastUpdatedAuthor).toBeUndefined();
  });
});
