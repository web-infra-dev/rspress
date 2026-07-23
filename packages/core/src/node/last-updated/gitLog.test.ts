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

  const commit = (message: string, date: string) =>
    execa(
      'git',
      [
        '-c',
        'user.name=Alice',
        '-c',
        'user.email=alice@test',
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
    await execa('git', ['add', relativePath], { cwd: repo });
  };

  beforeAll(async () => {
    repo = await fs.mkdtemp(path.join(os.tmpdir(), 'rspress-last-updated-'));
    await execa('git', ['init', '-q', '--initial-branch=main'], { cwd: repo });

    await write('docs/index.mdx', 'first');
    await write('docs/guide/legacy.mdx', 'first');
    await commit('first', '2020-01-02T03:04:05Z');

    await write('docs/index.mdx', 'second');
    await commit('second', '2021-06-07T08:09:10Z');
  });

  afterAll(async () => {
    await fs.rm(repo, { recursive: true, force: true });
  });

  it('should read the last commit of every page in one pass', async () => {
    const pages = [
      'docs/index.mdx',
      'docs/guide/legacy.mdx',
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

    const [index, legacy, uncommitted] = pages as (PageIndexInfo & {
      lastUpdatedTime?: string;
      lastUpdatedAuthor?: string;
    })[];

    // The newest commit touching the file wins, not the newest commit overall.
    expect(index.lastUpdatedTime).toBe(
      new Date('2021-06-07T08:09:10Z').toLocaleString('en'),
    );
    expect(legacy.lastUpdatedTime).toBe(
      new Date('2020-01-02T03:04:05Z').toLocaleString('en'),
    );
    expect(index.lastUpdatedAuthor).toBe('Alice');
    // A page that was never committed keeps no last updated information.
    expect(uncommitted.lastUpdatedTime).toBeUndefined();
  });
});
