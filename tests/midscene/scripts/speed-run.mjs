import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { prepareSpeedCases } from './speed-cases.mjs';

const mode = process.argv[2];
if (!['baseline', 'prompt', 'parallel', 'combined'].includes(mode))
  throw new Error('Expected baseline, prompt, parallel, or combined');
const probe = process.argv.includes('--probe');
const concurrency = ['parallel', 'combined'].includes(mode) ? 5 : 1;
const merge = ['prompt', 'combined'].includes(mode);
const root = process.cwd();
const prepared = await prepareSpeedCases({
  root,
  merge,
  probe,
  ids: (process.env.MIDSCENE_SPEED_IDS ?? '').split(',').filter(Boolean),
});
process.env.MIDSCENE_SPEED_CONCURRENCY = String(concurrency);
process.env.MIDSCENE_SPEED_CASES = prepared.pattern;
const output = path.resolve('speed-results');
await mkdir(output, { recursive: true });
const { runTestProject } = await import('@midscene/test/config');
const started = performance.now();
const active = new Set();
let maxActiveFiles = 0;
const concurrencyEvents = [];
let result;
let runnerError;
try {
  result = await runTestProject({
    configPath: path.resolve('midscene.config.ts'),
    onProgress: message => console.log(message),
    onEvent(event) {
      if (event.type === 'document-start') active.add(event.documentId);
      else if (event.type === 'document-end')
        active.delete(event.document.documentId);
      else return;
      maxActiveFiles = Math.max(maxActiveFiles, active.size);
      concurrencyEvents.push({
        elapsedMs: Math.round(performance.now() - started),
        type: event.type,
        active: active.size,
      });
    },
  });
} catch (error) {
  runnerError = { name: error.name, message: error.message };
}
const wallMs = performance.now() - started;
const lock = JSON.parse(
  await readFile(path.join(root, 'package-lock.json'), 'utf8'),
);
const report = {
  mode,
  probe,
  concurrency,
  maxActiveFiles,
  midsceneVersion: lock.packages['node_modules/@midscene/test'].version,
  model: process.env.MIDSCENE_MODEL_NAME,
  family: process.env.MIDSCENE_MODEL_FAMILY,
  wallMs,
  durationMs: result?.durationMs,
  summary: result?.summary,
  metrics: result?.metrics,
  runnerError,
  reportPath: result?.reportPath && path.relative(root, result.reportPath),
  summaryPath: result?.summaryPath && path.relative(root, result.summaryPath),
  cases: result?.cases.map(item => ({
    name: item.name,
    status: item.status,
    durationMs: item.run?.durationMs,
    notRunReason: item.notRunReason,
    errors: [
      ...(item.run?.executionErrors ?? []),
      ...(item.run?.teardownErrors ?? []),
      ...[
        ...(item.run?.beforeEach ?? []),
        ...(item.run?.steps ?? []),
        ...(item.run?.afterEach ?? []),
      ]
        .filter(step => step.error)
        .map(step => ({ node: step.node, ...step.error })),
    ],
  })),
  manifest: prepared.manifest,
  concurrencyEvents,
};
await writeFile(
  path.join(output, `${probe ? 'probe-' : ''}${mode}.json`),
  JSON.stringify(report, null, 2),
);
console.log(
  'SPEED_RESULT',
  JSON.stringify({
    mode,
    probe,
    wallMs,
    maxActiveFiles,
    summary: result?.summary,
    metrics: result?.metrics,
    runnerError,
  }),
);
process.exitCode = result?.exitCode ?? 1;
