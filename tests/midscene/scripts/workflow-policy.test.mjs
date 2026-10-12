import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile(
  new URL('../../../.github/workflows/midscene.yml', import.meta.url),
  'utf8',
);

test('report artifacts share the harness root instead of a runner-wide common ancestor', () => {
  const upload = workflow.slice(
    workflow.indexOf('      - name: Save native reports even after failure'),
    workflow.indexOf('  prepare-report:'),
  );
  assert(upload.includes('tests/midscene/.midscene/'));
  assert(upload.includes('tests/midscene/midscene_run/'));
  assert(upload.includes('tests/midscene/fixture.log'));
  assert(!upload.includes('runner.temp'));
});

test('single-shard downloads explicitly preserve the published shard directory', () => {
  const downloads = workflow.match(
    /name: midscene-shard-1\n {10}path: \$\{\{ runner\.temp \}\}\/midscene-report-shards\/midscene-shard-1/g,
  );
  assert.equal(downloads?.length, 2);
  assert(!workflow.includes('pattern: midscene-shard-*'));
});

test('PR validation does not receive credentials or call the model', () => {
  assert(!workflow.includes('pull_request_target'));
  const validation = workflow.slice(
    workflow.indexOf('  validate:'),
    workflow.indexOf('  midscene:'),
  );
  assert(!validation.includes('secrets.'));
  assert(validation.includes('npm run collect'));
  assert(validation.includes('does not call a model'));
});
test('model credentials are scoped to preflight and AI tests', () => {
  const steps = workflow
    .split(/\n {6}- /)
    .filter(step => step.includes('secrets.'));
  assert.equal(steps.length, 2);
  assert(steps[0].includes('Verify model configuration and vision'));
  assert(steps[1].includes('Run AI-native cases'));
  assert(workflow.includes("github.ref == 'refs/heads/main'"));
  assert(workflow.includes("github.repository == 'web-infra-dev/rspress'"));
});
test('publication requires explicit repository opt-in and verified deployment links', () => {
  assert(workflow.includes('vars.MIDSCENE_PUBLISH_REPO == github.repository'));
  assert(workflow.includes("needs.deploy-report.result == 'success'"));
  assert(workflow.includes('include-hidden-files: true'));
  assert(workflow.includes('if: always()'));
  assert(!workflow.includes('enablement: true'));
});
