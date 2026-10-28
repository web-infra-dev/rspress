import path from 'node:path';
import { appendFile, cp, mkdir, writeFile } from 'node:fs/promises';
import { runTestProject } from '@midscene/test/config';
import { prepareSpeedCases } from './speed-cases.mjs';
import { parseFileConcurrency } from './speed-concurrency.ts';

const concurrency = parseFileConcurrency(
  process.env.MIDSCENE_SPEED_CONCURRENCY,
);
// Keep each case isolated so file concurrency also means case concurrency.
// Slow cases observed in runs 40449357256 and 40465278083 start first.
const priorityIds = [
  'PREVIEW-07',
  'INLINE-04',
  'INLINE-03',
  'CONTENT-03',
  'CONTENT-01',
  'NAV-04',
  'INLINE-02',
  'PLAYGROUND-01',
  'STYLE-04',
  'EXTRA-05',
  'TYPEDOC-02',
  'SEARCH-06',
  'SEARCH-08',
  'SEARCH-07',
  'ASSET-01',
  'ASSET-04',
  'COMPONENT-03',
  'AUDIT-05',
  'ASSET-02',
  'ASSET-03',
  'OVERVIEW-01',
  'VIRTUAL-02',
  'PLUGIN-03',
  'READ-12',
  'AUDIT-12',
  'COMPAT-06',
];
const prepared = await prepareSpeedCases({
  root: process.cwd(),
  merge: false,
  priorityIds,
});
// The Action uploads midscene_run and .midscene; retain generated sources there.
await mkdir('midscene_run/case-sources', { recursive: true });
await cp(path.dirname(prepared.pattern), 'midscene_run/case-sources', {
  recursive: true,
});
process.env.MIDSCENE_SPEED_CASES = prepared.pattern;
const active = new Set();
let peak = 0;
const started = performance.now();
const result = await runTestProject({
  configPath: path.resolve('midscene.config.ts'),
  onProgress: message => console.log(message),
  onEvent(event) {
    if (event.type === 'document-start') active.add(event.documentId);
    else if (event.type === 'document-end')
      active.delete(event.document.documentId);
    peak = Math.max(peak, active.size);
  },
});
const measurement = {
  model: process.env.MIDSCENE_MODEL_NAME,
  concurrency,
  maxActiveFiles: peak,
  wallMs: performance.now() - started,
  summary: result.summary,
  metrics: result.metrics,
};
await writeFile(
  'midscene_run/ci-measurement.json',
  JSON.stringify(measurement, null, 2),
);
console.log('CI_MEASUREMENT', JSON.stringify(measurement));
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(
    process.env.GITHUB_STEP_SUMMARY,
    `## Execution timing\n\nModel: ${measurement.model}\n\nConfigured concurrency: ${concurrency}; observed peak: ${peak}.\n\nTest execution: ${(measurement.wallMs / 60_000).toFixed(2)} minutes (excluding installation and report deployment).\n\n`,
  );
}
process.exitCode = result.exitCode;
