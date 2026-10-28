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

test('regular CI delegates execution and artifacts to the pinned Midscene Action', () => {
  const job = workflow.jobs.midscene;
  const actionIndex = job.steps.findIndex(step => step.id === 'midscene-test');
  const action = job.steps[actionIndex];
  assert.equal(
    action.uses,
    'web-infra-dev/midscene-action@5ef922b20a69d69a0f34639c4c867ba2049f6ede',
  );
  assert.equal(action['continue-on-error'], undefined);
  assert.match(action.with.command, /timeout .*node scripts\/run-ci\.mjs$/);
  assert.equal(action.with['working-directory'], 'tests/midscene');
  assert.equal(action.with['artifact-name'], 'midscene-results');
  assert.equal(action.with['publish-pages'], false);
  assert.equal(action.env.MIDSCENE_RETRY, '0');
  assert.equal(
    job.outputs['report-artifact-name'],
    '${{ steps.midscene-test.outputs.report-artifact-name }}',
  );
  assert.ok(
    job.steps.findIndex(
      step => step.name === 'Verify Midscene model compatibility',
    ) < actionIndex,
  );
  assert.equal(
    job.steps.filter(step => step.uses?.startsWith('actions/upload-artifact@'))
      .length,
    0,
  );
});

test('Pages still publishes Action artifacts and renders screenshots even after test failure', () => {
  const pages = workflow.jobs['publish-pages'];
  assert.equal(pages.needs, 'midscene');
  assert.match(pages.if, /always\(\)/);
  const download = pages.steps.find(
    step => step.name === 'Download Midscene test reports',
  );
  assert.equal(
    download.with.name,
    '${{ needs.midscene.outputs.report-artifact-name }}',
  );
  assert.ok(
    pages.steps.some(step => step.run?.includes('render-ci-summary.mjs')),
  );
});
