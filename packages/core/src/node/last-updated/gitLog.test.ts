import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { PageIndexInfo, RouteMeta } from '@rspress/shared';
import { afterAll, beforeAll, describe, expect, it } from '@rstest/core';
import { execa } from 'execa';
import { pluginLastUpdated } from './index';

/**
 * The unit tests run against a hand written `git log` output, which cannot
 * catch a wrong assumption about the format itself. These run the real `git`
 * over a throwaway repository instead.
 */
describe('pluginLastUpdated against a real repository', () => {
  let repo: string;

  const git = (args: string[]) => execa('git', args, { cwd: repo });

  const commit = (message: string, date: string, author = 'Alice') =>
    execa(
      'git',
      [
        '-c',
        `user.name=${author}`,
        '-c',
        `user.email=${author.toLowerCase()}@test`,
        'commit',
        '-m',
        message,
      ],
      { cwd: repo, env: { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } },
    );

  const write = async (relativePath: string, content: string) => {
    const filePath = path.join(repo, relativePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
    await git(['add', relativePath]);
  };

  beforeAll(async () => {
    repo = await fs.mkdtemp(path.join(os.tmpdir(), 'rspress-last-updated-'));
    await git(['init', '-q', '--initial-branch=main']);

    await write('docs/index.mdx', 'first');
    await write('docs/guide/legacy.mdx', 'first');
    await commit('first', '2020-01-02T03:04:05Z');

    await write('docs/index.mdx', 'second');
    await commit('second', '2021-06-07T08:09:10Z');

    // A branch conflicting with main on `index.mdx` and cleanly adding
    // `clean.mdx`, so the merge commit resolves the conflict by hand.
    await git(['checkout', '-qb', 'side']);
    await write('docs/index.mdx', 'side');
    await write('docs/clean.mdx', 'clean');
    await commit('side', '2022-01-02T03:04:05Z', 'Bob');
    await git(['checkout', '-q', 'main']);
    await write('docs/index.mdx', 'trunk');
    await commit('trunk', '2022-03-04T05:06:07Z');
    await git(['merge', 'side']).catch(() => {
      // The conflict on `index.mdx` is expected.
    });
    await write('docs/index.mdx', 'merged');
    await commit('merge side', '2023-05-06T07:08:09Z', 'Merle');
  });

  afterAll(async () => {
    await fs.rm(repo, { recursive: true, force: true });
  });

  it('should read the last commit of every page in one pass', async () => {
    const pages = [
      'docs/index.mdx',
      'docs/guide/legacy.mdx',
      'docs/clean.mdx',
      'docs/new.mdx',
    ].map(
      relativePath =>
        ({
          _filepath: path.join(repo, relativePath),
          lang: 'en',
        }) as PageIndexInfo,
    );
    const plugin = pluginLastUpdated(true);

    await plugin.routeGenerated?.(
      pages.map(page => ({ absolutePath: page._filepath }) as RouteMeta),
    );
    await Promise.all(pages.map(page => plugin.extendPageData?.(page, true)));

    const [index, legacy, clean, uncommitted] = pages as (PageIndexInfo & {
      lastUpdatedTime?: string;
      lastUpdatedAuthor?: string;
    })[];

    // The conflict resolution touched `index.mdx`, so the merge commit is its
    // last update, exactly as `git log -1 -- <file>` reports it.
    expect(index.lastUpdatedTime).toBe(
      new Date('2023-05-06T07:08:09Z').toLocaleString('en'),
    );
    expect(index.lastUpdatedAuthor).toBe('Merle');
    // A file merged without conflict keeps its own branch commit.
    expect(clean.lastUpdatedTime).toBe(
      new Date('2022-01-02T03:04:05Z').toLocaleString('en'),
    );
    expect(clean.lastUpdatedAuthor).toBe('Bob');
    // The newest commit touching the file wins, not the newest commit overall.
    expect(legacy.lastUpdatedTime).toBe(
      new Date('2020-01-02T03:04:05Z').toLocaleString('en'),
    );
    expect(legacy.lastUpdatedAuthor).toBe('Alice');
    // A page that was never committed keeps no last updated information.
    expect(uncommitted.lastUpdatedTime).toBeUndefined();
  });
});
