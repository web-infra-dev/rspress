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

test('normal and benchmark CI allow minute-quota recovery with bounded request retries', () => {
  for (const name of ['midscene', 'speed-benchmark']) {
    assert.equal(workflow.jobs[name].env.MIDSCENE_MODEL_RETRY_COUNT, '4');
    assert.equal(
      workflow.jobs[name].env.MIDSCENE_MODEL_RETRY_INTERVAL,
      '65000',
    );
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
    undefined,
  );
});
