import assert from 'node:assert/strict';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { preparePagesSite } from './prepare-pages-site.mjs';

const shard = async (root, label) => {
  const directory = path.join(
    root,
    'midscene-shard-1',
    'midscene_run',
    'report',
    label,
  );
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), label);
};

test('publishes recent runs at stable paths', async context => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'rspress-pages-site-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const previous = path.join(root, 'previous');
  const reports = path.join(root, 'reports');
  const site = path.join(root, 'site');
  await shard(previous, 'recent-old');
  await shard(reports, 'new');
  await mkdir(
    path.join(previous, 'midscene-shard-1/midscene_run/report/screenshots'),
  );
  await writeFile(
    path.join(
      previous,
      'midscene-shard-1/midscene_run/report/screenshots/recent.jpeg',
    ),
    'recent',
  );
  await mkdir(path.join(reports, 'native-report', 'screenshots'), {
    recursive: true,
  });
  await writeFile(
    path.join(reports, 'native-report', 'index.html'),
    'native report',
  );
  await writeFile(
    path.join(reports, 'native-report', 'screenshots', 'new.jpeg'),
    'new',
  );
  await mkdir(path.join(previous, 'runs', '100'), { recursive: true });
  await writeFile(
    path.join(previous, 'runs', '100', 'index.html'),
    'older run',
  );

  const first = await preparePagesSite({
    site,
    reports,
    runId: '101',
    previous,
  });
  assert.deepEqual(first.runIds, ['100', '101']);
  assert.match(
    await readFile(path.join(site, 'index.html'), 'utf8'),
    /runs\/101\/index\.html/,
  );
  assert.equal(
    await readFile(path.join(site, 'runs/101/index.html'), 'utf8'),
    'native report',
  );
  assert.equal(
    await readFile(path.join(site, 'runs/101/screenshots/new.jpeg'), 'utf8'),
    'new',
  );

  const next = path.join(root, 'next');
  await preparePagesSite({ site: next, reports, runId: '102', previous: site });
  const final = path.join(root, 'final');
  const result = await preparePagesSite({
    site: final,
    reports,
    runId: '103',
    previous: next,
  });
  assert.deepEqual(result.runIds, ['101', '102', '103']);
  await assert.rejects(stat(path.join(final, 'runs', '100')), {
    code: 'ENOENT',
  });
  assert.equal(
    await readFile(path.join(final, 'runs/101/index.html'), 'utf8'),
    'native report',
  );
});

test('rejects nonnumeric run IDs', async () => {
  await assert.rejects(
    preparePagesSite({ site: 'unused', runId: '../escape' }),
    /numeric/,
  );
});

test('publishes shard reports when the native merge is incomplete', async context => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'rspress-pages-partial-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const reports = path.join(root, 'reports');
  await shard(reports, 'partial');
  const site = path.join(root, 'site');
  await preparePagesSite({ site, reports, runId: '101' });
  assert.equal(
    await readFile(
      path.join(
        site,
        'runs/101/midscene-shard-1/midscene_run/report/partial/index.html',
      ),
      'utf8',
    ),
    'partial',
  );
  await assert.rejects(stat(path.join(site, 'runs/101/index.html')), {
    code: 'ENOENT',
  });
  assert.doesNotMatch(
    await readFile(path.join(site, 'index.html'), 'utf8'),
    /runs\/101\/index\.html/,
  );
});

test('an incomplete rerun replaces the complete attempt without retaining stale assets', async context => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'rspress-pages-rerun-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const completeReports = path.join(root, 'complete-reports');
  await shard(completeReports, 'first-attempt');
  await mkdir(path.join(completeReports, 'native-report', 'screenshots'), {
    recursive: true,
  });
  await writeFile(
    path.join(completeReports, 'native-report', 'index.html'),
    'complete report',
  );
  await writeFile(
    path.join(completeReports, 'native-report', 'screenshots', 'old.jpeg'),
    'old',
  );
  const previous = path.join(root, 'previous-site');
  await preparePagesSite({
    site: previous,
    reports: completeReports,
    runId: '101',
  });
  await mkdir(path.join(previous, 'runs', '100'), { recursive: true });
  await writeFile(
    path.join(previous, 'runs', '100', 'index.html'),
    'other run',
  );

  const partialReports = path.join(root, 'partial-reports');
  await shard(partialReports, 'second-attempt');
  const site = path.join(root, 'rerun-site');
  await preparePagesSite({
    site,
    reports: partialReports,
    runId: '101',
    previous,
  });

  const current = path.join(site, 'runs', '101');
  for (const stale of [
    'index.html',
    'screenshots/old.jpeg',
    'midscene-shard-1/midscene_run/report/first-attempt',
  ]) {
    await assert.rejects(stat(path.join(current, stale)), { code: 'ENOENT' });
  }
  assert.equal(
    await readFile(
      path.join(
        current,
        'midscene-shard-1/midscene_run/report/second-attempt/index.html',
      ),
      'utf8',
    ),
    'second-attempt',
  );
  assert.equal(
    await readFile(path.join(site, 'runs/100/index.html'), 'utf8'),
    'other run',
  );
  const index = await readFile(path.join(site, 'index.html'), 'utf8');
  assert.match(index, /Run 101: partial shard reports/);
  assert.doesNotMatch(index, /runs\/101\/index\.html/);
});

test('prunes older run directories before exceeding the Pages budget', async context => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'rspress-pages-budget-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const previous = path.join(root, 'previous');
  const reports = path.join(root, 'reports');
  await mkdir(path.join(previous, 'runs', '100'), { recursive: true });
  await writeFile(
    path.join(previous, 'runs', '100', 'report.bin'),
    Buffer.alloc(12_000),
  );
  await shard(reports, 'new');
  await mkdir(path.join(reports, 'native-report'));
  await writeFile(
    path.join(reports, 'native-report', 'index.html'),
    'native report',
  );
  await writeFile(
    path.join(reports, 'midscene-shard-1/midscene_run/report/new/report.bin'),
    Buffer.alloc(12_000),
  );

  const site = path.join(root, 'site');
  const result = await preparePagesSite({
    site,
    reports,
    runId: '101',
    previous,
    maxSiteBytes: 20_000,
  });
  assert.deepEqual(result.runIds, ['101']);
  assert.ok(result.bytes < 20_000);
  await assert.rejects(stat(path.join(site, 'runs', '100')), {
    code: 'ENOENT',
  });
  assert.doesNotMatch(
    await readFile(path.join(site, 'index.html'), 'utf8'),
    /Run 100/,
  );
});
