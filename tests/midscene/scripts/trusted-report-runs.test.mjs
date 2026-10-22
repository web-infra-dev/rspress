import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findReportHistory,
  isTrustedReportRun,
} from './trusted-report-runs.mjs';

process.env.MIDSCENE_UPSTREAM_REPOSITORY = 'web-infra-dev/rspress';

const upstream = {
  repository: { full_name: 'web-infra-dev/rspress' },
  head_repository: { full_name: 'web-infra-dev/rspress' },
  path: '.github/workflows/midscene.yml',
  status: 'completed',
  head_branch: 'main',
  event: 'push',
  head_sha: 'a'.repeat(40),
};

const compareToMain = async () => ({ status: 'ahead' });
const trusted = (run, repository) =>
  isTrustedReportRun(run, repository, compareToMain);

test('repository policy follows the configured upstream and rejects missing configuration', async () => {
  try {
    process.env.MIDSCENE_UPSTREAM_REPOSITORY = 'new-owner/rspress';
    const renamed = {
      ...upstream,
      repository: { full_name: 'new-owner/rspress' },
      head_repository: { full_name: 'new-owner/rspress' },
    };
    assert.equal(await trusted(renamed, 'new-owner/rspress'), true);
    assert.equal(await trusted(upstream, 'web-infra-dev/rspress'), false);
    delete process.env.MIDSCENE_UPSTREAM_REPOSITORY;
    await assert.rejects(trusted(renamed, 'new-owner/rspress'), /is required/);
  } finally {
    process.env.MIDSCENE_UPSTREAM_REPOSITORY = 'web-infra-dev/rspress';
  }
});

test('report sources reject PR artifacts, other workflows, and untrusted refs', async () => {
  assert.equal(await trusted(upstream, 'web-infra-dev/rspress'), true);
  assert.equal(
    await trusted({ ...upstream, event: 'schedule' }, 'web-infra-dev/rspress'),
    true,
  );
  assert.equal(
    await trusted(
      { ...upstream, event: 'workflow_dispatch' },
      'web-infra-dev/rspress',
    ),
    true,
  );
  for (const change of [
    { event: 'pull_request' },
    { event: 'pull_request_target' },
    { head_repository: { full_name: 'attacker/rspress' } },
    { repository: { full_name: 'other/rspress' } },
    { head_repository: null },
    { head_branch: 'feature' },
    { path: '.github/workflows/other.yml' },
    { status: 'in_progress' },
  ])
    assert.equal(
      await trusted({ ...upstream, ...change }, 'web-infra-dev/rspress'),
      false,
    );
});

test('fork reports require a same-repository manual dispatch', async () => {
  const fork = {
    ...upstream,
    repository: { full_name: 'example/rspress' },
    head_repository: { full_name: 'example/rspress' },
    event: 'workflow_dispatch',
    head_branch: 'feature',
  };
  assert.equal(await trusted(fork, 'example/rspress'), true);
  assert.equal(
    await trusted({ ...fork, event: 'pull_request' }, 'example/rspress'),
    false,
  );
  assert.equal(
    await trusted({ ...fork, event: 'push' }, 'example/rspress'),
    false,
  );
});

test('an upstream tag named main must still point to a protected-main commit', async () => {
  for (const status of ['behind', 'diverged']) {
    assert.equal(
      await isTrustedReportRun(
        { ...upstream, event: 'workflow_dispatch' },
        'web-infra-dev/rspress',
        async () => ({ status }),
      ),
      false,
    );
  }
  assert.equal(
    await isTrustedReportRun(upstream, 'web-infra-dev/rspress', async () => ({
      status: 'identical',
    })),
    true,
  );
});

test('history paginates workflow runs and artifacts without trusting PRs', async () => {
  const pages = [];
  const downloads = [];
  const result = await findReportHistory(
    async page => {
      pages.push(page);
      return page === 1
        ? Array.from({ length: 100 }, (_, i) => ({
            ...upstream,
            id: i + 1,
            event: 'pull_request',
          }))
        : [{ ...upstream, id: 101 }];
    },
    'web-infra-dev/rspress',
    async (id, page) => {
      downloads.push([id, page]);
      return page === 1
        ? Array.from({ length: 100 }, () => ({ name: 'unrelated' }))
        : [
            {
              name: 'midscene-e2e-report-pages-2',
              created_at: '2026-10-16T10:00:00Z',
            },
          ];
    },
    '102',
    compareToMain,
  );
  assert.equal(result.workflow_run.id, 101);
  assert.deepEqual(pages, [1, 2]);
  assert.deepEqual(downloads, [
    [101, 1],
    [101, 2],
  ]);
});

test('history skips current runs, expired artifacts, and unavailable candidates', async () => {
  const downloads = [];
  const result = await findReportHistory(
    async () => [1, 2, 3, 4].map(id => ({ ...upstream, id })),
    'web-infra-dev/rspress',
    async id => {
      downloads.push(id);
      if (id === 2) throw new Error('HTTP 404');
      return [
        {
          name: 'midscene-e2e-report-pages-1',
          expired: id === 3,
          created_at: '2026-10-16T10:00:00Z',
        },
      ];
    },
    '1',
    compareToMain,
  );
  assert.deepEqual(downloads, [2, 3, 4]);
  assert.equal(result.workflow_run.id, 4);
  assert.equal(
    await findReportHistory(
      async () => [],
      'web-infra-dev/rspress',
      async () => [],
      '1',
      compareToMain,
    ),
    null,
  );
});

test('history selects the newest snapshot across runs, attempts, and artifact pages', async () => {
  const result = await findReportHistory(
    async () => [101, 100, 99].map(id => ({ ...upstream, id })),
    'web-infra-dev/rspress',
    async (id, page) => {
      if (id === 101)
        return [
          {
            id: 1,
            name: 'midscene-e2e-report-pages-1',
            created_at: '2026-10-15T10:00:00Z',
          },
        ];
      if (id === 99)
        return [
          {
            id: 9,
            name: 'midscene-e2e-report-pages-1',
            created_at: '2026-10-18T10:00:00Z',
            expired: true,
          },
        ];
      if (page === 1)
        return [
          {
            id: 2,
            name: 'midscene-e2e-report-pages-1',
            created_at: '2026-10-15T09:00:00Z',
          },
          ...Array.from({ length: 99 }, () => ({ name: 'unrelated' })),
        ];
      return [
        {
          id: 3,
          name: 'midscene-e2e-report-pages-3',
          created_at: '2026-10-17T10:00:00Z',
        },
        {
          id: 4,
          name: 'midscene-e2e-report-pages-2',
          created_at: '2026-10-16T10:00:00Z',
        },
      ];
    },
    '102',
    compareToMain,
  );
  assert.equal(result.workflow_run.id, 100);
  assert.equal(result.id, 3);
});

test('explicit source validation propagates a failed trust lookup', async () => {
  await assert.rejects(
    isTrustedReportRun(upstream, 'web-infra-dev/rspress', async () => {
      throw new Error('HTTP 404');
    }),
    /HTTP 404/,
  );
});
