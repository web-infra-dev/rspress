import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  rm,
  access,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { preparePagesSite } from './prepare-pages-site.mjs';

async function workspace(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'midscene-pages-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const reports = path.join(root, 'reports');
  const site = path.join(root, 'site');
  const previous = path.join(root, 'previous');
  await mkdir(reports);
  return { root, reports, site, previous };
}
async function nativeReport(reports, content = 'native report') {
  const run = path.join(reports, 'midscene-results/.midscene/test-results/run');
  const report = path.join(
    reports,
    'midscene-results/midscene_run/report/native/index.html',
  );
  await mkdir(run, { recursive: true });
  await mkdir(path.dirname(report), { recursive: true });
  await writeFile(report, content);
  await writeFile(
    path.join(run, 'summary.json'),
    JSON.stringify({ report: path.relative(run, report) }),
  );
  return { run, report };
}
async function history(previous, ids, size = 20) {
  for (const id of ids) {
    const dir = path.join(previous, 'runs', id);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'index.html'), 'x'.repeat(size));
  }
}
const exists = filename =>
  access(filename).then(
    () => true,
    () => false,
  );

test('publishes an existing native report and returns its verified run entry', async t => {
  const options = await workspace(t);
  await nativeReport(options.reports);
  const result = await preparePagesSite({ ...options, runId: '4' });
  assert.equal(result.reportPath, 'runs/4/');
  assert.deepEqual(result.runIds, ['4']);
  const redirect = await readFile(
    path.join(options.site, result.reportPath, 'index.html'),
    'utf8',
  );
  assert(
    redirect.includes('midscene-results/midscene_run/report/native/index.html'),
  );
  assert.equal(
    await readFile(
      path.join(
        options.site,
        'runs/4/midscene-results/midscene_run/report/native/index.html',
      ),
      'utf8',
    ),
    'native report',
  );
});

test('missing summary or HTML skips publication without replacing an existing site', async t => {
  const options = await workspace(t);
  await mkdir(options.site);
  await writeFile(path.join(options.site, 'index.html'), 'previous deployment');
  for (const state of [
    'no summary',
    'missing HTML',
    'directory instead of HTML',
  ]) {
    if (state !== 'no summary') {
      const { report } = await nativeReport(options.reports);
      await rm(report);
      if (state === 'directory instead of HTML') await mkdir(report);
    }
    const result = await preparePagesSite({ ...options, runId: '4' });
    assert.equal(result.reportPath, null, state);
    assert.equal(
      await readFile(path.join(options.site, 'index.html'), 'utf8'),
      'previous deployment',
    );
    assert.equal(await exists(path.join(options.site, 'runs/4')), false);
  }
});

test('rerunning an old run retains the current report ahead of newer history', async t => {
  const options = await workspace(t);
  await nativeReport(options.reports);
  await history(options.previous, ['2', '3', '4']);
  const result = await preparePagesSite({ ...options, runId: '1' });
  assert.deepEqual(result.runIds, ['3', '4', '1']);
  assert.equal(
    await exists(path.join(options.site, 'runs/1/index.html')),
    true,
  );
  assert.equal(await exists(path.join(options.site, 'runs/2')), false);
});

test('byte-budget pruning also protects the current old run', async t => {
  const options = await workspace(t);
  await nativeReport(options.reports);
  await history(options.previous, ['2', '3'], 16000);
  const result = await preparePagesSite({
    ...options,
    runId: '1',
    maxSiteBytes: 12000,
  });
  assert.deepEqual(result.runIds, ['1']);
  assert(result.bytes <= 12000);
  assert.equal(
    await exists(path.join(options.site, 'runs/1/index.html')),
    true,
  );
});

test('an oversized current report fails instead of deleting itself', async t => {
  const options = await workspace(t);
  await nativeReport(options.reports, 'x'.repeat(13000));
  await assert.rejects(
    preparePagesSite({ ...options, runId: '1', maxSiteBytes: 12000 }),
    /safety limit/,
  );
  assert.equal(
    await exists(path.join(options.site, 'runs/1/index.html')),
    true,
  );
});

test('native paths cannot escape the report directory', async t => {
  const options = await workspace(t);
  const { run } = await nativeReport(options.reports);
  await writeFile(
    path.join(run, 'summary.json'),
    JSON.stringify({ report: '../../outside.html' }),
  );
  await assert.rejects(preparePagesSite({ ...options, runId: '1' }), /escapes/);
});

test('CLI exports an empty or verified report path for workflow gating', async t => {
  const options = await workspace(t);
  const output = path.join(options.root, 'output');
  const script = fileURLToPath(
    new URL('./prepare-pages-site.mjs', import.meta.url),
  );
  const invoke = () =>
    spawnSync(
      process.execPath,
      [
        script,
        '--site',
        options.site,
        '--reports',
        options.reports,
        '--run-id',
        '1',
      ],
      {
        env: { ...process.env, GITHUB_OUTPUT: output },
        encoding: 'utf8',
      },
    );
  let result = invoke();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(output, 'utf8'), 'report_path=\n');
  await nativeReport(options.reports);
  result = invoke();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    await readFile(output, 'utf8'),
    'report_path=\nreport_path=runs/1/\n',
  );
});

test('workflow gates upload and Summary links on the verified report path', async () => {
  const workflow = await readFile(
    new URL('../../../.github/workflows/midscene.yml', import.meta.url),
    'utf8',
  );
  const upload = workflow
    .split('- name: Upload GitHub Pages report')[1]
    .split('- name: Deploy report')[0];
  assert(upload.includes("if: steps.prepare-report.outputs.report_path != ''"));
  const summary = workflow.split(
    '- name: Add per-case screenshots and report links to Summary',
  )[1];
  assert(
    summary.includes(
      "steps.deployment.outcome == 'success' && steps.prepare-report.outputs.report_path != ''",
    ),
  );
  assert(summary.includes('render-ci-summary.mjs'));
  assert(summary.includes('Explain incomplete native report'));
});
