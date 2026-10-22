import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.argv[2];
const files = await readdir(root).catch(error => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
const reports = await Promise.all(
  files
    .filter(file => file.endsWith('.json'))
    .map(async file =>
      JSON.parse(await readFile(path.join(root, file), 'utf8')),
    ),
);
const order = ['baseline', 'prompt', 'parallel', 'combined'];
reports.sort((a, b) => order.indexOf(a.mode) - order.indexOf(b.mode));
const baseline = reports.find(
  report => report.mode === 'baseline' && !report.probe,
);
console.log('## Midscene speed experiment\n');
console.log(
  'Same cases and framework version; retries disabled. Prompt-merged checks are **not independent assertions**. A faster failed run is not an equivalent passing result.\n',
);
console.log(
  '| Mode | Version | Passed / total | Not run | Time | Relative speed | Peak files | Model calls | Merged assertions |',
);
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const report of reports) {
  const summary = report.summary;
  const metrics = report.metrics;
  const completeCalls =
    metrics?.collection?.fields?.modelCallCount === 'complete' ||
    metrics?.collection?.status === 'complete';
  console.log(
    `| ${report.mode} | ${report.midsceneVersion} | ${summary ? `${summary.passed}/${summary.total}` : 'runner failed'} | ${summary?.notRun ?? 'unknown'} | ${(report.wallMs / 60_000).toFixed(2)} min | ${baseline ? (baseline.wallMs / report.wallMs).toFixed(2) + '×' : 'pending'} | ${report.maxActiveFiles} | ${metrics ? metrics.modelCallCount + (completeCalls ? '' : ' (partial/unknown)') : 'unknown'} | ${report.manifest.reduce((sum, item) => sum + item.mergedAssertions, 0)} |`,
  );
}
if (!reports.length)
  console.log(
    '\nNo completed measurement file. Inspect the failed setup/execution step.',
  );
console.log(
  '\nDownload speed-metrics artifacts for per-case timings, model usage and concurrency events, and speed-reports artifacts for the native Midscene HTML report.',
);
