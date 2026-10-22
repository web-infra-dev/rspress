import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { collectWorkflowDocument } from '@midscene/test';
import { discoverTestFiles, loadTestProject } from '@midscene/test/config';
import { fixturePolicy } from './original-fixture-data.ts';

const loaded = await loadTestProject(resolve('midscene.config.ts'));
const actual = {};
for (const project of loaded.projects) {
  for (const absolutePath of discoverTestFiles(process.cwd(), project.files)) {
    const document = collectWorkflowDocument(
      {
        projectId: project.projectId,
        projectName: project.name,
        absolutePath,
        sourcePath: relative(process.cwd(), absolutePath),
      },
      {
        resolveNode: project.nodes.get.bind(project.nodes),
        variables: project.variables,
        env: process.env,
      },
    );
    for (const { definition } of document.cases) {
      assert(
        !(definition.name in actual),
        'Duplicate case: ' + definition.name,
      );
      const nodes = definition.steps.map(step => step.node);
      assert.equal(nodes[0], 'app.open');
      assert.equal(nodes.filter(node => node === 'app.open').length, 1);
      if (definition.name.startsWith('STATIC-')) {
        assert.equal(
          definition.steps[0].input.javascript,
          false,
          'Static cases must disable JavaScript in browser setup',
        );
        assert.equal(
          definition.steps[0].input.mode,
          'production',
          'Static cases must exercise a production build',
        );
      }
      assert(
        nodes.includes('aiAct') && nodes.includes('aiAssert'),
        'Actions and independent assertions required',
      );
      assert(
        nodes.every(node =>
          ['app.open', 'aiAct', 'aiAssert', 'fixture.update'].includes(node),
        ),
        'No UI-operation helpers or atomic actions',
      );
      if (nodes.includes('fixture.update')) {
        assert(
          fixturePolicy(definition.steps[0].input.fixture).isolated,
          'Fixture updates require an isolated source copy',
        );
      }
      actual[definition.name] = project.name;
    }
  }
}
assert.deepEqual(
  actual,
  JSON.parse(await readFile('case-manifest.json', 'utf8')),
);
assert(Object.keys(actual).length > 0);
console.log(
  'Collected ' +
    Object.keys(actual).length +
    ' AI-native cases without model calls.',
);
