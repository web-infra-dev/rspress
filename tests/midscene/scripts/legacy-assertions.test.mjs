import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

test('legacy file-existence checks await their boolean result', async () => {
  for (const fixture of ['icon-file-url', 'plugin-llms', 'public-dir']) {
    const filename = `../../../e2e/fixtures/${fixture}/index.test.ts`;
    const source = await readFile(new URL(filename, import.meta.url), 'utf8');
    const syntax = ts.createSourceFile(
      filename,
      source,
      ts.ScriptTarget.Latest,
      true,
    );
    let calls = 0;
    const visit = node => {
      if (
        ts.isCallExpression(node) &&
        node.expression.getText(syntax) === 'pathExists'
      ) {
        calls++;
        assert(
          ts.isAwaitExpression(node.parent),
          `${fixture}: unawaited pathExists`,
        );
      }
      ts.forEachChild(node, visit);
    };
    visit(syntax);
    assert(calls > 0, fixture);
  }
});

test('strict SSG failure cannot silently accept a successful build', async () => {
  const source = await readFile(
    new URL(
      '../../../e2e/fixtures/ssg-fail-strict/index.test.ts',
      import.meta.url,
    ),
    'utf8',
  );
  assert(
    source.includes(
      'await expect(runBuildCommand(appDir)).rejects.toBeInstanceOf(Error)',
    ),
  );
  assert(!source.includes('catch (err)'));
});
