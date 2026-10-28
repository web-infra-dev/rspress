import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const inventory = JSON.parse(
  await readFile(new URL('../migration-inventory.json', import.meta.url)),
);
const manifest = JSON.parse(
  await readFile(new URL('../case-manifest.json', import.meta.url)),
);
const ids = new Set(Object.keys(manifest).map(name => name.split(' ')[0]));
const readSource = source =>
  readFile(new URL('../../../' + source, import.meta.url), 'utf8');

function testNames(source, text) {
  const syntax = ts.createSourceFile(
    source,
    text,
    ts.ScriptTarget.Latest,
    true,
  );
  const titles = [];
  const expressions = [];
  const visit = node => {
    if (
      ts.isCallExpression(node) &&
      (node.expression.getText(syntax) === 'test' ||
        (ts.isCallExpression(node.expression) &&
          ['test.for', 'test.each'].includes(
            node.expression.expression.getText(syntax),
          )))
    ) {
      if (ts.isStringLiteral(node.arguments[0]))
        titles.push(node.arguments[0].text);
      else expressions.push(node.arguments[0].getText(syntax));
    }
    ts.forEachChild(node, visit);
  };
  visit(syntax);
  return { titles, expressions };
}

test('all baseline tests remain deterministic alongside supplementary AI cases', async () => {
  assert.equal(inventory.cases.length, 237);
  assert.equal(inventory.assertionReviewComplete, true);
  assert.equal(inventory.allOriginalAssertionsPreserved, true);
  const originals = new Set();
  const files = new Map();
  for (const entry of inventory.cases) {
    assert.equal(entry.replacementStatus, 'retained-technical', entry.name);
    assert.equal(entry.decision, 'retain-deterministic', entry.name);
    assert.equal(entry.status, 'retained');
    assert(entry.source.startsWith('e2e/fixtures/'));
    assert(!entry.source.includes('..'));
    const key = entry.source + ':' + entry.name;
    assert(!originals.has(key), 'Duplicate baseline test: ' + key);
    originals.add(key);
    assert(entry.reason.trim());
    for (const id of entry.candidateCaseIds)
      assert(ids.has(id), 'Unknown supplementary case: ' + id);
    if (!files.has(entry.source))
      files.set(
        entry.source,
        testNames(entry.source, await readSource(entry.source)),
      );
    const { titles, expressions } = files.get(entry.source);
    if (entry.remainingTestName)
      assert(
        titles.includes(entry.remainingTestName),
        'Missing deterministic test: ' + key,
      );
    else {
      assert(
        entry.remainingTestExpression,
        'Missing retained test reference: ' + key,
      );
      assert(expressions.includes(entry.remainingTestExpression), key);
    }
  }
});

test('sidebar convention regression retains exact cardinality, spelling, and order', async () => {
  const source = 'e2e/fixtures/auto-nav-sidebar-dir-convention/index.test.ts';
  const text = await readSource(source);
  assert(text.includes('expect(sidebarTexts.length).toBe(8)'));
  assert(text.includes("expect(sidebarTexts.join(',')).toEqual("));
  const syntax = ts.createSourceFile(
    source,
    text,
    ts.ScriptTarget.Latest,
    true,
  );
  const arrays = [];
  const visit = node => {
    if (
      ts.isArrayLiteralExpression(node) &&
      node.elements.every(ts.isStringLiteral)
    ) {
      arrays.push(node.elements.map(element => element.text));
    }
    ts.forEachChild(node, visit);
  };
  visit(syntax);
  assert(
    arrays.some(
      values =>
        JSON.stringify(values) ===
        JSON.stringify([
          '/guide Page',
          'index md convention',
          'index mdx convention',
          'same name',
          'index in meta',
          'Index in meta',
          'no meta md',
          'no meta mdx',
        ]),
    ),
  );
});

test('restoration retains filesystem assertion and preview cleanup fixes', async () => {
  for (const fixture of ['icon-file-url', 'public-dir', 'plugin-llms']) {
    const text = await readSource('e2e/fixtures/' + fixture + '/index.test.ts');
    assert(text.includes('await pathExists('), fixture);
  }
  const strict = await readSource('e2e/fixtures/ssg-fail-strict/index.test.ts');
  assert(
    strict.includes(
      'await expect(runBuildCommand(appDir)).rejects.toBeInstanceOf(Error)',
    ),
  );
  const assets = await readSource(
    'e2e/fixtures/markdown-link-asset/index.test.ts',
  );
  assert(assets.includes('test.afterEach('));
  assert(assets.includes('app = null'));
  assert(assets.includes("expect(content).toContain('Plain Text')"));
  assert(assets.includes("expect(content).toContain('# Test')"));
});
