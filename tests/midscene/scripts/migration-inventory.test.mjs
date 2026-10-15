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
  assert.equal(inventory.assertionReviewComplete, true);
  assert.equal(inventory.allOriginalAssertionsPreserved, false);
  const originals = new Set();
  for (const entry of inventory.cases) {
    assert(
      [
        'replaced-by-midscene',
        'ui-replaced-technical-retained',
        'retained-technical',
      ].includes(entry.replacementStatus),
      'Unreviewed original: ' + entry.name,
    );
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
    if (entry.replacementStatus) {
      assert(!entry.reason.includes('All original exact assertions remain'));
    }
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

test('reviewed originals retain their named technical tests', async () => {
  for (const entry of inventory.cases) {
    if (
      !['ui-replaced-technical-retained', 'retained-technical'].includes(
        entry.replacementStatus,
      )
    )
      continue;
    assert(
      entry.remainingTestName || entry.remainingTestExpression,
      'Missing retained test: ' + entry.name,
    );
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
    const expressions = [];
    const visit = node => {
      if (
        ts.isCallExpression(node) &&
        node.expression.getText(syntax) === 'test'
      ) {
        if (ts.isStringLiteral(node.arguments[0]))
          titles.push(node.arguments[0].text);
        else expressions.push(node.arguments[0].getText(syntax));
      }
      ts.forEachChild(node, visit);
    };
    visit(syntax);
    if (entry.remainingTestName)
      assert(titles.includes(entry.remainingTestName), entry.name);
    else {
      assert.equal(entry.source, 'e2e/fixtures/nav-link/index.test.ts');
      assert.equal(
        entry.remainingTestExpression,
        'JSON.stringify(clickOption)',
      );
      assert(expressions.includes(entry.remainingTestExpression), entry.name);
      for (const option of [
        "button: 'middle'",
        "['Shift']",
        "['Meta']",
        "['Control']",
      ])
        assert(text.includes(option), 'Missing modifier case: ' + option);
    }
    if (entry.replacementStatus === 'ui-replaced-technical-retained') {
      assert(!titles.includes(entry.name.split(' > ').at(-1)), entry.name);
    }
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

test('layout and content splits preserve structural and callback contracts', async () => {
  const fixture = name =>
    readFile(
      new URL(
        '../../../e2e/fixtures/' + name + '/index.test.ts',
        import.meta.url,
      ),
      'utf8',
    );
  const layout = await fixture('custom-layout');
  for (const selector of [
    'header.rp-nav',
    '.rp-doc-layout__sidebar',
    '.rp-doc-layout__outline',
    '.rp-doc-footer',
    '.rp-doc-layout__container',
    '.rp-toc-item',
  ]) {
    assert(layout.includes(selector), selector);
  }
  assert(layout.includes('rp-doc-layout__outline--open'));
  const callout = await fixture('github-alert-mdxjs');
  for (const count of [9, 2])
    assert(callout.includes('toHaveCount(' + count + ')'));
  assert(callout.includes('expect(containerTypes).toEqual('));
  const hooks = await fixture('search-hooks');
  assert(hooks.includes("['beforeSearch', 'Foo', 'onSearch', 'Foo']"));
  const runtime = await fixture('code-block-runtime');
  assert(runtime.includes("'div.language-js'"));
  assert(runtime.includes("toHaveJSProperty('tagName', 'PRE')"));
  const toc = await fixture('dynamic-toc');
  assert(toc.includes("'title',"));
  assert(toc.includes("toHaveText('**literal** &lt;')"));
  assert(toc.includes("literalItem.locator('strong')"));
  const slots = await fixture('nav-slots');
  assert(slots.includes("'findLastIndex'"));
  assert(slots.includes('expect(errors).toEqual([])'));
  assert(
    slots.includes('document.documentElement.scrollWidth <= window.innerWidth'),
  );
});

test('preview splits retain explicit iframe and container counts', async () => {
  const preview = await readFile(
    new URL(
      '../../../e2e/fixtures/plugin-preview/index.test.ts',
      import.meta.url,
    ),
    'utf8',
  );
  assert(preview.includes('.rp-preview--iframe-follow__device iframe'));
  assert(preview.includes('.rp-fixed-device__iframe'));
  assert(preview.includes("page.locator('iframe')).toHaveCount(1)"));
  assert(preview.includes("page.locator('.rp-preview--internal__card')"));
  const custom = await readFile(
    new URL(
      '../../../e2e/fixtures/plugin-preview-custom-entry/index.test.ts',
      import.meta.url,
    ),
    'utf8',
  );
  assert(custom.includes("page.locator('iframe')).toHaveCount(3)"));
  assert(custom.includes('codeBlockElements).toHaveCount(3)'));
});
