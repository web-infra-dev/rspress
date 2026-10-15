import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const inventory = JSON.parse(
  await readFile(new URL('../migration-inventory.json', import.meta.url)),
);
const manifest = JSON.parse(
  await readFile(new URL('../case-manifest.json', import.meta.url)),
);
const ids = new Set(Object.keys(manifest).map(name => name.split(' ')[0]));

test('migration inventory accounts for every original test exactly once', async () => {
  assert.equal(inventory.cases.length, 237);
  assert.equal(inventory.allOriginalAssertionsPreserved, false);
  const originals = new Set();
  for (const entry of inventory.cases) {
    assert(entry.source.startsWith('e2e/fixtures/'));
    assert(!entry.source.includes('..'));
    const source = new URL('../../../' + entry.source, import.meta.url);
    if (entry.replacementStatus === 'replaced-by-midscene') {
      const text = await readFile(source, 'utf8').catch(error => {
        if (error.code === 'ENOENT') return '';
        throw error;
      });
      const syntax = ts.createSourceFile(
        entry.source,
        text,
        ts.ScriptTarget.Latest,
        true,
      );
      const title = entry.name.split(' > ').at(-1);
      const visit = node => {
        if (
          ts.isCallExpression(node) &&
          node.expression.getText(syntax) === 'test' &&
          ts.isStringLiteral(node.arguments[0])
        ) {
          assert.notEqual(
            node.arguments[0].text,
            title,
            'Replaced UI test must not remain: ' + title,
          );
        }
        ts.forEachChild(node, visit);
      };
      visit(syntax);
    } else {
      await access(source);
    }
    const key = entry.source + ':' + entry.name;
    assert(!originals.has(key), 'Duplicate original test: ' + key);
    originals.add(key);
    assert(entry.reason.trim().length > 0);
    if (entry.decision === 'migrate-visible-behavior') {
      assert(entry.candidateCaseIds.length > 0, 'Missing AI mapping: ' + key);
      for (const id of entry.candidateCaseIds) {
        assert(ids.has(id), 'Unknown AI counterpart: ' + id);
      }
    } else {
      assert.equal(entry.decision, 'retain-deterministic');
      assert.equal(entry.status, 'retained');
      assert.deepEqual(entry.candidateCaseIds, []);
    }
  }
});

test('the remaining tab contract test does not replay the migrated user flow', async () => {
  const source = await readFile(
    new URL(
      '../../../e2e/fixtures/tabs-component/index.test.ts',
      import.meta.url,
    ),
    'utf8',
  );
  assert(
    source.includes(
      'preserves empty tab markup and unselected content classes',
    ),
  );
  assert(source.includes('not-selected'));
  assert(!source.includes('.click('));
});

test('split originals retain their named technical tests', async () => {
  for (const entry of inventory.cases) {
    if (entry.replacementStatus !== 'ui-replaced-technical-retained') continue;
    assert(entry.remainingTestName, 'Missing retained test: ' + entry.name);
    const text = await readFile(
      new URL('../../../' + entry.source, import.meta.url),
      'utf8',
    );
    const syntax = ts.createSourceFile(
      entry.source,
      text,
      ts.ScriptTarget.Latest,
      true,
    );
    const titles = [];
    const visit = node => {
      if (
        ts.isCallExpression(node) &&
        node.expression.getText(syntax) === 'test' &&
        ts.isStringLiteral(node.arguments[0])
      )
        titles.push(node.arguments[0].text);
      ts.forEachChild(node, visit);
    };
    visit(syntax);
    assert(titles.includes(entry.remainingTestName), entry.name);
    assert(!titles.includes(entry.name.split(' > ').at(-1)), entry.name);
  }
});

test('replacement retains exact metadata and storage contracts', async () => {
  for (const fixture of ['react-18', 'react-19', 'react-router-dom-6']) {
    const text = await readFile(
      new URL(
        '../../../e2e/fixtures/' + fixture + '/index.test.ts',
        import.meta.url,
      ),
      'utf8',
    );
    assert(text.includes("getPackageVersion('react')"));
    assert(text.includes("getPackageVersion('react-router-dom')"));
    assert(!text.includes("toContainText('Hello world')"));
  }
  const basic = await readFile(
    new URL('../../../e2e/fixtures/basic/index.test.ts', import.meta.url),
    'utf8',
  );
  assert(basic.includes("toHaveAttribute('href', '#hello-world')"));
  const banner = await readFile(
    new URL('../../../e2e/fixtures/banner/index.test.ts', import.meta.url),
    'utf8',
  );
  assert(banner.includes("getItem('rp-banner-closed')"));
  assert(banner.includes(".toBe('true')"));
});
