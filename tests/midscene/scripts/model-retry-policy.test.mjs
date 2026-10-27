import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const yaml = createRequire(require.resolve('@midscene/test'))('js-yaml');
const workflow = yaml.load(
  await readFile(
    new URL('../../../.github/workflows/midscene.yml', import.meta.url),
    'utf8',
  ),
);

test('regular runs avoid minute-long format-retry waits and retain a quota-recovery override', () => {
  assert.equal(workflow.jobs.midscene.env.MIDSCENE_MODEL_RETRY_COUNT, '4');
  assert.equal(
    workflow.jobs.midscene.env.MIDSCENE_MODEL_RETRY_INTERVAL,
    "${{ inputs.request_retry_interval || '2000' }}",
  );
  assert.deepEqual(
    workflow.on.workflow_dispatch.inputs.request_retry_interval.options,
    ['2000', '65000'],
  );
  assert.equal(
    workflow.jobs['speed-benchmark'].env.MIDSCENE_MODEL_RETRY_INTERVAL,
    '65000',
  );
});

test('model verification and execution receive the same optional reasoning setting', () => {
  for (const name of ['midscene', 'speed-benchmark']) {
    const modelSteps = workflow.jobs[name].steps.filter(
      step => step.env?.MIDSCENE_MODEL_API_KEY,
    );
    assert.equal(modelSteps.length, 2);
    for (const step of modelSteps) {
      assert.equal(
        step.env.MIDSCENE_MODEL_REASONING_ENABLED,
        '${{ vars.MIDSCENE_MODEL_REASONING_ENABLED || secrets.MIDSCENE_MODEL_REASONING_ENABLED }}',
      );
    }
  }
});

test('the benchmark defaults to five-file parallel execution, without serial controls ahead of it', () => {
  assert.deepEqual(
    JSON.parse(workflow.on.workflow_dispatch.inputs.speed_modes.default),
    ['parallel'],
  );
  const concurrency = workflow.on.workflow_dispatch.inputs.speed_concurrency;
  assert.equal(concurrency.default, '5');
  assert.deepEqual(concurrency.options, ['5', '10', '15', '20', '30']);
  assert.match(
    workflow.jobs['speed-benchmark'].env.MIDSCENE_SPEED_CONCURRENCY,
    /inputs\.speed_concurrency/,
  );
  assert.equal(
    workflow.jobs.midscene.env.MIDSCENE_SPEED_CONCURRENCY,
    "${{ inputs.file_concurrency || '40' }}",
  );
});

test('regular CI defaults to forty concurrent cases and retains native Pages publication', () => {
  const input = workflow.on.workflow_dispatch.inputs.file_concurrency;
  assert.equal(input.default, '40');
  assert.ok(input.options.includes('40'));
  assert.ok(input.options.includes('60'));
  const run = workflow.jobs.midscene.steps.find(
    step => step.name === 'Run all Midscene cases',
  );
  assert.match(run.run, /node scripts\/run-ci\.mjs/);
  assert.equal(workflow.jobs['publish-pages'].needs, 'midscene');
});

test('the ten-minute performance budget interrupts rather than accepting partial coverage', () => {
  const budget = workflow.on.workflow_dispatch.inputs.speed_timeout_minutes;
  assert.equal(budget.default, '220');
  assert.deepEqual(budget.options, ['10', '220']);
  const step = workflow.jobs['speed-benchmark'].steps.find(
    step => step.name === 'Measure all cases without case retries',
  );
  assert.equal(step['continue-on-error'], undefined);
  assert.match(step.env.SPEED_TIME_LIMIT, /inputs\.speed_timeout_minutes/);
  assert.match(step.run, /case "\$SPEED_TIME_LIMIT" in 10\|220\)/);
  assert.match(step.run, /timeout --signal=TERM --kill-after=60s/);
  assert.doesNotMatch(step.run, /\|\| true/);
});

test('model load stays serialized while publication does not block the next model job', () => {
  const model = workflow.jobs.midscene.concurrency;
  assert.equal(model.group, workflow.jobs['speed-benchmark'].concurrency.group);
  assert.equal(model['cancel-in-progress'], false);
  const pages = workflow.jobs['publish-pages'].concurrency;
  assert.notEqual(pages.group, model.group);
  assert.equal(pages['cancel-in-progress'], false);
  assert.match(workflow.concurrency.group, /github.run_id/);
  assert.equal(workflow.jobs.midscene.env.MIDSCENE_MODEL_TIMEOUT, '120000');
});

test('regular CI validates locally before credentials and reuses only exact builds', () => {
  assert.equal(workflow.jobs.midscene.needs, undefined);
  const steps = workflow.jobs.midscene.steps;
  const validation = steps.findIndex(
    step => step.name === 'Validate definitions before model access',
  );
  assert.ok(validation > 0);
  assert.match(steps[validation].run, /collect.*typecheck.*test:summary/);
  for (const [index, step] of steps.entries()) {
    if (step.env?.MIDSCENE_MODEL_API_KEY) assert.ok(index > validation);
  }
  const restore = steps.find(step => step.id === 'workspace-build');
  assert.equal(restore.with['restore-keys'], undefined);
  assert.match(restore.with.key, /build-inputs.outputs.fingerprint/);
  assert.match(restore.with.key, /node-version/);
});
