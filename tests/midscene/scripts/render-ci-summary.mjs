#!/usr/bin/env node

import { access, readFile, readdir, appendFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const parseArguments = argv => {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error(`Invalid argument near ${key ?? '<end>'}`);
    }
    options[key.slice(2)] = value;
  }
  return options;
};

const walk = async (directory, predicate) => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true }).catch(
    error => {
      if (error.code === 'ENOENT') return [];
      throw error;
    },
  )) {
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(item, predicate)));
    else if (entry.isFile() && predicate(item)) files.push(item);
  }
  return files;
};

const formatDuration = durationMs => {
  if (!Number.isFinite(durationMs) || durationMs < 0) return '—';
  const seconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
};

const markdownCell = value =>
  String(value ?? '')
    .replaceAll('\\', '\\\\')
    .replaceAll('|', '\\|')
    .replaceAll('[', '\\[')
    .replaceAll(']', '\\]')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll(/[\r\n]+/g, ' ');

const html = value =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const newest = (left, right) =>
  Date.parse(left.startedAt ?? '') >= Date.parse(right.startedAt ?? '')
    ? left
    : right;

const normalizedBaseUrl = value => {
  const url = new URL(value);
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url;
};

const reportUrl = (baseUrl, reportPath) =>
  new URL(reportPath, normalizedBaseUrl(baseUrl)).href;

const caseUrl = (baseUrl, testCase) => {
  const url = new URL(testCase.reportPath, normalizedBaseUrl(baseUrl));
  if (testCase.stepId) {
    url.hash = new URLSearchParams({
      'runner-step': testCase.stepId,
    }).toString();
  }
  return url.href;
};

const normalizeJsonControlCharacters = source => {
  let normalized = '';
  let insideString = false;
  let escaped = false;
  for (const character of source) {
    if (!insideString) {
      normalized += character;
      if (character === '"') insideString = true;
    } else if (escaped) {
      normalized += character;
      escaped = false;
    } else if (character === '\\') {
      normalized += character;
      escaped = true;
    } else if (character === '"') {
      normalized += character;
      insideString = false;
    } else if (character.charCodeAt(0) <= 0x1f) {
      normalized += `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`;
    } else {
      normalized += character;
    }
  }
  return normalized;
};

const reportDumps = source =>
  [
    ...source.matchAll(
      /<script\s+([^>]*\btype=["']midscene_web_dump["'][^>]*)>\s*(\{[\s\S]*?)<\/script>/g,
    ),
  ].map(match => JSON.parse(normalizeJsonControlCharacters(match[2])));

const testRunDumps = source =>
  [
    ...source.matchAll(
      /<script\s+[^>]*\btype=["']midscene_test_run_dump["'][^>]*>\s*(\{[\s\S]*?)<\/script>/g,
    ),
  ].map(match => JSON.parse(normalizeJsonControlCharacters(match[1])));

const loadAttempt = async (summaryFile, attempt) => {
  if (!attempt?.resultFile) return null;
  const resultFile = path.join(path.dirname(summaryFile), attempt.resultFile);
  return JSON.parse(await readFile(resultFile, 'utf8'));
};

const failureReason = attempt => {
  const steps = [
    ...(attempt?.beforeEach ?? []),
    ...(attempt?.steps ?? []),
    ...(attempt?.afterEach ?? []),
  ];
  const failed = steps.findLast(step => step?.status === 'failed') ?? attempt;
  const value =
    failed?.error?.message ?? failed?.error ?? failed?.output?.summary;
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : 'Midscene case failed';
};

const modelsFromReports = async directory => {
  const models = new Set();
  const metadataFiles = await walk(
    directory,
    file => path.basename(file) === 'model.json',
  );
  for (const file of metadataFiles) {
    const metadata = JSON.parse(await readFile(file, 'utf8'));
    if (metadata.modelName) {
      models.add(
        metadata.modelFamily
          ? `${metadata.modelName} (${metadata.modelFamily})`
          : metadata.modelName,
      );
    }
  }
  if (models.size) return [...models].sort();
  const reports = await walk(directory, file => file.endsWith('.html'));
  for (const report of reports) {
    const source = await readFile(report, 'utf8');
    for (const match of source.matchAll(
      /"modelName"\s*:\s*("(?:\\.|[^"\\])*")/g,
    )) {
      try {
        const model = JSON.parse(match[1]);
        if (model) models.add(model);
      } catch {
        // Model metadata is optional; results and screenshots remain usable without it.
      }
    }
  }
  return [...models].sort();
};

const nativeReportFor = async (reportsDirectory, record) => {
  if (record.report) {
    const report = path.resolve(
      path.dirname(record.summaryFile),
      record.report,
    );
    if (
      !(await access(report).then(
        () => true,
        () => false,
      ))
    )
      return null;
    return {
      file: report,
      path: path.relative(reportsDirectory, report).split(path.sep).join('/'),
    };
  }
  const { summaryFile } = record;
  const artifactRoot = summaryFile.slice(
    0,
    summaryFile.indexOf(`${path.sep}.midscene${path.sep}`),
  );
  const reports = (
    await walk(path.join(artifactRoot, 'midscene_run', 'report'), file =>
      file.endsWith('.html'),
    )
  ).filter(file => {
    const name = path.basename(file);
    const parent = path.basename(path.dirname(file));
    return (
      name.startsWith('test-run-') ||
      name.startsWith('midscene-e2e-') ||
      parent.startsWith('midscene-e2e-')
    );
  });
  const report = reports.sort().at(-1);
  return report
    ? {
        file: report,
        path: path.relative(reportsDirectory, report).split(path.sep).join('/'),
      }
    : null;
};

const evidenceForCase = async (reportsDirectory, report, caseId, passed) => {
  if (!report || !caseId) return {};
  const source = await readFile(report.file, 'utf8').catch(() => null);
  if (!source) return {};
  const reportCase = testRunDumps(source)
    .flatMap(run => run.projects ?? [])
    .flatMap(project => project.documents ?? [])
    .flatMap(document => document.cases ?? [])
    .find(testCase => testCase.caseId === caseId);
  const attempt = reportCase?.attempts?.at(-1);
  if (!attempt) return {};
  const steps = [
    ...(attempt.beforeEach ?? []),
    ...(attempt.steps ?? []),
    ...(attempt.afterEach ?? []),
  ];
  const hasAgentDetails = step =>
    Array.isArray(step?.agentDetails) && step.agentDetails.length;
  const step = passed
    ? steps.findLast(hasAgentDetails)
    : (steps.find(item => item.status === 'failed' && hasAgentDetails(item)) ??
      steps.find(item => item.status === 'failed') ??
      steps.findLast(hasAgentDetails));
  if (!step) return {};

  const dumps = reportDumps(source);
  let screenshotId = null;
  for (const detail of [...(step.agentDetails ?? [])].reverse()) {
    for (const dump of dumps) {
      const execution = dump.executions?.find(
        item => item.id === detail.executionId,
      );
      const task = execution?.tasks?.findLast(
        item => item.uiContext?.screenshot?.id,
      );
      if (task) {
        screenshotId = task.uiContext.screenshot.id;
        break;
      }
    }
    if (screenshotId) break;
  }

  let screenshotPath = null;
  if (screenshotId) {
    const screenshotDirectory = path.join(
      path.dirname(report.file),
      'screenshots',
    );
    const filename = (
      await readdir(screenshotDirectory).catch(error => {
        if (error.code === 'ENOENT') return [];
        throw error;
      })
    ).find(name => name.slice(0, name.lastIndexOf('.')) === screenshotId);
    if (filename) {
      screenshotPath = path
        .relative(reportsDirectory, path.join(screenshotDirectory, filename))
        .split(path.sep)
        .join('/');
    }
  }
  return { stepId: step.id ?? null, screenshotPath };
};

export async function collectReportData(
  reportsDirectory,
  expectedProjects = [],
) {
  const summaryFiles = await walk(
    reportsDirectory,
    file => path.basename(file) === 'summary.json',
  );
  const summariesByProject = new Map();
  for (const summaryFile of summaryFiles) {
    const summary = JSON.parse(await readFile(summaryFile, 'utf8'));
    for (const project of summary.projects ?? []) {
      const record = { ...summary, project, summaryFile };
      const previous = summariesByProject.get(project.name);
      summariesByProject.set(
        project.name,
        previous ? newest(previous, record) : record,
      );
    }
  }

  const projectNames = expectedProjects.length
    ? expectedProjects
    : [...summariesByProject.keys()].sort((left, right) =>
        left.localeCompare(right, undefined, { numeric: true }),
      );
  const projects = [];
  for (const name of projectNames) {
    const record = summariesByProject.get(name);
    if (!record) {
      projects.push({
        name,
        status: 'missing',
        durationMs: null,
        reportPath: null,
        cases: [],
      });
      continue;
    }
    const report = await nativeReportFor(reportsDirectory, record);
    const cases = [];
    for (const testCase of record.project.cases ?? []) {
      const attemptRef = testCase.attempts?.at(-1);
      const attempt = await loadAttempt(record.summaryFile, attemptRef).catch(
        () => null,
      );
      const passed = testCase.status === 'success';
      const evidence = await evidenceForCase(
        reportsDirectory,
        report,
        testCase.caseId,
        passed,
      ).catch(() => ({}));
      cases.push({
        name: testCase.name,
        status: testCase.status,
        durationMs: attempt?.durationMs ?? null,
        reason: passed ? '' : failureReason(attempt),
        reportPath: report?.path ?? null,
        ...evidence,
      });
    }
    projects.push({
      name,
      status: record.project.status,
      durationMs: record.project.lifecycle?.durationMs ?? record.durationMs,
      reportPath: report?.path ?? null,
      cases,
    });
  }
  return { projects, models: await modelsFromReports(reportsDirectory) };
}

const totalsFor = projects => {
  const cases = projects.flatMap(project =>
    project.cases.map(testCase => ({ ...testCase, project: project.name })),
  );
  const passed = cases.filter(testCase => testCase.status === 'success').length;
  const notRun = cases.filter(testCase => testCase.status === 'not-run').length;
  return {
    cases,
    passed,
    notRun,
    failed: cases.length - passed - notRun,
    total: cases.length,
  };
};

const missingNativeReports = projects =>
  projects.filter(
    project => project.status === 'success' && !project.reportPath,
  );

export function caseSetIssues(projects, manifest) {
  if (!manifest) return [];
  const reported = new Map();
  const issues = [];
  for (const project of projects) {
    for (const testCase of project.cases) {
      const expectedShard = manifest[testCase.name];
      const actualShard = project.name.replace(/^web-/, '');
      if (!expectedShard)
        issues.push(`Unexpected case: ${testCase.name} (${actualShard})`);
      else if (expectedShard !== actualShard) {
        issues.push(
          `Wrong shard: ${testCase.name} (expected ${expectedShard}, found ${actualShard})`,
        );
      }
      if (reported.has(testCase.name))
        issues.push(`Duplicate case: ${testCase.name}`);
      reported.set(testCase.name, true);
    }
  }
  for (const name of Object.keys(manifest)) {
    if (!reported.has(name))
      issues.push(`Missing case: ${name} (${manifest[name]})`);
  }
  return issues;
}

const caseName = (pagesUrl, testCase, reportAvailable) => {
  const name = markdownCell(testCase.name);
  return reportAvailable && testCase.reportPath
    ? `[${name}](${caseUrl(pagesUrl, testCase)})`
    : name;
};

const caseScreenshot = (pagesUrl, testCase, reportAvailable) => {
  if (!reportAvailable || !testCase.reportPath || !testCase.screenshotPath)
    return '—';
  const target = html(caseUrl(pagesUrl, testCase));
  const image = html(reportUrl(pagesUrl, testCase.screenshotPath));
  const name = html(testCase.name)
    .replaceAll('|', '&#124;')
    .replaceAll(/[\r\n]+/g, ' ');
  return `<a href="${target}"><img src="${image}" alt="${name}" width="160"></a>`;
};

const caseRow = (pagesUrl, testCase, detail, reportAvailable) =>
  `| ${markdownCell(testCase.project)} | ${caseName(pagesUrl, testCase, reportAvailable)} | ${caseScreenshot(pagesUrl, testCase, reportAvailable)} | ${markdownCell(detail)} | ${formatDuration(testCase.durationMs)} |`;

export function renderMarkdown({
  projects,
  models,
  pagesUrl,
  runUrl,
  producerResult = 'success',
  caseInventoryIssues = [],
  publishedReportPath,
  sourceRunId,
  reportResult,
  publicationResult,
}) {
  const totals = totalsFor(projects);
  const incompleteProjects = projects.filter(
    project => project.status !== 'success',
  );
  const failures = totals.cases.filter(
    testCase => testCase.status !== 'success',
  );
  const passedCases = totals.cases.filter(
    testCase => testCase.status === 'success',
  );
  const missingReports = missingNativeReports(projects);
  const reportPath =
    publishedReportPath ??
    (projects.length === 1 ? projects[0].reportPath : null);
  const reportAvailable = Boolean(reportPath);
  const shardReportsAvailable =
    Boolean(pagesUrl) && projects.some(project => project.reportPath);
  const infrastructureFailures = incompleteProjects.filter(
    project => !failures.some(testCase => testCase.project === project.name),
  );
  const unreportedFailure =
    producerResult !== 'success' &&
    failures.length === 0 &&
    infrastructureFailures.length === 0;
  const missingMergedReport =
    projects.length > 1 &&
    !reportAvailable &&
    incompleteProjects.length === 0 &&
    missingReports.length === 0 &&
    caseInventoryIssues.length === 0;
  const needsAttention =
    failures.length +
    infrastructureFailures.length +
    missingReports.length +
    Number(unreportedFailure) +
    Number(missingMergedReport) +
    caseInventoryIssues.length;
  const complete =
    producerResult === 'success' && totals.total > 0 && needsAttention === 0;
  const sections = [
    `## Rspress × Midscene · ${complete ? 'passed' : 'failure captured'}`,
    '',
    `**${complete ? '✅ ' : ''}${needsAttention} need attention · ${passedCases.length} passed**`,
    '',
    `**Cases:** ${totals.total} total · ${totals.passed} passed · ${totals.failed} failed · ${totals.notRun} not run`,
    '',
    `**Models:** ${models.length ? models.map(markdownCell).join(', ') : 'not recorded'}`,
    '',
    reportAvailable && pagesUrl
      ? `**[Open the Midscene Test report](${reportUrl(pagesUrl, reportPath)})** · [Download the artifact](${runUrl}#artifacts)`
      : `[Download the artifact](${runUrl}#artifacts) · ${reportAvailable ? 'Native Midscene Test report included' : 'Native Midscene Test report unavailable'}`,
    '',
  ];

  if (sourceRunId) {
    const sourceUrl = new URL(sourceRunId, runUrl.replace(/\/$/, '')).href;
    sections.push(
      `Report source: [run ${sourceRunId}](${sourceUrl}). This run makes no new model calls. [Source-run artifacts](${sourceUrl}#artifacts).`,
      '',
    );
  }
  if (reportResult && reportResult !== 'success') {
    sections.push(
      `Report aggregation: **${markdownCell(reportResult)}**. Results below use the available shard data. [Inspect the workflow run](${runUrl}).`,
      '',
    );
  }
  if (publicationResult && !pagesUrl) {
    sections.push(
      `Pages publication: **${markdownCell(publicationResult)}**. Web report links are unavailable. Download the available artifacts to inspect reports and screenshots.`,
      '',
    );
  }
  if (!pagesUrl) {
    sections.push(
      complete
        ? `🎉 All ${passedCases.length} cases passed.`
        : needsAttention
          ? '⚠️ Tests or report generation need attention. See the job logs and artifacts for details.'
          : 'No cases were reported.',
      '',
      'The published Summary shows case tables with clickable screenshots after Pages deployment succeeds. If publication is skipped or fails, use the artifact downloads above.',
      '',
    );
    return sections.join('\n');
  }
  sections.push(
    '### Shard results',
    '',
    '| Shard | Result | Total | Passed | Failed | Not run | Duration |',
    '|:--|:--|--:|--:|--:|--:|--:|',
    ...projects.map(project => {
      const counts = totalsFor([project]);
      return `| ${markdownCell(project.name)} | ${markdownCell(project.status)} | ${counts.total} | ${counts.passed} | ${counts.failed} | ${counts.notRun} | ${formatDuration(project.durationMs)} |`;
    }),
    '',
  );

  if (needsAttention) {
    sections.push(
      '### Needs attention',
      '',
      ...caseInventoryIssues.map(issue => `- ${markdownCell(issue)}`),
      ...(caseInventoryIssues.length ? [''] : []),
      '| Shard | Case | Screenshot | Status / reason | Duration |',
      '|:--|:--|:--|:--|--:|',
      ...infrastructureFailures.map(
        project =>
          `| ${markdownCell(project.name)} | — | — | ❌ ${markdownCell(project.status)} · [Workflow run](${runUrl}) | ${formatDuration(project.durationMs)} |`,
      ),
      ...missingReports.map(
        project =>
          `| ${markdownCell(project.name)} | — | — | ❌ Native report missing · [Workflow run](${runUrl}) | ${formatDuration(project.durationMs)} |`,
      ),
      ...(missingMergedReport
        ? [
            `| Workflow | — | — | ❌ Native report merge unavailable · [Workflow run](${runUrl}) | — |`,
          ]
        : []),
      ...(unreportedFailure
        ? [
            `| Workflow | — | — | ❌ ${markdownCell(producerResult)} · [Workflow run](${runUrl}) | — |`,
          ]
        : []),
      ...failures
        .sort(
          (left, right) =>
            Number(left.status === 'not-run') -
            Number(right.status === 'not-run'),
        )
        .map(testCase =>
          caseRow(
            pagesUrl,
            testCase,
            `${testCase.status === 'not-run' ? '⏭️ Not run' : '❌ Failed'}: ${testCase.reason}`,
            shardReportsAvailable,
          ),
        ),
      '',
    );
  } else if (complete) {
    sections.push(`🎉 All ${passedCases.length} cases passed.`, '');
  } else {
    sections.push('No cases were reported.', '');
  }

  sections.push(
    '<details>',
    `<summary>Appendix: passed cases (${passedCases.length})</summary>`,
    '',
    '| Shard | Case | Screenshot | Status | Duration |',
    '|:--|:--|:--|:--|--:|',
    ...passedCases.map(testCase =>
      caseRow(pagesUrl, testCase, '✅ Passed', shardReportsAvailable),
    ),
    '',
    '</details>',
    '',
    ...(shardReportsAvailable
      ? [
          'Click a screenshot or case name to open its exact step in the native Midscene report.',
        ]
      : ['Download the artifact to inspect available native shard reports.']),
    '',
  );
  return sections.join('\n');
}

export async function buildSummary(options) {
  const sourceRunId = options['source-run-id'];
  if (sourceRunId && !/^\d+$/.test(sourceRunId))
    throw new Error('Source run ID must be numeric');
  const reportsDirectory = path.resolve(options['reports-dir']);
  const expectedProjects = (options['expected-projects'] ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  const data = await collectReportData(reportsDirectory, expectedProjects);
  const manifest = options['case-manifest']
    ? JSON.parse(await readFile(path.resolve(options['case-manifest']), 'utf8'))
    : null;
  const values = {
    ...data,
    caseInventoryIssues: caseSetIssues(data.projects, manifest),
    pagesUrl: options['pages-url'],
    runUrl: options['run-url'],
    producerResult: options['producer-result'],
    sourceRunId,
    reportResult: options['report-result'],
    publicationResult: options['publication-result'],
    publishedReportPath: await access(
      path.join(reportsDirectory, 'native-report', 'index.html'),
    ).then(
      () => 'index.html',
      () => (data.projects.length === 1 ? data.projects[0].reportPath : null),
    ),
  };
  if (options.output)
    await appendFile(options.output, `${renderMarkdown(values)}\n`);
  return values;
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  buildSummary(parseArguments(process.argv.slice(2))).catch(error => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
