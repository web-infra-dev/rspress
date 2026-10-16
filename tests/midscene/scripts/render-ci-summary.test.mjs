import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { renderCiSummary } from './render-ci-summary.mjs';

async function fixture(t) {
  const reports = await mkdtemp(path.join(tmpdir(), 'midscene-summary-'));
  t.after(() => rm(reports, { recursive: true, force: true }));
  const run = path.join(reports, 'midscene-results/.midscene/test-results/run');
  const report = path.join(reports, 'midscene-results/midscene_run/report');
  await mkdir(run, { recursive: true });
  await mkdir(path.join(report, 'screenshots'), { recursive: true });
  await writeFile(path.join(report, 'index.html'), 'native');
  await writeFile(path.join(report, 'screenshots/shot.jpeg'), 'image');
  const step = {
    node: 'aiAssert',
    status: 'success',
    operations: { events: [{ stepId: 'attempt:steps:2' }] },
    report: {
      traces: [{ executionId: 'selected' }],
      sources: [{ dumpPath: '/producer/midscene_run/report/dump.json' }],
    },
  };
  const result = { durationMs: 1200, steps: [step] };
  const summary = {
    status: 'success',
    projectRoot: '/producer',
    report: '../../../midscene_run/report/index.html',
    projects: [
      {
        name: 'web',
        cases: [
          {
            name: 'CASE | <script>',
            status: 'success',
            attempts: [{ resultFile: 'case.json' }],
          },
        ],
      },
    ],
  };
  const save = async () => {
    await writeFile(path.join(run, 'summary.json'), JSON.stringify(summary));
    await writeFile(path.join(run, 'case.json'), JSON.stringify(result));
  };
  await writeFile(
    path.join(report, 'dump.json'),
    JSON.stringify({
      executions: [
        {
          id: 'selected',
          tasks: [
            {
              uiContext: {
                screenshot: {
                  storage: 'file',
                  path: './screenshots/shot.jpeg',
                },
              },
            },
          ],
        },
      ],
    }),
  );
  await save();
  return {
    reports,
    run,
    report,
    summary,
    result,
    step,
    save,
    options: {
      reports,
      pagesUrl: 'https://example.test/project/',
      runId: '42',
      producerResult: 'success',
    },
  };
}

test('each case has its screenshot and exact native step link with escaped text', async t => {
  const f = await fixture(t);
  const md = await renderCiSummary(f.options);
  assert.match(md, /1\/1 passed/);
  assert.match(md, /CASE &#124; &lt;script&gt;/);
  assert.match(
    md,
    /<img src="https:\/\/example.test\/project\/runs\/42\/midscene-results\/midscene_run\/report\/screenshots\/shot.jpeg"/,
  );
  assert.match(md, /index.html#runner-step=attempt%3Asteps%3A2/);
  assert.match(
    md,
    /\| Project \| Case \| Screenshot \| Status \/ reason \| Duration \| Report \|/,
  );
});

test('failed step wins over later success and failures precede passed cases', async t => {
  const f = await fixture(t);
  f.summary.status = 'failed';
  f.summary.projects[0].cases.push({
    name: 'failed',
    status: 'failed',
    attempts: [{ resultFile: 'failed.json' }],
  });
  await writeFile(
    path.join(f.run, 'failed.json'),
    JSON.stringify({
      durationMs: 3000,
      steps: [
        {
          ...f.step,
          status: 'timeout',
          error: { message: 'timeout | reason' },
          operations: { events: [{ stepId: 'bad:steps:0' }] },
        },
        f.step,
      ],
    }),
  );
  await f.save();
  const md = await renderCiSummary({ ...f.options, producerResult: 'failure' });
  assert(md.indexOf('### Needs attention') < md.indexOf('### Passed cases'));
  assert.match(md, /bad%3Asteps%3A0/);
  assert.match(md, /timeout &#124; reason/);
  assert.match(md, /1\/2 passed/);
});

test('missing screenshots and not-run cases are honest, never borrowed from another case', async t => {
  const f = await fixture(t);
  await rm(path.join(f.report, 'screenshots/shot.jpeg'));
  f.summary.projects[0].cases.push({
    name: 'not started',
    status: 'not-run',
    attempts: [],
  });
  await f.save();
  const md = await renderCiSummary(f.options);
  assert.equal((md.match(/No screenshot captured/g) ?? []).length, 2);
  assert(!md.includes('<img'));
  assert.match(md, /❌ not-run/);
});

test('producer failure cannot be reported as an all-green run', async t => {
  const f = await fixture(t);
  assert.match(
    await renderCiSummary({ ...f.options, producerResult: 'failure' }),
    /Needs attention/,
  );
});

test('rejects escaping result and dump paths and unsafe public URLs', async t => {
  const f = await fixture(t);
  await assert.rejects(
    renderCiSummary({ ...f.options, pagesUrl: 'javascript:alert(1)' }),
    /Invalid Pages URL/,
  );
  f.step.report.sources[0].dumpPath = '/outside/dump.json';
  await f.save();
  await assert.rejects(renderCiSummary(f.options), /escapes/);
  f.summary.projects[0].cases[0].attempts[0].resultFile = '../outside.json';
  await f.save();
  await assert.rejects(renderCiSummary(f.options), /escapes/);
});
