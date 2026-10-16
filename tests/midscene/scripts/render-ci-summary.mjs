import { appendFile, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readNativeResult } from './native-results.mjs';

function contained(root, relative) {
  const file = path.resolve(root, relative);
  const rel = path.relative(root, file);
  if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new Error('Evidence path escapes its directory');
  }
  return file;
}

const cell = value =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('|', '&#124;')
    .replaceAll('[', '&#91;')
    .replaceAll(']', '&#93;')
    .replaceAll(/[\r\n]+/g, ' ');

async function optionalJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function screenshotFor(step, reportRoot, projectRoot) {
  const ids = new Set(
    (step?.report?.traces ?? []).map(trace => trace.executionId),
  );
  for (const source of [...(step?.report?.sources ?? [])].reverse()) {
    // Source paths refer to the producer checkout, not this publishing runner.
    const relative = path.posix.relative(
      `${projectRoot}/midscene_run/report`,
      source.dumpPath,
    );
    const dumpFile = contained(reportRoot, relative);
    const dump = await optionalJson(dumpFile);
    for (const execution of [...(dump?.executions ?? [])].reverse()) {
      if (!ids.has(execution.id)) continue;
      for (const task of [...(execution.tasks ?? [])].reverse()) {
        const shots = [
          ...(task.recorder ?? []).map(item => item.screenshot).reverse(),
          task.uiContext?.screenshot,
        ];
        for (const shot of shots) {
          if (shot?.storage !== 'file' || !shot.path) continue;
          const file = contained(reportRoot, shot.path);
          try {
            if ((await stat(file)).isFile()) return file;
          } catch (error) {
            if (error.code !== 'ENOENT') throw error;
          }
        }
      }
    }
  }
  return null;
}

export async function renderCiSummary({
  reports,
  pagesUrl,
  runId,
  producerResult,
}) {
  if (!/^\d+$/.test(runId)) throw new Error('run-id must be numeric');
  const base = new URL(pagesUrl.endsWith('/') ? pagesUrl : `${pagesUrl}/`);
  if (!['https:', 'http:'].includes(base.protocol))
    throw new Error('Invalid Pages URL');
  const native = await readNativeResult(reports);
  if (!native?.reportPath)
    return '## Midscene E2E\n\nNative report unavailable. Download the workflow artifacts for partial results.\n';
  const { summary, summaryFile, reportPath } = native;
  const urlFor = file =>
    new URL(
      `runs/${runId}/${path.relative(path.resolve(reports), file).split(path.sep).map(encodeURIComponent).join('/')}`,
      base,
    );
  const report = urlFor(path.resolve(reports, reportPath));
  const reportRoot = path.resolve(
    reports,
    'midscene-results/midscene_run/report',
  );
  const rows = [];
  for (const project of summary.projects) {
    for (const testCase of project.cases) {
      const attempt = testCase.attempts.at(-1);
      const result = attempt?.resultFile
        ? await optionalJson(
            contained(path.dirname(summaryFile), attempt.resultFile),
          )
        : null;
      const steps = [
        ...(result?.beforeEach ?? []),
        ...(result?.steps ?? []),
        ...(result?.afterEach ?? []),
      ];
      const failed = steps.find(step =>
        ['failed', 'timeout', 'error'].includes(step.status),
      );
      const step =
        failed ??
        [...steps].reverse().find(item => item.report?.sources?.length);
      const target = new URL(report);
      const stepId = step?.operations?.events?.find(
        event => event.stepId,
      )?.stepId;
      if (stepId)
        target.hash = new URLSearchParams({ 'runner-step': stepId }).toString();
      const screenshot = await screenshotFor(
        step,
        reportRoot,
        summary.projectRoot,
      );
      const image = screenshot
        ? `<a href="${cell(target.href)}"><img src="${cell(urlFor(screenshot).href)}" alt="${cell(testCase.name)}" width="160"></a>`
        : 'No screenshot captured';
      const status =
        testCase.status === 'success' ? '✅ Passed' : `❌ ${testCase.status}`;
      const reason = failed?.error?.message ?? '';
      rows.push({
        passed: testCase.status === 'success',
        text: `| ${cell(project.name)} | ${cell(testCase.name)} | ${image} | ${cell(status)}${reason ? `: ${cell(reason)}` : ''} | ${result ? `${(result.durationMs / 1000).toFixed(1)}s` : '—'} | [Open report](${target.href}) |`,
      });
    }
  }
  const passed = rows.filter(row => row.passed).length;
  const allPassed =
    rows.length > 0 &&
    passed === rows.length &&
    summary.status === 'success' &&
    producerResult === 'success';
  const lines = [
    '## Midscene E2E',
    '',
    `**${passed}/${rows.length} passed · ${allPassed ? '✅ Passed' : '⚠️ Needs attention'}**`,
    '',
    `[Open the Midscene Test report ↗](${report.href})`,
    '',
  ];
  for (const [title, selected] of [
    ['Needs attention', rows.filter(row => !row.passed)],
    ['Passed cases', rows.filter(row => row.passed)],
  ]) {
    if (!selected.length) continue;
    lines.push(
      `### ${title} (${selected.length})`,
      '',
      '| Project | Case | Screenshot | Status / reason | Duration | Report |',
      '|:--|:--|:--|:--|--:|:--|',
      ...selected.map(row => row.text),
      '',
    );
  }
  lines.push(
    'Screenshots and report links open the selected step in the native Midscene report. Cases without captured evidence are explicitly marked.',
    '',
  );
  return lines.join('\n');
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const options = Object.fromEntries(
    Array.from({ length: (process.argv.length - 2) / 2 }, (_, index) => [
      process.argv[2 + index * 2].slice(2),
      process.argv[3 + index * 2],
    ]),
  );
  await appendFile(
    options.output,
    await renderCiSummary({
      reports: options.reports,
      pagesUrl: options['pages-url'],
      runId: options['run-id'],
      producerResult: options['producer-result'],
    }),
  );
}
