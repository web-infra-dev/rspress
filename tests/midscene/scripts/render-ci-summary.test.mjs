import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { mergeNativeReports } from './merge-native-reports.mjs';
import {
  buildSummary,
  caseSetIssues,
  renderMarkdown,
} from './render-ci-summary.mjs';

const writeShard = async (root, shard, status, caseName, modelName) => {
  const project = `web-${shard}`;
  const resultRoot = path.join(
    root,
    `midscene-${shard}`,
    '.midscene',
    'test-results',
    'run-1',
  );
  const resultFile = path.join(
    resultRoot,
    'project-0',
    'case-1',
    'attempt.json',
  );
  await mkdir(path.dirname(resultFile), { recursive: true });
  await writeFile(
    resultFile,
    JSON.stringify({
      status,
      durationMs: 12_400,
      steps: [
        {
          id: 'step-1',
          status,
          agentDetails: [{ executionId: 'execution-1' }],
          ...(status === 'success'
            ? {}
            : { error: { message: 'button missing' } }),
        },
      ],
    }),
  );
  await writeFile(
    path.join(resultRoot, 'summary.json'),
    JSON.stringify({
      startedAt: '2026-09-22T01:00:00Z',
      durationMs: 13_000,
      report: '../../../midscene_run/report/midscene-e2e-run-1/index.html',
      projects: [
        {
          name: project,
          status,
          lifecycle: { durationMs: 13_000 },
          cases: [
            {
              caseId: 'case-1',
              name: caseName,
              status,
              attempts: [{ resultFile: 'project-0/case-1/attempt.json' }],
            },
          ],
        },
      ],
    }),
  );
  const reportRoot = path.join(
    root,
    `midscene-${shard}`,
    'midscene_run',
    'report',
    'midscene-e2e-run-1',
  );
  await mkdir(reportRoot, { recursive: true });
  await mkdir(path.join(reportRoot, 'screenshots'));
  await writeFile(
    path.join(reportRoot, 'index.html'),
    `<script>window.x={"modelName":"${modelName}"}</script><script type="midscene_test_run_dump">${JSON.stringify(
      {
        schemaVersion: 1,
        kind: 'test-runner',
        runId: `run-${shard}`,
        status,
        startedAt: '2026-09-22T01:00:00Z',
        endedAt: '2026-09-22T01:00:13Z',
        summary: {
          total: 1,
          passed: status === 'success' ? 1 : 0,
          failed: status === 'success' ? 0 : 1,
          notRun: 0,
          filtered: 0,
          collectionErrors: 0,
          documentFailures: 0,
          projectFailures: 0,
        },
        projects: [
          {
            projectId: project,
            name: project,
            documents: [
              {
                documentId: 'document-1',
                beforeAll: [],
                afterAll: [],
                cases: [
                  {
                    caseId: 'case-1',
                    name: caseName,
                    attempts: [
                      {
                        attemptId: 'attempt-1',
                        beforeEach: [],
                        afterEach: [],
                        steps: [
                          {
                            id: 'step-1',
                            status,
                            agentDetails: [{ executionId: 'execution-1' }],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    )}</script><script type="midscene_web_dump">${JSON.stringify({
      executions: [
        {
          id: 'execution-1',
          tasks: [{ uiContext: { screenshot: { id: 'screenshot-1' } } }],
        },
      ],
    })}</script>`,
  );
  await writeFile(
    path.join(reportRoot, 'screenshots', 'screenshot-1.jpeg'),
    'image bytes',
  );
  await writeFile(
    path.join(root, `midscene-${shard}`, 'midscene_run', 'model.json'),
    JSON.stringify({ modelName, modelFamily: 'deepseek' }),
  );
};

test('builds one combined Markdown Summary for all shards', async context => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), 'rspress-midscene-summary-'),
  );
  context.after(() =>
    import('node:fs/promises').then(({ rm }) =>
      rm(root, { recursive: true, force: true }),
    ),
  );
  await writeShard(
    root,
    'shard-1',
    'success',
    'AUTH-01 opens chat',
    'deepseek-v3.2',
  );
  await writeShard(
    root,
    'shard-2',
    'failed',
    'CHAT-09 sends a message',
    'deepseek-v3.2',
  );
  const markdownFile = path.join(root, 'summary.md');
  const data = await buildSummary({
    'reports-dir': root,
    'expected-projects': 'web-shard-1,web-shard-2,web-shard-3',
    'run-url': 'https://github.com/quanru/rspress/actions/runs/1',
    'pages-url': 'https://quanru.github.io/rspress/',
    'producer-result': 'failure',
    output: markdownFile,
  });

  assert.deepEqual(data.models, ['deepseek-v3.2 (deepseek)']);
  const markdown = await readFile(markdownFile, 'utf8');
  assert.match(markdown, /Rspress × Midscene · failure captured/);
  assert.match(markdown, /2 need attention · 1 passed/);
  assert.match(markdown, /web-shard-3 \| — \| — \| ❌ missing/);
  assert.match(markdown, /CHAT-09 sends a message.*button missing/);
  assert.match(markdown, /<summary>Appendix: passed cases \(1\)<\/summary>/);
  assert.match(
    markdown,
    /\| Shard \| Case \| Screenshot \| Status \/ reason \| Duration \|/,
  );
  const appendix = markdown.indexOf('<details>');
  assert.ok(markdown.indexOf('CHAT-09 sends a message') < appendix);
  assert.ok(markdown.indexOf('AUTH-01 opens chat') > appendix);
  assert.match(markdown, /<img/);
  assert.match(markdown, /#runner-step=step-1/);
  assert.match(markdown, /Native Midscene Test report unavailable/);
});

test('escapes Markdown table content', () => {
  const markdown = renderMarkdown({
    projects: [
      {
        name: 'web|shard',
        status: 'failed',
        reportPath: 'web-shard/report/index.html',
        durationMs: 1000,
        cases: [
          {
            name: 'Case | name',
            status: 'failed',
            durationMs: 1000,
            reason: 'line 1\nline 2',
            reportPath: 'web-shard/report/index.html',
            screenshotPath: 'web-shard/previews/case.jpg',
          },
        ],
      },
    ],
    models: [],
    runUrl: 'https://example.test/run',
    pagesUrl: 'https://example.test/reports/',
    producerResult: 'failure',
  });
  assert.match(markdown, /web\\\|shard/);
  assert.match(markdown, /Case \\\| name/);
  assert.match(markdown, /line 1 line 2/);
  assert.match(markdown, /alt="Case &#124; name"/);
});

test('reports a missing expected shard as an overall failure', () => {
  const markdown = renderMarkdown({
    projects: [
      {
        name: 'web-shard-1',
        status: 'success',
        reportPath: 'web-shard-1/report/index.html',
        durationMs: 1000,
        cases: [
          { name: 'AUTH-01', status: 'success', durationMs: 1000, reason: '' },
        ],
      },
      {
        name: 'web-shard-2',
        status: 'missing',
        durationMs: null,
        cases: [],
      },
    ],
    models: ['deepseek-v3.2 (deepseek)'],
    runUrl: 'https://example.test/run',
    pagesUrl: 'https://example.test/reports/',
    producerResult: 'success',
  });

  assert.match(markdown, /Rspress × Midscene · failure captured/);
  assert.match(markdown, /### Needs attention/);
  assert.match(markdown, /web-shard-2.*missing/);
  assert.doesNotMatch(markdown, /All 1 cases passed/);
});

test('keeps shard screenshots linked when the combined report is incomplete', () => {
  const markdown = renderMarkdown({
    projects: [
      {
        name: 'web-shard-1',
        status: 'failed',
        reportPath: 'midscene-shard-1/midscene_run/report/test-run.html',
        cases: [
          {
            name: 'CHAT-01',
            status: 'failed',
            reason: 'Assertion failed',
            reportPath: 'midscene-shard-1/midscene_run/report/test-run.html',
            screenshotPath:
              'midscene-shard-1/midscene_run/report/screenshots/one.jpeg',
            stepId: 'step-1',
          },
        ],
      },
      { name: 'web-shard-2', status: 'missing', cases: [] },
    ],
    models: [],
    runUrl: 'https://example.test/run',
    pagesUrl: 'https://example.test/runs/1/',
    producerResult: 'failure',
  });
  assert.match(markdown, /Native Midscene Test report unavailable/);
  assert.match(
    markdown,
    /<a href="[^"]+runner-step=step-1"><img src="[^"]+one\.jpeg"/,
  );
});

test('keeps a failed case when its native report is missing', async context => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), 'rspress-midscene-partial-'),
  );
  context.after(() =>
    import('node:fs/promises').then(({ rm }) =>
      rm(root, { recursive: true, force: true }),
    ),
  );
  await writeShard(
    root,
    'shard-1',
    'failed',
    'CHAT-09 sends a message',
    'deepseek-v3.2',
  );
  const report = path.join(
    root,
    'midscene-shard-1',
    'midscene_run',
    'report',
    'midscene-e2e-run-1',
    'index.html',
  );
  await import('node:fs/promises').then(({ rm }) => rm(report));
  const data = await buildSummary({
    'reports-dir': root,
    'expected-projects': 'web-shard-1',
    'run-url': 'https://example.test/run',
    'pages-url': 'https://example.test/reports/',
    'producer-result': 'failure',
    output: path.join(root, 'summary.md'),
  });
  assert.equal(data.projects[0].cases[0].reason, 'button missing');
  assert.equal(data.projects[0].cases[0].stepId, undefined);
  assert.equal(data.projects[0].cases[0].reportPath, null);
  const markdown = await readFile(path.join(root, 'summary.md'), 'utf8');
  assert.match(markdown, /CHAT-09 sends a message.*button missing/);
});

test('marks a successful shard incomplete when its native report is missing', async context => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), 'rspress-midscene-missing-report-'),
  );
  context.after(() =>
    import('node:fs/promises').then(({ rm }) =>
      rm(root, { recursive: true, force: true }),
    ),
  );
  await writeShard(
    root,
    'shard-1',
    'success',
    'AUTH-01 opens chat',
    'deepseek-v3.2',
  );
  const report = path.join(
    root,
    'midscene-shard-1',
    'midscene_run',
    'report',
    'midscene-e2e-run-1',
    'index.html',
  );
  await import('node:fs/promises').then(({ rm }) => rm(report));
  const markdownFile = path.join(root, 'summary.md');
  await buildSummary({
    'reports-dir': root,
    'expected-projects': 'web-shard-1',
    'run-url': 'https://example.test/run',
    'pages-url': 'https://example.test/reports/',
    'producer-result': 'success',
    output: markdownFile,
  });

  const markdown = await readFile(markdownFile, 'utf8');
  assert.match(markdown, /Rspress × Midscene · failure captured/);
  assert.match(markdown, /1 need attention · 1 passed/);
  assert.match(markdown, /web-shard-1.*Native report missing/);
  assert.doesNotMatch(markdown, /All 1 cases passed/);
});

test('merges shard reports with the native Midscene Test reporter', async context => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), 'rspress-midscene-native-'),
  );
  context.after(() =>
    import('node:fs/promises').then(({ rm }) =>
      rm(root, { recursive: true, force: true }),
    ),
  );
  await writeShard(root, 'shard-1', 'success', 'CHAT-01', 'deepseek-v3.2');
  await writeShard(root, 'shard-2', 'success', 'CHAT-02', 'deepseek-v3.2');
  const report = await mergeNativeReports(root, ['web-shard-1', 'web-shard-2']);
  assert.equal(report, path.join(root, 'native-report', 'index.html'));
  const html = await readFile(report, 'utf8');
  const dump = JSON.parse(
    html.match(
      /<script[^>]*type="midscene_test_run_dump"[^>]*>([\s\S]*?)<\/script>/,
    )[1],
  );
  assert.equal(dump.kind, 'test-runner');
  assert.deepEqual(
    dump.projects.flatMap(project =>
      project.documents.flatMap(document =>
        document.cases.map(testCase => testCase.name),
      ),
    ),
    ['CHAT-01', 'CHAT-02'],
  );
  const data = await buildSummary({
    'reports-dir': root,
    'expected-projects': 'web-shard-1,web-shard-2',
    'run-url': 'https://example.test/run',
    'pages-url': 'https://example.test/reports/',
    'producer-result': 'success',
    output: path.join(root, 'summary.md'),
  });
  assert.equal(data.publishedReportPath, 'index.html');
  assert.match(
    await readFile(path.join(root, 'summary.md'), 'utf8'),
    /Open the Midscene Test report/,
  );
});

test('does not publish a partial native report', async context => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), 'rspress-midscene-incomplete-'),
  );
  context.after(() =>
    import('node:fs/promises').then(({ rm }) =>
      rm(root, { recursive: true, force: true }),
    ),
  );
  await writeShard(root, 'shard-1', 'success', 'CHAT-01', 'deepseek-v3.2');
  const expected = ['web-shard-1', 'web-shard-2'];
  assert.equal(await mergeNativeReports(root, expected), null);

  await writeShard(root, 'shard-2', 'success', 'CHAT-02', 'deepseek-v3.2');
  const manifest = path.join(root, 'case-manifest.json');
  await writeFile(
    manifest,
    JSON.stringify({ 'CHAT-01': 'shard-1', 'CHAT-03': 'shard-2' }),
  );
  assert.equal(await mergeNativeReports(root, expected, manifest), null);
  await assert.rejects(
    readFile(path.join(root, 'native-report', 'index.html')),
    {
      code: 'ENOENT',
    },
  );
});

test('celebrates a complete run and keeps passed cases in the appendix', () => {
  const markdown = renderMarkdown({
    projects: [
      {
        name: 'web-shard-1',
        status: 'success',
        reportPath: 'web-shard-1/report/index.html',
        durationMs: 1000,
        cases: [
          {
            name: 'AUTH-01',
            status: 'success',
            durationMs: 1000,
            reportPath: 'web-shard-1/report/index.html',
            screenshotPath: 'web-shard-1/screenshots/one.jpeg',
            stepId: 'step-1',
          },
        ],
      },
    ],
    models: [],
    runUrl: 'https://example.test/run',
    pagesUrl: 'https://example.test/reports/',
  });
  assert.match(markdown, /\*\*✅ 0 need attention · 1 passed\*\*/);
  assert.match(markdown, /🎉 All 1 cases passed/);
  assert.match(
    markdown,
    /<details>\n<summary>Appendix: passed cases \(1\)<\/summary>/,
  );
  assert.match(markdown, /<a href="[^"]+runner-step/);
  assert.doesNotMatch(
    markdown.slice(0, markdown.indexOf('<details>')),
    /AUTH-01/,
  );
});

test('missing, unexpected, moved, and duplicate cases prevent a complete Summary', () => {
  const projects = [
    {
      name: 'web-shard-1',
      status: 'success',
      cases: [
        { name: 'CHAT-01', status: 'success' },
        { name: 'CHAT-01', status: 'success' },
        { name: 'EXTRA-01', status: 'success' },
      ],
    },
    {
      name: 'web-shard-2',
      status: 'success',
      cases: [{ name: 'CHAT-03', status: 'success' }],
    },
  ];
  const issues = caseSetIssues(projects, {
    'CHAT-01': 'shard-1',
    'CHAT-02': 'shard-1',
    'CHAT-03': 'shard-1',
  });
  assert.deepEqual(issues, [
    'Duplicate case: CHAT-01',
    'Unexpected case: EXTRA-01 (shard-1)',
    'Wrong shard: CHAT-03 (expected shard-1, found shard-2)',
    'Missing case: CHAT-02 (shard-1)',
  ]);
  const markdown = renderMarkdown({
    projects,
    models: [],
    pagesUrl: 'https://example.test/reports/',
    runUrl: 'https://example.test/run',
    caseInventoryIssues: issues,
  });
  assert.match(markdown, /Rspress × Midscene · failure captured/);
  assert.match(markdown, /Missing case: CHAT-02/);
  assert.doesNotMatch(markdown, /All 4 cases passed/);
});

test('buildSummary checks the committed case manifest', async context => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), 'rspress-midscene-manifest-'),
  );
  context.after(() =>
    import('node:fs/promises').then(({ rm }) =>
      rm(root, { recursive: true, force: true }),
    ),
  );
  await writeShard(root, 'shard-1', 'success', 'CHAT-01', 'deepseek-v3.2');
  const manifest = path.join(root, 'case-manifest.json');
  await writeFile(
    manifest,
    JSON.stringify({ 'CHAT-01': 'shard-1', 'CHAT-02': 'shard-1' }),
  );
  const output = path.join(root, 'summary.md');
  const data = await buildSummary({
    'reports-dir': root,
    'expected-projects': 'web-shard-1',
    'case-manifest': manifest,
    'run-url': 'https://example.test/run',
    'pages-url': 'https://example.test/reports/',
    'producer-result': 'success',
    output,
  });
  assert.deepEqual(data.caseInventoryIssues, [
    'Missing case: CHAT-02 (shard-1)',
  ]);
  assert.match(await readFile(output, 'utf8'), /failure captured/);
});

test('a complete report without Pages links only to its artifact', () => {
  const markdown = renderMarkdown({
    projects: [
      {
        name: 'web-shard-1',
        status: 'success',
        reportPath: 'midscene-shard-1/report/index.html',
        cases: [
          {
            name: 'CHAT-01',
            status: 'success',
            reportPath: 'report/index.html',
            screenshotPath: 'screenshots/one.jpeg',
            stepId: 'step-1',
          },
        ],
      },
    ],
    models: [],
    runUrl: 'https://example.test/run',
    publishedReportPath: 'index.html',
  });
  assert.match(markdown, /Rspress × Midscene · passed/);
  assert.match(
    markdown,
    /Download the artifact.*https:\/\/example.test\/run#artifacts/,
  );
  assert.match(markdown, /Native Midscene Test report included/);
  assert.doesNotMatch(
    markdown,
    /Open the Midscene|unavailable|<img|runner-step|undefined|\| Shard \||<details>|Appendix:/,
  );
});

test('writes counts and downloads without duplicate case tables before publication', async context => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), 'rspress-midscene-no-pages-'),
  );
  context.after(() =>
    import('node:fs/promises').then(({ rm }) =>
      rm(root, { recursive: true, force: true }),
    ),
  );
  const statuses = [
    'success',
    'failed',
    'not-run',
    'success',
    'success',
    'success',
  ];
  for (const [index, status] of statuses.entries()) {
    await writeShard(
      root,
      `shard-${index + 1}`,
      status,
      `CASE-0${index + 1}`,
      'visual-model',
    );
  }
  const summaryFile = path.join(root, 'GITHUB_STEP_SUMMARY');
  await buildSummary({
    'reports-dir': root,
    'expected-projects':
      'web-shard-1,web-shard-2,web-shard-3,web-shard-4,web-shard-5,web-shard-6',
    'run-url': 'https://example.test/actions/runs/1',
    'producer-result': 'failure',
    output: summaryFile,
  });
  const markdown = await readFile(summaryFile, 'utf8');
  assert.match(
    markdown,
    /\*\*Cases:\*\* 6 total · 4 passed · 1 failed · 1 not run/,
  );
  assert.match(markdown, /2 need attention · 4 passed/);
  assert.doesNotMatch(markdown, /\| Shard \||<details>|Appendix:|CASE-0/);
  assert.match(
    markdown,
    /\[Download the artifact\]\(https:\/\/example.test\/actions\/runs\/1#artifacts\)/,
  );
  assert.doesNotMatch(markdown, /<img|runner-step|Open the Midscene|undefined/);
});

test('published Summary exposes the combined native report before collapsed case deep links', () => {
  const markdown = renderMarkdown({
    models: [],
    projects: [
      {
        name: 'web-shard-1',
        status: 'success',
        reportPath: 'shard/report/index.html',
        cases: [
          {
            name: 'CHAT-01',
            status: 'success',
            reportPath: 'shard/report/index.html',
            screenshotPath: 'shard/report/screenshots/one.jpeg',
            stepId: 'case-1:steps:4',
          },
        ],
      },
    ],
    pagesUrl: 'https://example.test/rspress/runs/123/',
    runUrl: 'https://example.test/run',
    publishedReportPath: 'index.html',
  });
  assert.match(
    markdown,
    /\[Open the Midscene Test report\]\(https:\/\/example.test\/rspress\/runs\/123\/index.html\)/,
  );
  assert.ok(
    markdown.indexOf('Open the Midscene Test report') <
      markdown.indexOf('<details>'),
  );
  assert.match(markdown, /index.html#runner-step=case-1%3Asteps%3A4/);
  assert.match(
    markdown,
    /<img src="https:\/\/example.test\/rspress\/runs\/123\/shard\/report\/screenshots\/one.jpeg"/,
  );
  assert.match(
    markdown,
    /Cases:\*\* 1 total · 1 passed · 0 failed · 0 not run/,
  );
  assert.match(markdown, /### Shard results/);
  assert.match(markdown, /web-shard-1 \| success \| 1 \| 1 \| 0 \| 0/);
  assert.match(markdown, /Appendix: passed/);
  assert.equal(markdown.match(/^## /gm).length, 1);
});

test('incomplete publication keeps shard links without claiming a combined native report', () => {
  const markdown = renderMarkdown({
    models: [],
    projects: [
      {
        name: 'web-shard-1',
        status: 'failed',
        reportPath: 'shard/report/index.html',
        cases: [
          {
            name: 'CHAT-01',
            status: 'failed',
            reportPath: 'shard/report/index.html',
            stepId: 'step-1',
          },
        ],
      },
      { name: 'web-shard-2', status: 'missing', cases: [] },
    ],
    pagesUrl: 'https://example.test/rspress/runs/123/',
    runUrl: 'https://example.test/run',
  });
  assert.match(markdown, /Native Midscene Test report unavailable/);
  assert.match(markdown, /shard\/report\/index.html#runner-step=step-1/);
  assert.doesNotMatch(markdown, /Open the Midscene Test report/);
});

const execute = promisify(execFile);
const runWorkflowSummary = async (root, overrides = {}) => {
  const workflow = await readFile(
    new URL('../../../.github/workflows/midscene.yml', import.meta.url),
    'utf8',
  );
  const step = workflow.slice(
    workflow.indexOf('      - name: Write the consolidated run Summary'),
  );
  const script = step
    .slice(step.indexOf('        run: |\n') + '        run: |\n'.length)
    .split('\n')
    .map(line => line.slice(10))
    .join('\n');
  return execute(
    'bash',
    ['--noprofile', '--norc', '-e', '-o', 'pipefail', '-c', script],
    {
      cwd: fileURLToPath(new URL('../../../', import.meta.url)),
      env: {
        PATH: process.env.PATH,
        RUNNER_TEMP: root,
        GITHUB_STEP_SUMMARY: path.join(root, 'visible-summary.md'),
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_REPOSITORY: 'example/rspress',
        GITHUB_RUN_ID: '456',
        REPORT_SOURCE_RUN_ID: '123',
        REPORTS_DIR: 'midscene-report-shards',
        EXPECTED_PROJECTS:
          'web-shard-1,web-shard-2,web-shard-3,web-shard-4,web-shard-5,web-shard-6',
        CASE_MANIFEST: '',
        PRODUCER_RESULT: 'failure',
        REPORT_RESULT: 'success',
        PUBLICATION_RESULT: 'skipped',
        PAGE_URL: '',
        ...overrides,
      },
    },
  );
};

for (const scenario of [
  {
    name: 'published',
    publication: 'success',
    pagesUrl: 'https://example.test/rspress/',
  },
  { name: 'Pages failed', publication: 'failure' },
  { name: 'Pages skipped', publication: 'skipped' },
  { name: 'aggregation failed', publication: 'skipped', report: 'failure' },
]) {
  test(`the final workflow step writes one complete Summary when ${scenario.name}`, async context => {
    const root = await mkdtemp(
      path.join(os.tmpdir(), 'rspress-workflow-summary-'),
    );
    context.after(() =>
      import('node:fs/promises').then(({ rm }) =>
        rm(root, { recursive: true, force: true }),
      ),
    );
    const reports = path.join(root, 'midscene-report-shards');
    const statuses = [
      'success',
      'failed',
      'not-run',
      'success',
      'success',
      'success',
    ];
    for (const [index, status] of statuses.entries()) {
      await writeShard(
        reports,
        `shard-${index + 1}`,
        status,
        `CASE-0${index + 1}`,
        'visual-model',
      );
    }
    if (!scenario.report) {
      await mkdir(path.join(reports, 'native-report'));
      await writeFile(
        path.join(reports, 'native-report', 'index.html'),
        '<html></html>',
      );
    }
    await runWorkflowSummary(root, {
      PUBLICATION_RESULT: scenario.publication,
      REPORT_RESULT: scenario.report ?? 'success',
      PAGE_URL: scenario.pagesUrl ?? '',
    });
    const markdown = await readFile(
      path.join(root, 'visible-summary.md'),
      'utf8',
    );
    assert.equal(markdown.match(/^## /gm).length, 1);
    assert.match(
      markdown,
      /Cases:\*\* 6 total · 4 passed · 1 failed · 1 not run/,
    );
    assert.match(
      markdown,
      /Report source: \[run 123\]\(https:\/\/github.com\/example\/rspress\/actions\/runs\/123\). This run makes no new model calls/,
    );
    assert.match(markdown, /Source-run artifacts.*runs\/123#artifacts/);
    assert.match(markdown, /Download the artifact.*runs\/456#artifacts/);
    if (scenario.pagesUrl) {
      assert.match(markdown, /### Shard results/);
      assert.match(markdown, /web-shard-2 \| failed \| 1 \| 0 \| 1 \| 0/);
      assert.match(markdown, /web-shard-3 \| not-run \| 1 \| 0 \| 0 \| 1/);
      for (let index = 1; index <= 6; index += 1)
        assert.match(markdown, new RegExp(`CASE-0${index}`));
      assert.match(
        markdown,
        /Open the Midscene Test report.*https:\/\/example.test\/rspress\/runs\/456\/index.html/,
      );
      assert.match(markdown, /runner-step=step-1/);
      assert.match(
        markdown,
        /<img src="https:\/\/example.test\/rspress\/runs\/456\//,
      );
    } else {
      assert.ok(
        markdown.includes(`Pages publication: **${scenario.publication}**`),
      );
      assert.doesNotMatch(
        markdown,
        /Open the Midscene Test report|<img|runner-step|undefined|\| Shard \||<details>|Appendix:|CASE-0/,
      );
    }
    if (scenario.report)
      assert.match(markdown, /Report aggregation: \*\*failure\*\*/);
  });
}

test('the final workflow step reports unavailable counts when rendering fails', async context => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), 'rspress-workflow-summary-failed-'),
  );
  context.after(() =>
    import('node:fs/promises').then(({ rm }) =>
      rm(root, { recursive: true, force: true }),
    ),
  );
  const reports = path.join(root, 'midscene-report-shards');
  await writeShard(reports, 'shard-1', 'success', 'CHAT-01', 'visual-model');
  await writeFile(
    path.join(
      reports,
      'midscene-shard-1',
      '.midscene',
      'test-results',
      'run-1',
      'summary.json',
    ),
    'invalid JSON',
  );
  await assert.rejects(runWorkflowSummary(root), { code: 1 });
  const markdown = await readFile(
    path.join(root, 'visible-summary.md'),
    'utf8',
  );
  assert.equal(markdown.match(/^## /gm).length, 1);
  assert.match(markdown, /Summary unavailable/);
  assert.match(markdown, /Case counts could not be read/);
  assert.match(markdown, /runs\/123#artifacts/);
  assert.match(markdown, /runs\/456#artifacts/);
  assert.doesNotMatch(markdown, /All .* cases passed|0 total|<img|runner-step/);
});
